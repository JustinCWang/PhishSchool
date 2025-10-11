import { useState } from 'react'

export default function Learn() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer)
    setShowFeedback(true)
    
    // Auto-hide feedback after 3 seconds
    setTimeout(() => {
      setShowFeedback(false)
      setSelectedAnswer(null)
    }, 3000)
  }

  const correctAnswer = 'phishing'

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent">
          Learn & Practice
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Sharpen your skills by identifying phishing attempts in real-world scenarios
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg transition-transform hover:scale-105">
          <div className="mb-2 text-3xl">✓</div>
          <div className="text-3xl font-bold">0</div>
          <div className="text-sm opacity-90">Correct Answers</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg transition-transform hover:scale-105">
          <div className="mb-2 text-3xl">✗</div>
          <div className="text-3xl font-bold">0</div>
          <div className="text-sm opacity-90">Incorrect Answers</div>
        </div> 
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white shadow-lg transition-transform hover:scale-105">
          <div className="mb-2 text-3xl">🎯</div>
          <div className="text-3xl font-bold">—%</div>
          <div className="text-sm opacity-90">Accuracy Rate</div>
        </div>
      </div>

      {/* Practice Email Card */}
      <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-xl transition-shadow hover:shadow-2xl">
        <div className="border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-2xl">📧</span>
                <h2 className="text-2xl font-bold text-gray-800">Practice Email #1</h2>
              </div>
              <div className="mt-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                <span className="text-xs font-medium text-gray-500">Subject:</span>
                <p className="font-semibold text-gray-800">Action Required - Verify Your Account</p>
              </div>
            </div>
            <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Question 1/10
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Email Header Info */}
          <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
            <div className="flex gap-2">
              <span className="font-semibold text-gray-600">From:</span>
              <span className="text-gray-800">security@paypal-verify-account.com</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-600">To:</span>
              <span className="text-gray-800">you@example.com</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-600">Date:</span>
              <span className="text-gray-800">Today, 2:30 PM</span>
            </div>
          </div>

          {/* Email Body */}
          <div className="mb-6 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
            <p className="mb-4 text-gray-800">Dear Valued Customer,</p>
            <p className="mb-4 text-gray-800">
              We have detected unusual activity on your PayPal account. To prevent suspension, 
              you must verify your account immediately by clicking the link below.
            </p>
            <div className="my-4 rounded-lg bg-blue-600 px-4 py-3 text-center">
              <a href="#" className="font-semibold text-white underline">
                Click Here to Verify Your Account Now
              </a>
            </div>
            <p className="mb-4 text-gray-800">
              If you do not verify within 24 hours, your account will be permanently locked.
            </p>
            <p className="text-gray-800">
              Thank you,<br />
              PayPal Security Team
            </p>
          </div>

          {/* Question */}
          <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 p-6 text-center">
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              Is this email a phishing attempt?
            </h3>
            <p className="text-sm text-gray-600">
              Carefully examine the sender, content, and links before making your decision
            </p>
          </div>

          {/* Answer Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer('safe')}
              disabled={showFeedback}
              className="group flex-1 rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center transition-all hover:scale-105 hover:border-green-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="mb-2 text-4xl transition-transform group-hover:scale-110">✅</div>
              <div className="text-lg font-bold text-green-700">Safe Email</div>
              <div className="text-xs text-green-600">This looks legitimate</div>
            </button>

            <button
              onClick={() => handleAnswer('phishing')}
              disabled={showFeedback}
              className="group flex-1 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 p-6 text-center transition-all hover:scale-105 hover:border-red-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="mb-2 text-4xl transition-transform group-hover:scale-110">🎣</div>
              <div className="text-lg font-bold text-red-700">Phishing</div>
              <div className="text-xs text-red-600">This is suspicious</div>
            </button>
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div
              className={`mt-6 animate-fadeIn rounded-xl p-6 ${
                selectedAnswer === correctAnswer
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300'
                  : 'bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">
                  {selectedAnswer === correctAnswer ? '🎉' : '💡'}
                </div>
                <div>
                  <h4
                    className={`text-xl font-bold ${
                      selectedAnswer === correctAnswer ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {selectedAnswer === correctAnswer ? 'Correct!' : 'Not quite right'}
                  </h4>
                  <p
                    className={`mt-1 ${
                      selectedAnswer === correctAnswer ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {selectedAnswer === correctAnswer
                      ? 'Great job! You identified the phishing attempt.'
                      : 'This is a phishing email. Look for suspicious sender addresses and urgent language.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 p-6 shadow-md">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-800">
          <span className="text-2xl">💡</span>
          Pro Tips for Spotting Phishing
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-lg">🔍</span>
            <span>Check the sender's email address carefully - look for misspellings or suspicious domains</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>Be wary of urgent language or threats about account suspension</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">🔗</span>
            <span>Hover over links to see the real URL before clicking</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">📧</span>
            <span>Legitimate companies rarely ask for sensitive information via email</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
