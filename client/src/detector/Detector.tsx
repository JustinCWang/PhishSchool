/**
 * Phishing detector tool.
 *
 * Upload `.eml` files or screenshots to analyze with the backend and render
 * a risk level with details.
 */
import { useState } from 'react'
import { API_BASE_URL } from '../lib/api'

type DetectorResult = {
  filename: string
  score: number
  risk_level: 'safe' | 'low' | 'medium' | 'high'
  email_data: {
    from: string
    to: string
    subject: string
    date: string
  }
  explanation: string
  indicators: string[]
}


/** File upload and analysis UI */
export default function Detector() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DetectorResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)


  /** Handle manual file picker changes */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setResult(null)
    }
  }


  /** Visual drag-over styling */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }


  /** Reset drag-over state */
  const handleDragLeave = () => {
    setIsDragging(false)
  }


  /** Accept dropped files and validate extension */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const fileName = droppedFile.name.toLowerCase()
      const validExtensions = ['.eml', '.png', '.jpg', '.jpeg', '.webp', '.gif']
      const isValid = validExtensions.some(ext => fileName.endsWith(ext))
      
      if (isValid) {
        setFile(droppedFile)
        setError(null)
        setResult(null)
      } else {
        setError('Please upload a .eml file or an image (.png, .jpg, .jpeg, .webp, .gif)')
      }
    }
  }


  /** POST the file to the backend and transform response */
  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }


    setLoading(true)
    setError(null)
    setResult(null)


    try {
      const formData = new FormData()
      formData.append('file', file)


      const response = await fetch(`${API_BASE_URL}/uploads/eml`, {
        method: 'POST',
        body: formData,
      })


      if (!response.ok) {
        throw new Error('Upload failed')
      }


      const data = await response.json()
      // Transform backend response to match typed DetectorResult
      const scoreNum = Number(data.score ?? 0)
      const risk: DetectorResult['risk_level'] = scoreNum >= 70 ? 'high' : scoreNum >= 40 ? 'medium' : 'low'

      const transformedData: DetectorResult = {
        filename: String(data.filename ?? ''),
        score: scoreNum,
        risk_level: risk,
        email_data: {
          from: String(data.metadata?.sender ?? ''),
          to: String(data.metadata?.recipient ?? ''),
          subject: String(data.metadata?.subject ?? ''),
          date: String(data.metadata?.date ?? ''),
        },
        explanation: String(data.rationale ?? ''),
        indicators: data.rationale ? [String(data.rationale)] : [],
      }
      setResult(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent inline-flex items-center gap-3">
          <span>Phishing Detector</span>
          <img src="/phishschoolicon.png" alt="PhishSchool Icon" className="h-12 w-auto object-contain" />
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Upload an email file or screenshot and let AI analyze it for phishing attempts
        </p>
      </div>


      {/* Upload Section */}
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border-3 border-dashed p-12 text-center transition-all ${
            isDragging
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50/50'
          }`}
        >
          <input
            type="file"
            accept=".eml,.png,.jpg,.jpeg,.webp,.gif"
            onChange={handleFileChange}
            id="file-upload"
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="mb-4 text-5xl">📧🖼️</div>
            <p className="mb-2 text-lg font-semibold text-gray-700">
              Drop your email or screenshot here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports .eml files and images (.png, .jpg, .jpeg, .webp, .gif)
            </p>
          </label>
          {file && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700">
              <span>📎</span>
              <span>{file.name}</span>
              <button
                onClick={() => setFile(null)}
                className="ml-2 text-red-500 hover:text-red-700"
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
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
