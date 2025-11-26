import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  const session = request.cookies.get('mathgen_session')?.value
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const fileName = searchParams.get('file')

  if (!fileName) {
    return NextResponse.json({ error: 'File name required' }, { status: 400 })
  }

  // Security: prevent directory traversal
  if (fileName.includes('..') || fileName.includes('/')) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
  }

  try {
    const filePath = join(process.cwd(), 'downloads', fileName)
    const fileBuffer = await readFile(filePath)
    
    const contentType = fileName.endsWith('.pdf')
      ? 'application/pdf'
      : fileName.endsWith('.tex')
      ? 'text/plain'
      : 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
