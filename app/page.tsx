'use client'

import { useState } from 'react'

type DetailLevel = 'simple' | 'usual' | 'detailed'
type UILanguage = 'en' | 'zh'
type SolutionLanguage = 'english' | 'chinese'

type DetailLevelOption = {
  value: DetailLevel
  label: string
  desc: string
}

type SolutionLanguageOption = {
  value: SolutionLanguage
  label: string
  desc: string
}

type Translation = {
  heroTitle: string
  heroSubtitle: string
  logout: string
  loggingOut: string
  uploadLabel: string
  dragDrop: string
  selectFile: string
  removeFile: string
  promptLabel: string
  promptPlaceholder: string
  detailLabel: string
  detailLevels: DetailLevelOption[]
  solutionLanguageLabel: string
  solutionLanguageOptions: SolutionLanguageOption[]
  metadataHeading: string
  titleLabel: string
  dateLabel: string
  creatorLabel: string
  footerLabel: string
  placeholders: {
    title: string
    date: string
    creator: string
    footer: string
  }
  submitIdle: string
  submitLoading: string
  downloadsLabel: string
  downloadPdf: string
  downloadTex: string
  messages: {
    missingFile: string
    unexpectedResponse: string
    genericError: string
  }
}

const translations: Record<UILanguage, Translation> = {
  en: {
    heroTitle: 'Solution Manual Generator',
    heroSubtitle: 'Upload math problems and get LaTeX-formatted solutions',
    logout: 'Logout',
    loggingOut: 'Signing out...',
    uploadLabel: 'Upload File (PDF or Image)',
    dragDrop: 'Drag and drop a file here, or click to select',
    selectFile: 'Select File',
    removeFile: 'Remove',
    promptLabel: 'Optional Prompt',
    promptPlaceholder: 'Add any specific instructions...',
    detailLabel: 'Solution Detail Level',
    detailLevels: [
      { value: 'simple', label: 'Simple', desc: 'Only final answers' },
      { value: 'usual', label: 'Usual', desc: 'Main steps and key equations' },
      { value: 'detailed', label: 'Detailed', desc: 'Full derivations and explanations' },
    ],
    solutionLanguageLabel: 'Solution Language',
    solutionLanguageOptions: [
      { value: 'english', label: 'English', desc: 'Use English for all narration and headings' },
      { value: 'chinese', label: 'Chinese', desc: 'Provide all explanations in Chinese' },
    ],
    metadataHeading: 'Document Information (Optional)',
    titleLabel: 'Title',
    dateLabel: 'Date',
    creatorLabel: 'Creator/Author',
    footerLabel: 'Footer Text',
    placeholders: {
      title: 'e.g., Math 101 Solution Manual',
      date: 'e.g., January 2025',
      creator: 'e.g., Dr. John Smith',
      footer: 'e.g., Confidential - For Educational Use Only',
    },
    submitIdle: 'Generate Solutions',
    submitLoading: 'Processing...',
    downloadsLabel: 'Downloads:',
    downloadPdf: 'Download PDF',
    downloadTex: 'Download LaTeX',
    messages: {
      missingFile: 'Please select a file',
      unexpectedResponse: 'Unexpected server response. Please try again.',
      genericError: 'An error occurred',
    },
  },
  zh: {
    heroTitle: '解题手册生成器',
    heroSubtitle: '上传试题，自动生成 LaTeX 解答',
    logout: '退出登录',
    loggingOut: '正在退出...',
    uploadLabel: '上传文件（PDF 或图片）',
    dragDrop: '将文件拖放到此处，或点击选择',
    selectFile: '选择文件',
    removeFile: '移除',
    promptLabel: '可选提示',
    promptPlaceholder: '填写额外说明...',
    detailLabel: '解析详略程度',
    detailLevels: [
      { value: 'simple', label: '简洁', desc: '仅给出最终答案' },
      { value: 'usual', label: '常规', desc: '包含关键步骤与公式' },
      { value: 'detailed', label: '详细', desc: '完整推导与文字说明' },
    ],
    solutionLanguageLabel: '解答语言',
    solutionLanguageOptions: [
      { value: 'english', label: '英语', desc: '文字部分使用英文' },
      { value: 'chinese', label: '中文', desc: '文字部分全部使用中文' },
    ],
    metadataHeading: '文档信息（可选）',
    titleLabel: '标题',
    dateLabel: '日期',
    creatorLabel: '编写者',
    footerLabel: '页脚文字',
    placeholders: {
      title: '例如：高数作业解析',
      date: '例如：2025 年 1 月',
      creator: '例如：王老师',
      footer: '例如：仅供教学参考',
    },
    submitIdle: '生成解答',
    submitLoading: '正在生成...',
    downloadsLabel: '下载：',
    downloadPdf: '下载 PDF',
    downloadTex: '下载 LaTeX 源文件',
    messages: {
      missingFile: '请先选择文件',
      unexpectedResponse: '服务器返回异常结果，请重试。',
      genericError: '发生未知错误',
    },
  },
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('usual')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [creator, setCreator] = useState('')
  const [footer, setFooter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [downloadLinks, setDownloadLinks] = useState<{ pdf?: string; tex?: string }>({})
  const [loggingOut, setLoggingOut] = useState(false)
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en')
  const [solutionLanguage, setSolutionLanguage] = useState<SolutionLanguage>('english')
  const t = translations[uiLanguage]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError(t.messages.missingFile)
      return
    }

    setLoading(true)
    setError(null)
    setWarning(null)
    setDownloadLinks({})

    const formData = new FormData()
    formData.append('file', file)
    formData.append('prompt', prompt)
    formData.append('detailLevel', detailLevel)
    formData.append('title', title)
    formData.append('date', date)
    formData.append('creator', creator)
    formData.append('footer', footer)
    formData.append('solutionLanguage', solutionLanguage)

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      const contentType = response.headers.get('content-type') || ''
      const responseText = await response.text()

      let data: any = null
      if (contentType.includes('application/json') && responseText) {
        try {
          data = JSON.parse(responseText)
        } catch (parseErr) {
          // Ignore JSON parse errors; fallback to text-based error handling
        }
      }
      
      if (!response.ok) {
        if (data?.texUrl) {
          setDownloadLinks({
            tex: data.texUrl,
          })
        }
        const message = data?.error || data?.message || `Request failed with status ${response.status}`
        const details = data?.details || (!data && responseText ? responseText : '')
        setError(`${message}${details ? ': ' + details.substring(0, 200) : ''}`)
        return
      }

      if (!data) {
        setError(t.messages.unexpectedResponse)
        return
      }

      setDownloadLinks({
        pdf: data.pdfUrl,
        tex: data.texUrl,
      })
      if (data.warning) {
        setWarning(data.warning)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.messages.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setUiLanguage('en')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${uiLanguage === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              aria-pressed={uiLanguage === 'en'}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setUiLanguage('zh')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${uiLanguage === 'zh' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              aria-pressed={uiLanguage === 'zh'}
            >
              中文
            </button>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-gray-600 hover:text-gray-900 underline-offset-4 underline disabled:opacity-60"
          >
            {loggingOut ? t.loggingOut : t.logout}
          </button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.heroTitle}
          </h1>
          <p className="text-gray-600">
            {t.heroSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.uploadLabel}
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            >
              {file ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">{file.name}</p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    {t.removeFile}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {t.dragDrop}
                  </p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer text-sm"
                  >
                    {t.selectFile}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              {t.promptLabel}
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t.promptPlaceholder}
            />
          </div>

          {/* Detail Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.detailLabel}
            </label>
            <div className="space-y-2">
              {t.detailLevels.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    checked={detailLevel === option.value}
                    onChange={(e) => setDetailLevel(e.target.value as DetailLevel)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">{option.label}</span>
                    <span className="text-xs text-gray-500 ml-2">— {option.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Solution Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.solutionLanguageLabel}
            </label>
            <div className="space-y-2">
              {t.solutionLanguageOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    checked={solutionLanguage === option.value}
                    onChange={(e) => setSolutionLanguage(e.target.value as SolutionLanguage)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">{option.label}</span>
                    <span className="text-xs text-gray-500 ml-2">— {option.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Document Metadata */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">{t.metadataHeading}</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.titleLabel}
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={t.placeholders.title}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    {t.dateLabel}
                  </label>
                  <input
                    type="text"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder={t.placeholders.date}
                  />
                </div>
                
                <div>
                  <label htmlFor="creator" className="block text-sm font-medium text-gray-700 mb-1">
                    {t.creatorLabel}
                  </label>
                  <input
                    type="text"
                    id="creator"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder={t.placeholders.creator}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="footer" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.footerLabel}
                </label>
                <input
                  type="text"
                  id="footer"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={t.placeholders.footer}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Warning Message */}
          {warning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">{warning}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t.submitLoading : t.submitIdle}
          </button>

          {/* Download Links */}
          {(downloadLinks.pdf || downloadLinks.tex) && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">{t.downloadsLabel}</p>
              <div className="flex gap-4">
                {downloadLinks.pdf && (
                  <a
                    href={downloadLinks.pdf}
                    download
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    {t.downloadPdf}
                  </a>
                )}
                {downloadLinks.tex && (
                  <a
                    href={downloadLinks.tex}
                    download
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    {t.downloadTex}
                  </a>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
