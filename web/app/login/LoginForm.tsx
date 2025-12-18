'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { login, signup, loginJson, signupJson } from '../auth/actions'
import { useSearchParams } from 'next/navigation'

export default function LoginForm({ onSuccess, redirectTo = '/', message }: { onSuccess?: () => void, redirectTo?: string, message?: string }) {
  const searchParams = useSearchParams()
  // Default to register if ?mode=register, else login
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    // Password confirmation check for registration
    if (activeTab === 'register') {
      const password = formData.get('password') as string
      const confirmPassword = formData.get('confirmPassword') as string

      if (password !== confirmPassword) {
        setError('Heslá sa nezhodujú')
        setLoading(false)
        return
      }
    }

    if (onSuccess) {
        // Use JSON actions
        const result = activeTab === 'register' ? await signupJson(formData) : await loginJson(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setLoading(false)
            onSuccess()
        }
    } else {
        // Use redirect actions (legacy behavior)
        const result = activeTab === 'register' ? await signup(formData) : await login(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }
  }

  return (
    <div>
      <div className="auth-tabs">
        <button
          className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
          type="button"
        >
          Prihlásenie
        </button>
        <button
          className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
          type="button"
        >
          Registrácia
        </button>
      </div>

      <div className="auth-content">
        <form onSubmit={handleSubmit} className="register-form">
          {message && (
             <div style={{
                background: '#fff3cd', 
                color: '#856404', 
                padding: '10px', 
                borderRadius: '6px', 
                marginBottom: '15px', 
                fontSize: '14px', 
                textAlign: 'center',
                border: '1px solid #ffeeba'
             }}>
                {message}
             </div>
          )}
          <h3 style={{marginBottom: '20px', textAlign: 'center'}}>
            {activeTab === 'login' ? 'Vitajte späť' : 'Vytvorte si účet'}
          </h3>

          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" required placeholder="vas@email.com" />
          </div>

          <div className="form-group">
            <label>Heslo</label>
            <input name="password" type="password" required minLength={6} placeholder="******" />
          </div>

          {activeTab === 'register' && (
            <div className="form-group">
              <label>Zopakujte heslo</label>
              <input name="confirmPassword" type="password" required minLength={6} placeholder="******" />
            </div>
          )}

          <div style={{marginTop: '20px'}}>
            <button type="submit" className="btn-primary-sm full-width" style={{cursor: 'pointer', padding: '12px', width: '100%', fontSize: '16px', borderRadius: '8px', border: 'none'}} disabled={loading}>
              {loading ? 'Pracujem...' : (activeTab === 'login' ? 'Prihlásiť sa' : 'Zaregistrovať sa')}
            </button>
          </div>
        </form>

        {/* Social Login Section */}
        <div style={{ margin: '24px 0', textAlign: 'center', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 10px', color: '#888', fontSize: '13px' }}>
            alebo
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <button onClick={() => handleOAuth('google')} type="button" style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '10px',
               width: '100%',
               padding: '12px',
               borderRadius: '8px',
               border: '1px solid #ddd',
               background: 'white',
               cursor: 'pointer',
               fontSize: '14px',
               fontWeight: 600,
               color: '#444'
             }}>
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" fillRule="evenodd"></path>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" fillRule="evenodd"></path>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" fillRule="evenodd"></path>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.16 6.656 3.58 9 3.58z" fill="#EA4335" fillRule="evenodd"></path>
                </svg>
                Pokračovať s Google
             </button>
             <button onClick={() => handleOAuth('apple')} type="button" style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '10px',
               width: '100%',
               padding: '12px',
               borderRadius: '8px',
               border: '1px solid #ddd',
               background: 'white',
               cursor: 'pointer',
               fontSize: '14px',
               fontWeight: 600,
               color: '#444'
             }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.93-1.02 1.63 0 2.85.73 3.53 1.63-3.1 1.73-2.43 6.94.52 8.16-.62 1.62-1.53 3.09-3.06 3.46zm-5.4-19.14c.78 0 1.95.42 2.53 1.25.53 1.1-.38 3.1-2.69 3.1-.73 0-1.74-.48-2.29-1.25-.63-1.06.33-2.92 2.45-3.1z"/>
                </svg>
                Pokračovať s Apple
             </button>
        </div>
      </div>
    </div>
  )
}
