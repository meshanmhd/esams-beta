'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { AdminDashboard } from '@/components/admin-dashboard'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
        // Admin is already on the right page (home shows admin dashboard)
        return
      } else if (profile.role === 'student') {
        // Redirect student to student dashboard
        router.push('/student')
      }
    }
  }, [user, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
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
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-black rounded-lg flex items-center justify-center mb-6">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-black mb-4">
              ESAMS
            </h1>
            <p className="text-xl text-gray-600">
              Exam Seat Allocation Management System
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-black font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-black font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3" 
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

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  The system will automatically detect your role and redirect you to the appropriate dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {profile?.role === 'admin' ? (
        <AdminLayout>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black">
              Welcome back, {profile?.full_name || user.email}!
            </h1>
            <p className="text-gray-600">
              Administrator Dashboard
            </p>
          </div>
          <AdminDashboard />
        </AdminLayout>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Welcome back, {profile?.full_name || user.email}!
              </h1>
              <p className="text-gray-600">
                Student Portal
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Student</Badge>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>My Exams</CardTitle>
                <CardDescription>
                  View your registered exams and seat assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/student/exams">
                  <Button className="w-full rounded-lg">View My Exams</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/student/profile">
                  <Button className="w-full rounded-lg">Edit Profile</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
