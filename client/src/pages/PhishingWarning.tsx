import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

interface PhishingWarningData {
  campaign_id: string
  email_id: string
  tracking_id: string
  subject: string
  sender_email: string
  phishing_indicators: string[]
  explanation: string
  clicked_at: string
}

export default function PhishingWarning() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [emailData, setEmailData] = useState<PhishingWarningData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const campaignId = searchParams.get('campaign_id')
  const emailId = searchParams.get('email_id')
  const trackingId = searchParams.get('tracking_id')

  useEffect(() => {
    if (trackingId) {
      loadEmailData(trackingId)
    } else {
      setError('Invalid tracking link')
      setLoading(false)
    }
  }, [trackingId])

  const loadEmailData = async (trackingId: string) => {
    try {
      const response = await fetch(`/api/track/stats/${trackingId}`)
      if (!response.ok) {
        throw new Error('Failed to load email data')
      }
      
      const data = await response.json()
      setEmailData({
        campaign_id: data.campaign_id,
        email_id: data.email_id,
        tracking_id: data.tracking_id,
        subject: data.subject,
        sender_email: data.sender_email,
        phishing_indicators: data.phishing_indicators || [],
        explanation: data.explanation || '',
        clicked_at: data.clicked_at
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email data')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    navigate('/campaigns')
  }

  const handleLearnMore = () => {
    navigate('/learn')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Return to Campaigns
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-red-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <span className="text-3xl">🚨</span>
          </div>
          <h1 className="text-4xl font-bold text-red-600 mb-2">You Were Phished!</h1>
          <p className="text-lg text-gray-600">
            This was a simulated phishing email as part of your security training.
          </p>
        </div>

        {/* Email Details */}
        {emailData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Details</h2>
            
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Subject:</span>
                <p className="text-gray-900">{emailData.subject}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">From:</span>
                <p className="text-gray-900">{emailData.sender_email}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Clicked at:</span>
                <p className="text-gray-900">{new Date(emailData.clicked_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Phishing Indicators */}
        {emailData && emailData.phishing_indicators.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">
              🎯 What Made This Email Suspicious:
            </h3>
            <ul className="space-y-2">
              {emailData.phishing_indicators.map((indicator, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span className="text-yellow-700">{indicator}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Explanation */}
        {emailData && emailData.explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              📚 Educational Explanation:
            </h3>
            <p className="text-blue-700">{emailData.explanation}</p>
          </div>
        )}

        {/* Learning Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            💡 How to Spot Phishing Emails:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-green-700">Check the sender's email address carefully</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-green-700">Look for urgent or threatening language</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-green-700">Verify links before clicking</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-green-700">Be suspicious of requests for personal info</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-green-700">Check for spelling and grammar errors</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-green-700">When in doubt, contact the organization directly</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleLearnMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📖 Practice More
          </button>
          <button
            onClick={handleContinue}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            📊 View Campaigns
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This was a safe training simulation. No actual harm was done to your device or data.
          </p>
        </div>
      </div>
    </div>
  )
}
