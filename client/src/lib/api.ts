import { supabase } from './supabase'

function normalizeApiBaseUrl(raw?: string): string {
  const fallback = 'https://phishschoolbackend.vercel.app/api'
  const base = (raw && String(raw).trim()) || fallback
  try {
    const url = new URL(base)
    const isVercel = url.hostname.endsWith('vercel.app')
    const hasApiPrefix = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean)[0] === 'api'
    if (isVercel && !hasApiPrefix) {
      url.pathname = `/api${url.pathname}`
    }
    // remove trailing slash for consistent concatenation
    return url.toString().replace(/\/$/, '')
  } catch {
    // If it's not a full URL, just return as-is (developer can pass a proxy path)
    return base.replace(/\/$/, '')
  }
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(init.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return fetch(input, { ...init, headers })
}

// Types for message generation
export interface MessageGenerationRequest {
  message_type: 'email' | 'sms'
  content_type: 'phishing' | 'legitimate'
  difficulty?: 'easy' | 'medium' | 'hard'
  theme?: string
  custom_prompt?: string
}

export interface GeneratedMessageResponse {
  message_type: string
  content_type: string
  difficulty: string
  theme?: string
  
  // Email fields
  subject?: string
  sender?: string
  recipient?: string
  body?: string
  
  // SMS fields
  phone_number?: string
  contact_name?: string
  message?: string
  
  // Common fields
  phishing_indicators?: string[]
  explanation?: string
}

// Message generation API functions
export async function generateMessage(request: MessageGenerationRequest): Promise<GeneratedMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/generate/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to generate message')
  }

  return response.json()
}

export async function generateRandomMessage(): Promise<GeneratedMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/generate/random`, {
    method: 'POST',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to generate random message')
  }

  return response.json()
}

// Campaign/email API functions
export interface SendPhishingNowRequest {
  user_id: string
  difficulty?: 'easy' | 'medium' | 'hard'
  theme?: string
}

export interface SendPhishingNowResponse {
  success: boolean
  message: string
}

export async function sendPhishingNow(req: SendPhishingNowRequest): Promise<SendPhishingNowResponse> {
  const response = await fetch(`${API_BASE_URL}/email/send-phishing-now`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to send phishing email')
  }

  return response.json()
}

// Email analysis API functions (for uploaded files)
export interface EmailAnalysisRequest {
  file: File
}

export interface EmailAnalysisResponse {
  filename: string
  score: number
  rationale: string
  metadata: {
    subject: string
    sender: string
    recipient: string
    date: string
    body_preview: string
  }
}

export async function analyzeEmail(file: File): Promise<EmailAnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/uploads/eml`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to analyze email')
  }

  return response.json()
}


