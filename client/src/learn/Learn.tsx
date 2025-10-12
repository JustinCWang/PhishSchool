/**
 * Learn practice experience.
 *
 * Generates phishing or legitimate messages, records user answers and stats,
 * shows a leaderboard, and provides an interactive training flow.
 */
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/useAuth'
import { generateMessage, generateRandomMessage, type GeneratedMessageResponse } from '../lib/api'
import { supabase } from '../lib/supabase'

/** Main Learn page component */
export default function Learn() {
  const { user, loading } = useAuth()
  const [currentMessage, setCurrentMessage] = useState<GeneratedMessageResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingType, setGeneratingType] = useState<'random' | 'email' | 'sms' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState<'phishing' | 'legitimate' | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showLoginToast, setShowLoginToast] = useState(false)
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)
  const previousUserRef = useRef<typeof user>(undefined)
  
  // Difficulty dropdowns state (now includes legitimate option)
  const [randomDifficulty, setRandomDifficulty] = useState<'easy' | 'medium' | 'hard' | 'legitimate'>('medium')
  const [emailDifficulty, setEmailDifficulty] = useState<'easy' | 'medium' | 'hard' | 'legitimate'>('medium')
  const [smsDifficulty, setSmsDifficulty] = useState<'easy' | 'medium' | 'hard' | 'legitimate'>('medium')
  
  // Score tracking state
  const [learnAttempts, setLearnAttempts] = useState(0)
  const [learnCorrect, setLearnCorrect] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)
  const [userRank, setUserRank] = useState<number | null>(null)
  
  // Leaderboard state (Scores table)
  const [leaderboard, setLeaderboard] = useState<Array<{ score_id: string; learn_correct: number; learn_attempted: number | null }>>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
  const [currentUserName, setCurrentUserName] = useState<string>('')

  // Load user stats from Supabase
  useEffect(() => {
    let isMounted = true
    async function loadStats() {
      if (!user) {
        setLoadingStats(false)
        setLearnAttempts(0)
        setLearnCorrect(0)
        setUserRank(null)
        return
      }
      setLoadingStats(true)
      const { data, error } = await supabase
        .from('Scores')
        .select('learn_attempted, learn_correct')
        .eq('score_id', user.id)
        .maybeSingle()
      
      if (!isMounted) return
      
      if (error) {
        console.error('Failed to load learn stats:', error.message)
      } else {
        const userCorrect = data?.learn_correct ?? 0
        setLearnAttempts(data?.learn_attempted ?? 0)
        setLearnCorrect(userCorrect)
        // Ensure a Scores row exists for this user if missing
        if (!data) {
          await supabase
            .from('Scores')
            .upsert({ score_id: user.id, learn_attempted: 0, learn_correct: 0 }, { onConflict: 'score_id' })
        }
        
        // Calculate user's rank
        const { count } = await supabase
          .from('Scores')
          .select('*', { count: 'exact', head: true })
          .gt('learn_correct', userCorrect)
        
        setUserRank((count ?? 0) + 1)
      }
      setLoadingStats(false)
    }
    void loadStats()
    return () => {
      isMounted = false
    }
  }, [user])

  // Load leaderboard from Supabase
  useEffect(() => {
    let isMounted = true
    async function loadLeaderboard() {
      setLoadingLeaderboard(true)
      const { data, error } = await supabase
        .from('Scores')
        .select('score_id, learn_correct, learn_attempted')
        .order('learn_correct', { ascending: false })
        .limit(10)
      
      if (!isMounted) return
      
      if (error) {
        console.error('Failed to load leaderboard:', error.message)
      } else {
        setLeaderboard((data ?? []) as Array<{ score_id: string; learn_correct: number; learn_attempted: number | null }>)
      }
      setLoadingLeaderboard(false)
    }
    void loadLeaderboard()
    return () => {
      isMounted = false
    }
  }, [])

  // Load current user's name from Users table
  useEffect(() => {
    let isMounted = true
    async function loadUserName() {
      if (!user) {
        setCurrentUserName('')
        return
      }
      const { data, error } = await supabase
        .from('Users')
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!isMounted) return
      if (error) {
        console.error('Failed to load user name:', error.message)
        setCurrentUserName(user.email ?? '')
      } else {
        const first = (data?.first_name ?? '').trim()
        const last = (data?.last_name ?? '').trim()
        const full = `${first} ${last}`.trim()
        setCurrentUserName(full || data?.email || user.email || '')
      }
    }
    void loadUserName()
    return () => {
      isMounted = false
    }
  }, [user])

  // Show toast notifications ONLY when user actually logs in (not on page load if already logged in)
  useEffect(() => {
    // Only show toast if user transitioned from null to logged in
    if (user && !loading && previousUserRef.current === null) {
      setShowLoginToast(true)
      setTimeout(() => {
        setShowWelcomeToast(true)
      }, 500)
      
      // Hide toasts after a few seconds
      setTimeout(() => setShowLoginToast(false), 3000)
      setTimeout(() => setShowWelcomeToast(false), 3500)
    }
    
    // Update the ref to track previous user state
    if (!loading) {
      previousUserRef.current = user
    }
  }, [user, loading])

  /** Generate a new message with the specified parameters */
  const generateNewMessage = async (contentType: 'phishing' | 'legitimate', difficulty: 'easy' | 'medium' | 'hard' = 'medium', messageType?: 'email' | 'sms', theme?: string) => {
	try {
  	setIsGenerating(true)
  	setGeneratingType(messageType === 'sms' ? 'sms' : 'email')
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
  	setGeneratingType(null)
	}
  }

  /** Generate a random practice message */
  const generateRandomPracticeMessage = async () => {
	try {
  	setIsGenerating(true)
  	setGeneratingType('random')
  	setError(null)
  	setUserAnswer(null)
  	setShowResult(false)
 	 
  	const message = await generateRandomMessage()
  	setCurrentMessage(message)
	} catch (err) {
  	setError(err instanceof Error ? err.message : 'Failed to generate random message')
	} finally {
  	setIsGenerating(false)
  	setGeneratingType(null)
	}
  }

  /** Record the user's answer, update stats, refresh leaderboard and rank */
  const handleAnswer = async (answer: 'phishing' | 'legitimate') => {
	setUserAnswer(answer)
	setShowResult(true)
	
	// Update stats in database
	if (user && currentMessage) {
  	const correct = currentMessage.content_type === answer
  	const newAttempts = learnAttempts + 1
  	const newCorrect = correct ? learnCorrect + 1 : learnCorrect
  	
  	// Update local state immediately
  	setLearnAttempts(newAttempts)
  	setLearnCorrect(newCorrect)
  	
  	// Upsert database row to ensure it exists
  	  const { error } = await supabase
      .from('Scores')
      .upsert({
        score_id: user.id,
        learn_attempted: newAttempts,
        learn_correct: newCorrect
      }, { onConflict: 'score_id' })
  	
  	if (error) {
    	console.error('Failed to update learn stats:', error.message)
  	} else {
    	// Reload leaderboard to show updated scores
    const { data } = await supabase
      .from('Scores')
      .select('score_id, learn_correct, learn_attempted')
      .order('learn_correct', { ascending: false })
      .limit(10)
    	if (data) {
      	setLeaderboard(data)
    	}
    	
    	// Recalculate user's rank
    const { count } = await supabase
      .from('Scores')
      	.select('*', { count: 'exact', head: true })
      .gt('learn_correct', newCorrect)
    	
    	setUserRank((count ?? 0) + 1)
  	}
	}
  }

  /** Whether the user's answer matches the ground truth */
  const isCorrect = () => {
	if (!currentMessage || !userAnswer) return false
	return currentMessage.content_type === userAnswer
  }

  /** Helper to quickly get a new random message */
  const generateNextMessage = async () => {
	await generateRandomPracticeMessage()
  }


  // Show loading state while checking authentication
  if (loading) {
	return (
  	<div className="space-y-6">
    	<h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Learn</h1>
    	<p className="text-gray-600 text-center">Loading...</p>
  	</div>
	)
  }

  return (
	<div className="space-y-8">
  	{/* Toast Notifications */}
  	{showLoginToast && (
    	<div className="fixed top-4 right-4 z-50 animate-slideIn">
      	<div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
        	<span className="text-xl">✓</span>
        	<span className="font-medium">Logged in as {user?.email}</span>
      	</div>
    	</div>
  	)}
 	 
  	{showWelcomeToast && (
    	<div className="fixed top-20 right-4 z-50 animate-slideIn">
      	<div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
        	<span className="text-xl">👋</span>
        	<span className="font-medium">Welcome back!</span>
      	</div>
    	</div>
  	)}
  	
	{/* Title with Score on Right */}
	<div className="flex items-center justify-between">
		<div className="hidden sm:block sm:flex-1"></div>
		<h1 className="w-full sm:flex-1 text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center justify-center gap-3 px-2">
			<span>Learn</span>
			<img src="/LearnFish.png" alt="Learn Fish" className="h-12 w-auto object-contain sm:h-16" />
		</h1>
		{user ? (
			<div className="hidden sm:flex sm:flex-1 justify-end">
				{loadingStats ? (
					<div className="text-sm text-gray-500">Loading...</div>
				) : (
					<div className="flex gap-3 text-sm">
						<div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md font-semibold">
							{learnAttempts} Attempts
						</div>
						<div className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-semibold">
							{learnCorrect} Correct
						</div>
						<div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md font-semibold">
							{learnAttempts > 0 ? Math.round((learnCorrect / learnAttempts) * 100) : 0}%
						</div>
						{userRank !== null && (
							<div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-md font-semibold flex items-center gap-1">
								<span>🏆</span>
								<span>#{userRank}</span>
							</div>
						)}
					</div>
				)}
			</div>
		) : (
			<div className="hidden sm:block sm:flex-1" />
		)}
	</div>

  	{user ? (
    	<>
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

      	{/* Top 10 Leaderboard */}
      	<div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-lg">
        	<h2 className="text-2xl font-bold text-amber-800 text-center mb-6">🏆 Top 10 Leaderboard</h2>
        	
        	{loadingLeaderboard ? (
          	<div className="text-center text-gray-600">Loading leaderboard...</div>
        	) : leaderboard.length === 0 ? (
          	<div className="text-center text-gray-600">No scores yet. Be the first!</div>
        	) : (
          	<div className="bg-white rounded-lg shadow-md overflow-hidden">
            	<div className="divide-y divide-gray-200">
              	{leaderboard.map((entry, index) => (
                	<div 
                  	key={index}
                  	className={`flex items-center justify-between p-4 ${
                    	index === 0 ? 'bg-gradient-to-r from-amber-100 to-yellow-100' :
                    	index === 1 ? 'bg-gradient-to-r from-gray-100 to-slate-100' :
                    	index === 2 ? 'bg-gradient-to-r from-orange-100 to-amber-100' :
                    	'hover:bg-gray-50'
                  	}`}
                	>
                  	<div className="flex items-center gap-4">
                    	<div className={`text-2xl font-bold ${
                      	index === 0 ? 'text-amber-600' :
                      	index === 1 ? 'text-gray-600' :
                      	index === 2 ? 'text-orange-600' :
                      	'text-gray-400'
                    	}`}>
                      	#{index + 1}
                    	</div>
                    	<div>
                      <div className="font-semibold text-gray-800">
                        {entry.score_id === user?.id ? (currentUserName || 'You') : 'Anonymous'}
                      </div>
                    	</div>
                  	</div>
                  	<div className="flex items-center gap-2">
                    	<span className="text-2xl font-bold text-green-600">{entry.learn_correct}</span>
                    	<span className="text-sm text-gray-500">correct</span>
                  	</div>
                	</div>
              	))}
            	</div>
          	</div>
        	)}
      	</div>

      	{/* Centered Section Title */}
      	<div className="text-center">
        	<h2 className="text-2xl font-semibold text-gray-800 mb-2">Generate Practice Messages</h2>
        	<p className="text-gray-600">Choose a message type and difficulty level to test your phishing detection skills</p>
      	</div>

      	{/* Three Side-by-Side Boxes */}
      	<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        	{/* Random Message Box */}
        	<div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-lg hover:shadow-xl transition-shadow">
          	<div className="text-center mb-4">
            	<div className="text-4xl mb-2">🎲</div>
            	<h3 className="text-xl font-bold text-purple-800">Random Message</h3>
            	<p className="text-sm text-purple-600 mt-2">Get a surprise message of any type</p>
          	</div>
          	
          	<div className="space-y-3">
            	<div>
              	<label className="block text-sm font-medium text-purple-700 mb-1">Type</label>
              	<select
                	value={randomDifficulty}
                	onChange={(e) => setRandomDifficulty(e.target.value as 'easy' | 'medium' | 'hard' | 'legitimate')}
                	className="w-full rounded-md border border-purple-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              	>
                	<option value="easy">Easy Phishing</option>
                	<option value="medium">Medium Phishing</option>
                	<option value="hard">Hard Phishing</option>
                	<option value="legitimate">Legitimate</option>
              	</select>
            	</div>
            	
            	<button
              	onClick={async () => {
                	setIsGenerating(true)
                	setGeneratingType('random')
                	setError(null)
                	setUserAnswer(null)
                	setShowResult(false)
                	
                	try {
                  	const contentType = randomDifficulty === 'legitimate' ? 'legitimate' : 'phishing'
                  	const difficulty = randomDifficulty === 'legitimate' ? 'medium' : randomDifficulty
                  	const messageType = Math.random() > 0.5 ? 'email' : 'sms'
                  	const theme = contentType === 'legitimate' ? 'friend' : (messageType === 'email' ? 'bank' : 'offer')
                  	const message = await generateMessage({
                    	message_type: messageType,
                    	content_type: contentType,
                    	difficulty: difficulty as 'easy' | 'medium' | 'hard',
                    	theme
                  	})
                  	setCurrentMessage(message)
                	} catch (err) {
                  	setError(err instanceof Error ? err.message : 'Failed to generate message')
                	} finally {
                  	setIsGenerating(false)
                  	setGeneratingType(null)
                	}
              	}}
              	disabled={isGenerating}
              	className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            	>
              	{generatingType === 'random' ? 'Generating...' : 'Generate Random'}
            	</button>
          	</div>
        	</div>

        	{/* Email Message Box */}
        	<div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg hover:shadow-xl transition-shadow">
          	<div className="text-center mb-4">
            	<div className="text-4xl mb-2">📧</div>
            	<h3 className="text-xl font-bold text-blue-800">Email Message</h3>
            	<p className="text-sm text-blue-600 mt-2">Practice with email messages</p>
          	</div>
          	
          	<div className="space-y-3">
            	<div>
              	<label className="block text-sm font-medium text-blue-700 mb-1">Type</label>
              	<select
                	value={emailDifficulty}
                	onChange={(e) => setEmailDifficulty(e.target.value as 'easy' | 'medium' | 'hard' | 'legitimate')}
                	className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              	>
                	<option value="easy">Easy Phishing</option>
                	<option value="medium">Medium Phishing</option>
                	<option value="hard">Hard Phishing</option>
                	<option value="legitimate">Legitimate</option>
              	</select>
            	</div>
            	
            	<button
              	onClick={async () => {
                	setIsGenerating(true)
                	setGeneratingType('email')
                	setError(null)
                	setUserAnswer(null)
                	setShowResult(false)
                	
                	try {
                  	const contentType = emailDifficulty === 'legitimate' ? 'legitimate' : 'phishing'
                  	const difficulty = emailDifficulty === 'legitimate' ? 'medium' : emailDifficulty
                  	const message = await generateMessage({
                    	message_type: 'email',
                    	content_type: contentType,
                    	difficulty: difficulty as 'easy' | 'medium' | 'hard',
                    	theme: emailDifficulty === 'legitimate' ? 'friend' : 'bank'
                  	})
                  	setCurrentMessage(message)
                	} catch (err) {
                  	setError(err instanceof Error ? err.message : 'Failed to generate message')
                	} finally {
                  	setIsGenerating(false)
                  	setGeneratingType(null)
                	}
              	}}
              	disabled={isGenerating}
              	className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            	>
              	{generatingType === 'email' ? 'Generating...' : 'Generate Email'}
            	</button>
          	</div>
        	</div>

        	{/* SMS/Text Message Box */}
        	<div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-lg hover:shadow-xl transition-shadow">
          	<div className="text-center mb-4">
            	<div className="text-4xl mb-2">💬</div>
            	<h3 className="text-xl font-bold text-green-800">Text Message</h3>
            	<p className="text-sm text-green-600 mt-2">Practice with SMS messages</p>
          	</div>
          	
          	<div className="space-y-3">
            	<div>
              	<label className="block text-sm font-medium text-green-700 mb-1">Type</label>
              	<select
                	value={smsDifficulty}
                	onChange={(e) => setSmsDifficulty(e.target.value as 'easy' | 'medium' | 'hard' | 'legitimate')}
                	className="w-full rounded-md border border-green-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              	>
                	<option value="easy">Easy Phishing</option>
                	<option value="medium">Medium Phishing</option>
                	<option value="hard">Hard Phishing</option>
                	<option value="legitimate">Legitimate</option>
              	</select>
            	</div>
            	
            	<button
              	onClick={async () => {
                	setIsGenerating(true)
                	setGeneratingType('sms')
                	setError(null)
                	setUserAnswer(null)
                	setShowResult(false)
                	
                	try {
                  	const contentType = smsDifficulty === 'legitimate' ? 'legitimate' : 'phishing'
                  	const difficulty = smsDifficulty === 'legitimate' ? 'medium' : smsDifficulty
                  	const message = await generateMessage({
                    	message_type: 'sms',
                    	content_type: contentType,
                    	difficulty: difficulty as 'easy' | 'medium' | 'hard',
                    	theme: smsDifficulty === 'legitimate' ? 'friend' : 'offer'
                  	})
                  	setCurrentMessage(message)
                	} catch (err) {
                  	setError(err instanceof Error ? err.message : 'Failed to generate message')
                	} finally {
                  	setIsGenerating(false)
                  	setGeneratingType(null)
                	}
              	}}
              	disabled={isGenerating}
              	className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            	>
              	{generatingType === 'sms' ? 'Generating...' : 'Generate Text'}
            	</button>
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


