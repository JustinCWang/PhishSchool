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
    </div>
  )
}
