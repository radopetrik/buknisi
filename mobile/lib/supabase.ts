import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return Promise.resolve(null)
        }
        return AsyncStorage.getItem(key)
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') {
          return Promise.resolve()
        }
        return AsyncStorage.setItem(key, value)
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') {
          return Promise.resolve()
        }
        return AsyncStorage.removeItem(key)
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

function isInvalidRefreshTokenError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const maybeError = error as { name?: unknown; message?: unknown }
  const name = typeof maybeError.name === 'string' ? maybeError.name : ''
  const message = typeof maybeError.message === 'string' ? maybeError.message : ''

  return name === 'AuthApiError' && message.includes('Invalid Refresh Token')
}

async function signOutLocalSafely() {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // ignore
  }
}

export async function cleanupInvalidSession() {
  try {
    const { error } = await supabase.auth.getSession()
    if (error && isInvalidRefreshTokenError(error)) {
      await signOutLocalSafely()
    }
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      await signOutLocalSafely()
    }
  }
}

export async function getUserOrNull() {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        await signOutLocalSafely()
        return null
      }

      return null
    }

    return data.user
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      await signOutLocalSafely()
      return null
    }

    return null
  }
}
