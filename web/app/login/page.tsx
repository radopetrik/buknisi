import LoginForm from './LoginForm'
import "../create_customer/style.css"
import { Suspense } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="create-customer-page">
      <Link href="/" className="auth-logo" aria-label="Späť na úvodnú stránku">
        <img src="/logo_buknisi.png" alt="Bukni Si Logo" />
      </Link>
      <div className="auth-wrapper">
        <Suspense fallback={<div style={{padding: '40px', textAlign: 'center'}}>Načítavam...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
