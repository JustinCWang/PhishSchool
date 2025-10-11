import { useMemo, useState } from 'react'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

type EmailMetadata = {
  subject?: string | null
  sender?: string | null
  recipient?: string | null
  date?: string | null
  body_preview?: string | null
  attachment_type: 'eml' | 'image'
  content_type?: string | null
}

type AnalysisResult = {
  filename: string
  score: number
  rationale: string
  metadata: EmailMetadata
}

type UploadState =
  | { status: 'idle' }
  | { status: 'loading'; filename?: string }
  | { status: 'success'; result: AnalysisResult }
  | { status: 'error'; message: string }

export default function Detector() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })

  const formattedMetadata = useMemo(() => {
    if (uploadState.status !== 'success') return null
    const { metadata, filename } = uploadState.result
    const entries: Array<{ label: string; value: string }> = [
      { label: 'Filename', value: filename },
    ]

    if (metadata.attachment_type === 'eml') {
      entries.push(
        { label: 'Subject', value: metadata.subject ?? '—' },
        { label: 'From', value: metadata.sender ?? '—' },
        { label: 'To', value: metadata.recipient ?? '—' },
        { label: 'Date', value: metadata.date ?? '—' },
      )
    } else {
      entries.push(
        {
          label: 'Attachment Type',
          value: metadata.attachment_type === 'image' ? 'Image' : metadata.attachment_type,
        },
        { label: 'Content Type', value: metadata.content_type ?? '—' },
      )
    }

    return entries
  }, [uploadState])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setUploadState({ status: 'idle' })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedFile) {
      setUploadState({
        status: 'error',
        message: 'Please choose an .eml file or image first.',
      })
      return
    }

    setUploadState({ status: 'loading', filename: selectedFile.name })
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch(`${API_BASE_URL}/api/uploads/eml`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        const detail = errorPayload?.detail ?? 'Failed to analyze the email.'
        throw new Error(detail)
      }

      const result: AnalysisResult = await response.json()
      setUploadState({ status: 'success', result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      setUploadState({ status: 'error', message })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Detector</h1>
      <p className="text-gray-600">
        Upload an .eml file or an image screenshot. We will parse and score it for phishing risk.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="file"
            accept=".eml,image/*"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={uploadState.status === 'loading'}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {uploadState.status === 'loading' ? 'Analyzing…' : 'Analyze'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {uploadState.status === 'idle' && (
            <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
              Upload an .eml file or image screenshot to receive a phishing likelihood score.
            </div>
          )}

          {uploadState.status === 'loading' && (
            <div className="rounded-md bg-indigo-50 p-4 text-sm text-indigo-700">
              Analyzing {uploadState.filename ?? 'email'}…
            </div>
          )}

          {uploadState.status === 'error' && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {uploadState.message}
            </div>
          )}

          {uploadState.status === 'success' && (
            <div className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-800">
                <div className="flex items-baseline gap-3">
                  <p className="text-lg font-semibold">
                    Score:{' '}
                    <span className="font-bold text-indigo-600">
                      {uploadState.result.score}
                    </span>
                  </p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    (1 = safe, 100 = phishing)
                  </p>
                </div>
                <p className="mt-2 leading-relaxed text-gray-700">
                  {uploadState.result.rationale}
                </p>
              </div>

              {formattedMetadata && (
                <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {uploadState.result.metadata.attachment_type === 'image'
                      ? 'Image details'
                      : 'Email details'}
                  </h2>
                  <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {formattedMetadata.map(({ label, value }) => (
                      <div key={label}>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">
                          {label}
                        </dt>
                        <dd className="text-sm text-gray-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {uploadState.result.metadata.body_preview && (
                    <div className="mt-4 rounded-md bg-gray-50 p-3">
                      <h3 className="text-xs uppercase tracking-wide text-gray-500">
                        {uploadState.result.metadata.attachment_type === 'image'
                          ? 'Attachment summary'
                          : 'Body preview'}
                      </h3>
                      <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                        {uploadState.result.metadata.body_preview}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border-3 border-dashed p-12 text-center transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          <input
            type="file"
            accept=".eml"
            onChange={handleFileChange}
            id="file-upload"
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="mb-4 text-5xl">📧</div>
            <p className="mb-2 text-lg font-semibold text-gray-700">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports email files exported from Outlook, Gmail, and other clients
            </p>
          </label>
          {file && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
              <span>📎</span>
              <span>{file.name}</span>
              <button
                onClick={() => setFile(null)}
                className="ml-2 text-indigo-500 hover:text-indigo-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !file}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚙️</span> Analyzing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🔍 Analyze File
            </span>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="animate-shake rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="animate-fadeIn space-y-4">
          {/* Risk Level Banner */}
          <div
            className={`rounded-2xl border-2 p-8 shadow-lg ${
              result.risk_level === 'safe' || result.risk_level === 'low'
                ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                : result.risk_level === 'medium'
                ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50'
                : 'border-red-200 bg-gradient-to-br from-red-50 to-pink-50'
            }`}
          >
            <div className="mb-4 text-center text-5xl">
              {result.risk_level === 'safe' || result.risk_level === 'low'
                ? '✅'
                : result.risk_level === 'medium'
                ? '⚠️'
                : '🚨'}
            </div>
            <h3 className="mb-2 text-center text-2xl font-bold text-gray-800">
              Analysis Complete
            </h3>
            <p className="text-center text-lg font-semibold capitalize text-gray-700">
              Risk Level: {result.risk_level || 'Unknown'}
            </p>

            {/* Score Bar */}
            {result.score >= 0 && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Phishing Score</span>
                  <span className="text-2xl font-bold text-gray-800">{result.score}/100</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      result.score < 30
                        ? 'bg-green-500'
                        : result.score < 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${result.score}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Email Details */}
          {result.email_data && (
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                <span>📧</span> Email Details
              </h4>
              <div className="space-y-3">
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold text-gray-600">From:</span>
                  <span className="break-all text-gray-800">{result.email_data.from}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold text-gray-600">To:</span>
                  <span className="break-all text-gray-800">{result.email_data.to}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold text-gray-600">Subject:</span>
                  <span className="break-all text-gray-800">{result.email_data.subject}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold text-gray-600">Date:</span>
                  <span className="text-gray-800">{result.email_data.date}</span>
                </div>
              </div>
            </div>
          )}

          {/* Indicators */}
          {result.indicators && result.indicators.length > 0 && (
            <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 p-6 shadow-lg">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                <span>🔍</span> Detected Indicators
              </h4>
              <ul className="space-y-2">
                {result.indicators.map((indicator: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 text-orange-500">▸</span>
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Explanation */}
          {result.explanation && (
            <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                <span>🤖</span> AI Analysis
              </h4>
              <p className="text-sm leading-relaxed text-gray-700">{result.explanation}</p>
            </div>
          )}

          {/* Filename */}
          <div className="text-center text-sm text-gray-500">
            Analyzed: {result.filename}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !error && !loading && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <div className="mb-3 text-4xl">↑</div>
          <p className="text-gray-600">
            Upload a file to get started with phishing detection
          </p>
        </div>
      )}
    </div>
  )
}
