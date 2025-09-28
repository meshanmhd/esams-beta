'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, GraduationCap } from 'lucide-react'

export default function Home() {
  const { user, profile, loading, unifiedSignIn, signOut } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle automatic routing after login
  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        // Redirect admin to admin dashboard
        router.push('/admin')
      } else if (profile.role === 'student') {
        // Redirect student to student dashboard
        router.push('/student')
      }
    }
  }, [user, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoginLoading(true)
      setError('')

      const { error, userType } = await unifiedSignIn(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        // User will be automatically redirected based on their role
        // The useEffect below will handle the routing
      }
      
      setLoginLoading(false)
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-6">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-black rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ESAMS
              </h1>
              <p className="text-sm text-gray-600">
                Exam Seat Allocation Management System
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-8 max-w-md mx-auto">
          <Card className="rounded-lg shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-center">Sign In</CardTitle>
              <CardDescription className="text-center text-sm">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="border-gray-300 focus:border-black focus:ring-black text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="border-gray-300 focus:border-black focus:ring-black text-sm"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5 text-sm" 
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  The system will automatically detect your role and redirect you to the appropriate dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // This should not be reached due to the useEffect redirects above
  // But if it is, show a loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
