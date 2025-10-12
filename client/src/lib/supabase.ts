/**
 * Supabase client singleton.
 *
 * Reads config from Vite env and exposes a pre-configured client instance
 * for auth and data operations across the app.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/** Supabase client used throughout the app. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)


