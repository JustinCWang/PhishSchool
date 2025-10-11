import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { generateMessage, generateRandomMessage, type GeneratedMessageResponse } from '../lib/api'

export default function Learn() {
  const { user, loading } = useAuth()
  const [currentMessage, setCurrentMessage] = useState<GeneratedMessageResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState<'phishing' | 'legitimate' | null>(null)
  const [showResult, setShowResult] = useState(false)

  const generateNewMessage = async (contentType: 'phishing' | 'legitimate', difficulty: 'easy' | 'medium' | 'hard' = 'medium', messageType?: 'email' | 'sms', theme?: string) => {
    try {
      setIsGenerating(true)
      setError(null)
      setUserAnswer(null)
      setShowResult(false)
      
      const message = await generateMessage({
        message_type: messageType || 'email',
        content_type: contentType,
        difficulty,
        theme: theme || undefined
      })
      setCurrentMessage(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate message')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateRandomPracticeMessage = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setUserAnswer(null)
      setShowResult(false)
      
      const message = await generateRandomMessage()
      setCurrentMessage(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate random message')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswer = (answer: 'phishing' | 'legitimate') => {
    setUserAnswer(answer)
    setShowResult(true)
  }

  const isCorrect = () => {
    if (!currentMessage || !userAnswer) return false
    return currentMessage.content_type === userAnswer
  }

  const generateNextMessage = async () => {
    await generateRandomPracticeMessage()
  }


  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Learn</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Learn</h1>
      
      {/* Authentication Status Display */}
      {user ? (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-green-800">
            ✅ <strong>Logged in as:</strong> {user.email}
          </p>
          <p className="text-sm text-green-600 mt-1">
            You have access to all learning materials and can track your progress.
          </p>
        </div>
      ) : (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-yellow-800">
            ⚠️ <strong>Not logged in</strong>
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            Some features may be limited. <a href="/login?redirect=/learn" className="underline">Login</a> to access full functionality.
          </p>
        </div>
      )}

      {user ? (
        <>
          <p className="text-gray-600">
            Welcome back! Generate practice emails to test your phishing detection skills. Choose a difficulty level and email type to get started.
          </p>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-red-800">❌ <strong>Error:</strong> {error}</p>
              <button 
                onClick={() => generateNewMessage('phishing', 'medium', 'email', 'bank')}
                className="mt-2 text-sm text-red-600 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* Message Generation Controls */}
          <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-800 mb-3">Generate Practice Message</h3>
            <p className="text-sm text-blue-700 mb-3">Choose a message type, difficulty level, and theme to start practicing:</p>
            
            {/* Random Generation */}
            <div className="mb-4">
              <button 
                onClick={generateRandomPracticeMessage}
                disabled={isGenerating}
                className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 font-medium"
              >
                🎲 Generate Random Message
              </button>
            </div>

            {/* Specific Generation */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-2">Email Messages:</h4>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => generateNewMessage('phishing', 'easy', 'email', 'bank')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Easy Phishing Email
                  </button>
                  <button 
                    onClick={() => generateNewMessage('phishing', 'medium', 'email', 'job')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Medium Phishing Email
                  </button>
                  <button 
                    onClick={() => generateNewMessage('phishing', 'hard', 'email', 'health')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Hard Phishing Email
                  </button>
                  <button 
                    onClick={() => generateNewMessage('legitimate', 'medium', 'email', 'friend')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                  >
                    Legitimate Email
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-2">SMS Messages:</h4>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => generateNewMessage('phishing', 'easy', 'sms', 'offer')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                  >
                    Easy Phishing SMS
                  </button>
                  <button 
                    onClick={() => generateNewMessage('phishing', 'medium', 'sms', 'bank')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                  >
                    Medium Phishing SMS
                  </button>
                  <button 
                    onClick={() => generateNewMessage('phishing', 'hard', 'sms', 'other')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                  >
                    Hard Phishing SMS
                  </button>
                  <button 
                    onClick={() => generateNewMessage('legitimate', 'medium', 'sms', 'friend')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200 disabled:opacity-50"
                  >
                    Legitimate SMS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-md bg-gray-50 border border-gray-200 p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Login Required</h3>
          <p className="text-gray-600 mb-4">
            Please log in to access the email generation features and practice your phishing detection skills.
          </p>
          <a 
            href="/login?redirect=/learn"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Login to Continue
          </a>
        </div>
      )}
      
      {/* Message Display - Only show for logged-in users */}
      {user && isGenerating ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating message...</p>
          </div>
        </div>
      ) : user && currentMessage ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Practice {currentMessage.message_type.toUpperCase()} - {currentMessage.difficulty.charAt(0).toUpperCase() + currentMessage.difficulty.slice(1)} Level
              {currentMessage.theme && (
                <span className="ml-2 text-sm font-normal text-gray-600">({currentMessage.theme} theme)</span>
              )}
            </h2>
          </div>
          
          {currentMessage.message_type === 'email' ? (
            // Email Layout
            <>
              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Subject:</strong> {currentMessage.subject}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>From:</strong> {currentMessage.sender} | <strong>To:</strong> {currentMessage.recipient}
                </p>
              </div>
              
              <div className="mb-4 rounded-md bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-line">
                {currentMessage.body}
              </div>
            </>
          ) : (
            // SMS Layout - Phone Message Style
            <div className="mb-4">
              <div className="bg-gray-100 rounded-t-lg p-3 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {currentMessage.contact_name?.charAt(0) || currentMessage.phone_number?.charAt(1) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {currentMessage.contact_name || currentMessage.phone_number || 'Unknown Contact'}
                      </p>
                      <p className="text-xs text-gray-500">now</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    📱 SMS
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-b-lg p-4 border border-gray-300 border-t-0">
                <div className="bg-blue-500 text-white rounded-2xl rounded-bl-md px-4 py-3 max-w-xs ml-auto">
                  <p className="text-sm whitespace-pre-line">{currentMessage.message}</p>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">Delivered</p>
              </div>
            </div>
          )}
          
          {!showResult ? (
            <div className="flex gap-3">
              <button 
                onClick={() => handleAnswer('legitimate')}
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Legitimate
              </button>
              <button 
                onClick={() => handleAnswer('phishing')}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Phishing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Result Display */}
              <div className={`p-4 rounded-md ${isCorrect() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {isCorrect() ? (
                    <>
                      <span className="text-green-600 text-xl">✅</span>
                      <span className="text-green-800 font-semibold">Correct!</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-600 text-xl">❌</span>
                      <span className="text-red-800 font-semibold">Incorrect</span>
                    </>
                  )}
                </div>
                <p className={`mt-2 text-sm ${isCorrect() ? 'text-green-700' : 'text-red-700'}`}>
                  This message is <strong>{currentMessage.content_type}</strong>.
                </p>
              </div>

              {/* Explanation */}
              {currentMessage.explanation && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-semibold text-blue-800 mb-2">Explanation:</h4>
                  <p className="text-sm text-blue-700">{currentMessage.explanation}</p>
                </div>
              )}

              {/* Phishing Indicators */}
              {currentMessage.phishing_indicators && currentMessage.phishing_indicators.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-semibold text-yellow-800 mb-2">Phishing Indicators:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {currentMessage.phishing_indicators.map((indicator, index) => (
                      <li key={index}>• {indicator}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Message Button */}
              <button 
                onClick={generateNextMessage}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Practice with Another Message
              </button>
            </div>
          )}
        </div>
      ) : user ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-gray-600 text-center">Click one of the buttons above to generate a practice message.</p>
        </div>
      ) : null}
    </div>
  )
}
