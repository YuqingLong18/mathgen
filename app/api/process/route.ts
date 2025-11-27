import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import { sanitizeLatex } from '../../../lib/latex-sanitizer'

const execAsync = promisify(exec)

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS || '240000') // default 4 minutes to allow long generations

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

async function parseFormData(req: NextRequest): Promise<{
  file: File | null
  prompt: string
  detailLevel: string
}> {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const prompt = (formData.get('prompt') as string) || ''
  const detailLevel = (formData.get('detailLevel') as string) || 'usual'
  
  return { file, prompt, detailLevel }
}

async function convertPdfToImages(pdfPath: string): Promise<string[]> {
  // For MVP, we'll use a simple approach - convert PDF to images
  // In production, you'd use pdf-poppler or similar
  const outputDir = join('/tmp', `pdf_${Date.now()}`)
  await mkdir(outputDir, { recursive: true })
  
  try {
    // Using pdftoppm if available, otherwise fallback to single page extraction
    await execAsync(`pdftoppm -png "${pdfPath}" "${join(outputDir, 'page')}"`)
    // List generated images
    const fs = require('fs')
    const files = fs.readdirSync(outputDir).filter((f: string) => f.endsWith('.png'))
    return files.map((f: string) => join(outputDir, f))
  } catch (error) {
    // Fallback: return the PDF path itself for GPT to handle
    return [pdfPath]
  }
}

async function imageToBase64(imagePath: string): Promise<string> {
  const imageBuffer = await readFile(imagePath)
  return imageBuffer.toString('base64')
}

async function getImageMimeType(imagePath: string): Promise<string> {
  if (imagePath.endsWith('.png')) return 'image/png'
  if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) return 'image/jpeg'
  if (imagePath.endsWith('.pdf')) return 'application/pdf'
  return 'image/png'
}

/**
 * Attempts to close incomplete LaTeX commands when response is truncated
 */
