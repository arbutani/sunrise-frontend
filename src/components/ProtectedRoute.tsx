// components/ProtectedRoute.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = useSelector((state: RootState) => state.auth.token)
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if token exists
    const checkAuth = () => {
      if (!token) {
        router.replace('/login')
      } else {
        setIsChecking(false)
      }
    }

    // Small delay to ensure Redux state is loaded
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [token, router])

  // Agar check ho raha hai to loading show karo
  if (isChecking) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Agar token hai to children render karo
  return token ? <>{children}</> : null
}

export default ProtectedRoute