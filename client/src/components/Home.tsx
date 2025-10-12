import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [typedText, setTypedText] = useState<string>('')
  const [showDetector, setShowDetector] = useState<boolean>(false)
  const [showOtherSections, setShowOtherSections] = useState<boolean>(false)
  
  const fullText = "Over 3.4 billion phishing emails are sent every day. 90% of data breaches start with a phishing attack. In 2024, organizations faced an average of 1,265 phishing attacks per month. Don't become a statistic—protect yourself"

  useEffect(() => {
    let index = 0
    // Show detector after 2 seconds regardless of typing completion
    const detectorTimer = setTimeout(() => setShowDetector(true), 1300)
    
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 8) // Typing speed

    return () => {
      clearInterval(timer)
      clearTimeout(detectorTimer)
    }
  }, [])

  // Show other sections 800ms after detector appears
  useEffect(() => {
    if (showDetector) {
      const timer = setTimeout(() => setShowOtherSections(true), 500)
      return () => clearTimeout(timer)
    }
  }, [showDetector])

  return (
    <div className="flex flex-col items-center space-y-12 max-w-6xl mx-auto">
      <header className="text-center space-y-4 pt-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">Welcome to PhishSchool</h1>
        <p className="mt-2 text-lg text-gray-600">Learn to spot phishing, test emails and images, and run training campaigns.</p>
        
        <div className="mt-6 max-w-3xl mx-auto min-h-[120px]">
          <p className="text-sm text-gray-700 leading-relaxed">
            {typedText}
            {typedText.length < fullText.length && (
              <span className="inline-block w-0.5 h-4 bg-blue-600 ml-1 animate-pulse" aria-hidden="true"></span>
            )}
          </p>
        </div>
      </header>

      {/* Detector Section with Slide-up Animation */}
      <section 
        className={`w-full transition-all duration-1000 ease-out ${
          showDetector ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 shadow-2xl overflow-hidden group hover:shadow-3xl transition-shadow duration-300">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-300 rounded-full opacity-10 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Icon/Graphic Section */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-3">AI-Powered Phishing Detector</h2>
              <p className="text-blue-100 text-base mb-4 leading-relaxed">
                Upload any email file (.eml) or image that you believe contains suspicious material and let us analyze it for phishing indicators. 
                Get instant results with a detailed suspicion score, threat breakdown, and actionable insights 
                to protect yourself from sophisticated attacks.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                <div className="flex items-center gap-2 text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Instant Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">AI-Powered</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Detailed Reports</span>
                </div>
              </div>
              
              <Link 
                to="/detector" 
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-700 hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload & Scan Email Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Other Sections */}
      <div 
        className={`grid gap-6 sm:grid-cols-2 w-full transition-all duration-1000 ease-out ${
          showOtherSections ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 border-1 border-black flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Learn</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">Practice on realistic emails and decide: safe or phishing?</p>
          <Link to="/learn" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">Start Learning →</Link>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 border-1 border-black flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">Opt-in to periodic test phishing emails and track your progress.</p>
          <Link to="/campaigns" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">Manage Campaigns →</Link>
        </div>
      </div>
    </div>
  )
}