function closeIncompleteLatexCommands(latex: string): string {
  let result = latex
  
  // Close incomplete \frac commands - handle various incomplete patterns
  // Pattern: \frac{... (missing second argument)
  result = result.replace(/\\frac\{([^}]*)$/gm, '\\frac{$1}{}')
  // Pattern: \frac{...}{ (missing closing brace)
  result = result.replace(/\\frac\{([^}]*)\{$/gm, '\\frac{$1}{}')
  
  // Close incomplete \sqrt commands
  result = result.replace(/\\sqrt\{([^}]*)$/gm, '\\sqrt{$1}')
  
  // Close incomplete \left commands (should have matching \right)
  const leftCount = (result.match(/\\left[\[\(]/g) || []).length
  const rightCount = (result.match(/\\right[\]\)]/g) || []).length
  if (leftCount > rightCount) {
    result += '\\right)'
  }
  
  // Close unclosed begin environments (in reverse order)
  const beginMatches = [...result.matchAll(/\\begin\{([^}]+)\}/g)]
  const endMatches = [...result.matchAll(/\\end\{([^}]+)\}/g)]
  const beginEnvNames = beginMatches.map(m => m[1])
  const endEnvNames = endMatches.map(m => m[1])
  
  // Find unclosed environments
  const envStack: string[] = []
  for (const envName of beginEnvNames) {
    envStack.push(envName)
    const endIndex = endEnvNames.indexOf(envName)
    if (endIndex !== -1) {
      endEnvNames.splice(endIndex, 1)
      envStack.pop()
    }
  }
  
  // Close remaining unclosed environments in reverse order
  for (const envName of envStack.reverse()) {
    result += `\n\\end{${envName}}`
  }
  
  // Count open vs closed braces (but be careful with escaped braces)
  let openBraces = 0
  let closedBraces = 0
  for (let i = 0; i < result.length; i++) {
    if (result[i] === '{' && (i === 0 || result[i - 1] !== '\\')) {
      openBraces++
    } else if (result[i] === '}' && (i === 0 || result[i - 1] !== '\\')) {
      closedBraces++
    }
  }
  const missingBraces = openBraces - closedBraces
  
  // Add missing closing braces
  if (missingBraces > 0) {
    result += '}'.repeat(missingBraces)
  }
  
  // Ensure document is closed if begin{document} exists
  if (result.includes('\\begin{document}') && !result.includes('\\end{document}')) {
    result += '\n\\end{document}'
  }
  
  return result
}

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const overallStart = Date.now()
  const log = (message: string, data?: Record<string, any>) => {
    const duration = `${Date.now() - overallStart}ms`
    if (data) {
      console.info(`[process:${requestId}] ${message}`, { duration, ...data })
    } else {
      console.info(`[process:${requestId}] ${message}`, { duration })
    }
  }

  const session = req.cookies.get('mathgen_session')?.value
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let tempFiles: string[] = []
  
  try {
    const { file, prompt, detailLevel } = await parseFormData(req)
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name
    const isPdf = fileName.toLowerCase().endsWith('.pdf')
    const isImage = /\.(jpg|jpeg|png)$/i.test(fileName)

    if (!isPdf && !isImage) {
      return NextResponse.json({ error: 'Invalid file type. Please upload PDF or image.' }, { status: 400 })
    }

    log('Upload received', {
      fileName,
      fileSize: file.size,
      isPdf,
      isImage,
      detailLevel,
      promptLength: prompt.length,
    })

    // Save uploaded file temporarily
    const tempDir = join('/tmp', `upload_${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
    const tempFilePath = join(tempDir, fileName)
    const arrayBuffer = await file.arrayBuffer()
    await writeFile(tempFilePath, Buffer.from(arrayBuffer))
    tempFiles.push(tempFilePath)
    log('Stored upload to temp', { tempFilePath })

    // Convert PDF to images if needed
    let imagePaths: string[] = []
    if (isPdf) {
      imagePaths = await convertPdfToImages(tempFilePath)
      tempFiles.push(...imagePaths)
      log('Converted PDF to images', { pageCount: imagePaths.length })
    } else {
      imagePaths = [tempFilePath]
    }

    // Prepare images for GPT
    const imageContents = await Promise.all(
      imagePaths.map(async (path) => {
        const base64 = await imageToBase64(path)
        const mimeType = await getImageMimeType(path)
        return {
          type: 'image_url' as const,
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
          },
        }
      })
    )

    // Construct prompt
    const detailLevelMap: Record<string, string> = {
      simple: 'Only numerical or short final answers.',
      usual: 'Main solution steps and key equations, limited verbal explanation.',
      detailed: 'Every logical step and explanation, full derivations, and commentary.',
    }

    const systemPrompt = `You are an expert math teacher. 
Read the attached problem sheet and provide solutions in pure LaTeX code.
Detail level: ${detailLevelMap[detailLevel] || detailLevelMap.usual}

Each question should be labeled clearly (e.g., Q1, Q2, ...).
Do not include explanations outside LaTeX syntax.
Output only valid LaTeX code that can be compiled directly.
IMPORTANT: Ensure all LaTeX commands are properly closed. If the response is long, prioritize completing all questions even if some solutions are shorter.`

    const userPrompt = prompt 
      ? `${systemPrompt}\n\nAdditional instructions: ${prompt}`
      : systemPrompt

    // Call OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o'
    
    const fetchStart = Date.now()
    let response: Response
    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:3000',
          'X-Title': process.env.OPENROUTER_X_TITLE || 'Solution Manual Generator',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                ...imageContents,
              ],
            },
          ],
          max_tokens: 16000, // Increased for longer solution manuals
        }),
        signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
      })
    } catch (fetchError: any) {
      if (fetchError?.name === 'AbortError') {
        log('OpenRouter fetch timed out', { timeoutMs: OPENROUTER_TIMEOUT_MS })
        throw new Error(`OpenRouter request timed out after ${Math.floor(OPENROUTER_TIMEOUT_MS / 1000)}s. Try a smaller file or lower detail level.`)
      }
      log('OpenRouter fetch failed', { error: fetchError?.message || String(fetchError) })
      throw new Error(`OpenRouter request failed: ${fetchError?.message || String(fetchError)}`)
    }
    const fetchDurationMs = Date.now() - fetchStart
    if (fetchDurationMs > OPENROUTER_TIMEOUT_MS * 0.8) {
      console.warn(`OpenRouter response latency: ${fetchDurationMs}ms`)
    }

    const contentType = response.headers.get('content-type') || ''
    const rawBody = await response.text()
    log('OpenRouter response received', {
      status: response.status,
      contentType,
      durationMs: fetchDurationMs,
      bodyLength: rawBody?.length || 0,
    })

    if (!response.ok) {
      let errorMessage = `OpenRouter API error (${response.status}): ${response.statusText}`
      if (contentType.includes('application/json')) {
        try {
          const errorData = JSON.parse(rawBody)
          errorMessage = errorData.error?.message || errorData.error?.text || errorData.message || errorMessage
        } catch (e) {
          // Ignore JSON parsing errors on error bodies
        }
      } else if (rawBody) {
        errorMessage += ` - ${rawBody.substring(0, 200)}`
      }
      throw new Error(errorMessage)
    }

    let completion: any
    try {
      completion = JSON.parse(rawBody || '{}')
    } catch (parseError) {
      throw new Error('Failed to parse OpenRouter response as JSON')
    }

    if (!completion?.choices?.length) {
      throw new Error('OpenRouter response missing choices')
    }
    const choice = completion.choices[0]
    let latexCode = choice?.message?.content || ''
    log('Parsed OpenRouter response', {
      finishReason: choice?.finish_reason,
      latexLength: typeof latexCode === 'string' ? latexCode.length : Array.isArray(latexCode) ? latexCode.length : 0,
    })

    // Handle array-based message content responses (e.g., OpenAI vision format)
    if (Array.isArray(latexCode)) {
      latexCode = latexCode
        .map((part: any) => {
          if (typeof part === 'string') return part
          if (part?.type === 'text' && typeof part.text === 'string') return part.text
          return ''
        })
        .filter(Boolean)
        .join('\n')
    } else if (typeof latexCode !== 'string') {
      latexCode = String(latexCode || '')
    }
    
    // Check if response was truncated or seems incomplete
    const finishReason = choice?.finish_reason
    const isTruncated = finishReason === 'length'

    // Heuristic: detect likely incomplete LaTeX caused by truncation
    const trimmedLatex = latexCode.trim()
    const openBraceCount = (trimmedLatex.match(/\{/g) || []).length
    const closeBraceCount = (trimmedLatex.match(/\}/g) || []).length
    const beginEnvs = [...trimmedLatex.matchAll(/\\begin\{([^}]+)\}/g)].map(m => m[1])
    const endEnvs = [...trimmedLatex.matchAll(/\\end\{([^}]+)\}/g)].map(m => m[1])
    const unclosedEnvCount = beginEnvs.filter(env => {
      const endIndex = endEnvs.indexOf(env)
      if (endIndex !== -1) {
        endEnvs.splice(endIndex, 1)
        return false
      }
      return true
    }).length
    const hasUnclosedDoc =
      trimmedLatex.includes('\\begin{document}') && !trimmedLatex.includes('\\end{document}')
    const trailingCommand =
      /\\frac\{[^}]*$/.test(trimmedLatex) ||
      /\\sqrt\{[^}]*$/.test(trimmedLatex) ||
      /\\left[^\s]*$/.test(trimmedLatex) ||
      trimmedLatex.endsWith('\\')

    const seemsIncomplete =
      openBraceCount > closeBraceCount || unclosedEnvCount > 0 || hasUnclosedDoc || trailingCommand

    if (isTruncated || seemsIncomplete) {
      if (isTruncated) {
        console.warn(`[process:${requestId}] OpenRouter response was truncated due to token limit`)
      } else {
        console.warn(`[process:${requestId}] LaTeX response appears incomplete`)
      }
      // Try to close any open LaTeX commands
      latexCode = closeIncompleteLatexCommands(latexCode)
    }
    
    // Clean up the response - remove markdown code blocks if present
    latexCode = latexCode.replace(/^```latex\n?/gm, '').replace(/^```\n?/gm, '').replace(/```$/gm, '')
    latexCode = latexCode.trim()
    
    // Remove hardcoded SimSun font references that cause issues on macOS
    // Replace with a comment so users know they can customize it
    latexCode = latexCode.replace(/\\setCJKmainfont\{SimSun\}/gi, '% \\setCJKmainfont{SimSun} % Removed for cross-platform compatibility')
    latexCode = latexCode.replace(/\\setCJKmainfont\[[^\]]*\]\{SimSun\}/gi, '% \\setCJKmainfont{SimSun} % Removed for cross-platform compatibility')

    // Validate LaTeX output
    if (!latexCode.includes('\\documentclass') && !latexCode.includes('\\begin{document}')) {
      // Check if content contains Chinese/Japanese/Korean characters
      const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(latexCode)
      
      // Build preamble with optional CJK support
      let preamble = `\\documentclass[12pt]{article}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
`
      
      if (hasCJK) {
        // Use xeCJK - let it use system default fonts for cross-platform compatibility
        // This avoids font-specific errors on different operating systems
        preamble += `\\usepackage{xeCJK}
% xeCJK will automatically use available system fonts
% No specific font is set to ensure cross-platform compatibility
`
      }
      
      latexCode = `${preamble}
\\begin{document}
${latexCode}
\\end{document}`
    }

    // Sanitize LaTeX
    latexCode = sanitizeLatex(latexCode)

    // Create output directory
    const outputDir = join(process.cwd(), 'tmp', `output_${Date.now()}`)
    await mkdir(outputDir, { recursive: true })

    const texPath = join(outputDir, 'solutions.tex')
    await writeFile(texPath, latexCode, 'utf-8')

    // Compile LaTeX to PDF
    try {
      const compileStart = Date.now()
      await execAsync(`cd "${outputDir}" && xelatex -interaction=nonstopmode solutions.tex`)
      const compileDuration = Date.now() - compileStart
      log('LaTeX compilation completed', { compileDurationMs: compileDuration })
      
      const pdfPath = join(outputDir, 'solutions.pdf')
      const pdfBuffer = await readFile(pdfPath)
      
      // Save files for download
      const downloadDir = join(process.cwd(), 'downloads')
      await mkdir(downloadDir, { recursive: true })
      
      const timestamp = Date.now()
      const downloadPdfPath = join(downloadDir, `solutions_${timestamp}.pdf`)
      const downloadTexPath = join(downloadDir, `solutions_${timestamp}.tex`)
      
      await writeFile(downloadPdfPath, pdfBuffer)
      await writeFile(downloadTexPath, latexCode, 'utf-8')

      // Clean up temp files
      for (const f of tempFiles) {
        try {
          await unlink(f)
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      log('Success response ready', { pdfUrl: `/api/download?file=solutions_${timestamp}.pdf` })

      return NextResponse.json({
        pdfUrl: `/api/download?file=solutions_${timestamp}.pdf`,
        texUrl: `/api/download?file=solutions_${timestamp}.tex`,
        warning: isTruncated ? 'Response was truncated due to token limit. Some solutions may be incomplete.' : undefined,
      })
    } catch (compileError: any) {
      console.error(`[process:${requestId}] LaTeX compilation error:`, compileError)
      
      // Save the .tex file even if compilation failed, so user can debug
      const downloadDir = join(process.cwd(), 'downloads')
      await mkdir(downloadDir, { recursive: true })
      
      const timestamp = Date.now()
      const downloadTexPath = join(downloadDir, `solutions_${timestamp}.tex`)
      await writeFile(downloadTexPath, latexCode, 'utf-8')
      
      // Clean up temp files
      for (const f of tempFiles) {
        try {
          await unlink(f)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      return NextResponse.json({
        error: 'LaTeX compilation failed',
        details: compileError.message || compileError.stderr?.substring(0, 500) || 'Unknown error',
        latexCode, // Return the LaTeX code anyway so user can debug
        texUrl: `/api/download?file=solutions_${timestamp}.tex`, // Still provide .tex download
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error(`[process:${requestId}] Processing error:`, error)
    
    // Clean up temp files
    for (const f of tempFiles) {
      try {
        await unlink(f)
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    log('Returning error response', { message: error.message })

    return NextResponse.json({
      error: error.message || 'An error occurred during processing',
    }, { status: 500 })
  }
}
