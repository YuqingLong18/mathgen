'use client'

import { useState } from 'react'

type DetailLevel = 'simple' | 'usual' | 'detailed'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('usual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [downloadLinks, setDownloadLinks] = useState<{ pdf?: string; tex?: string }>({})
  const [loggingOut, setLoggingOut] = useState(false)

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
      setError('Please select a file')
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

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (!response.ok) {
        // Even if there's an error, check if we have a .tex file to download
        if (data.texUrl) {
          setDownloadLinks({
            tex: data.texUrl,
          })
        }
        setError(`${data.error || 'Processing failed'}${data.details ? ': ' + data.details.substring(0, 200) : ''}`)
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
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-gray-600 hover:text-gray-900 underline-offset-4 underline disabled:opacity-60"
          >
            {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solution Manual Generator
          </h1>
          <p className="text-gray-600">
            Upload math problems and get LaTeX-formatted solutions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (PDF or Image)
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
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop a file here, or click to select
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
                    Select File
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Optional Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any specific instructions..."
            />
          </div>

          {/* Detail Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solution Detail Level
            </label>
            <div className="space-y-2">
              {[
                { value: 'simple', label: 'Simple', desc: 'Only final answers' },
                { value: 'usual', label: 'Usual', desc: 'Main steps and key equations' },
                { value: 'detailed', label: 'Detailed', desc: 'Full derivations and explanations' },
              ].map((option) => (
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
            {loading ? 'Processing...' : 'Generate Solutions'}
          </button>

          {/* Download Links */}
          {(downloadLinks.pdf || downloadLinks.tex) && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Downloads:</p>
              <div className="flex gap-4">
                {downloadLinks.pdf && (
                  <a
                    href={downloadLinks.pdf}
                    download
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Download PDF
                  </a>
                )}
                {downloadLinks.tex && (
                  <a
                    href={downloadLinks.tex}
                    download
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Download LaTeX
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
