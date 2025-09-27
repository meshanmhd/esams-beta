'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { GraduationCap, Calendar, User, BookOpen, MapPin } from 'lucide-react'

export default function StudentDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'student')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'student') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Welcome back, {profile?.full_name || user.email}!
            </h1>
            <p className="text-gray-600">
              Student Portal
            </p>
            {profile?.student_id && (
              <p className="text-sm text-gray-500 mt-1">
                Student ID: {profile.student_id}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Student
            </Badge>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Exams</p>
                  <p className="text-2xl font-bold text-black">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Registered</p>
                  <p className="text-2xl font-bold text-black">5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Seat Assigned</p>
                  <p className="text-2xl font-bold text-black">4</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Exams
              </CardTitle>
              <CardDescription>
                View your registered exams, seat assignments, and exam schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/exams">
                <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-lg">
                  View My Exams
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>
                Update your profile information and view your academic details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/profile">
                <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-lg">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>
                Your latest exam registrations and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-black">Mathematics Exam</p>
                      <p className="text-sm text-gray-600">Registered on Dec 15, 2024</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Registered</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-black">Physics Exam</p>
                      <p className="text-sm text-gray-600">Seat assigned: Hall A, Seat 15</p>
                    </div>
                  </div>
                  <Badge variant="default">Assigned</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-black">Chemistry Exam</p>
                      <p className="text-sm text-gray-600">Registration confirmed</p>
                    </div>
                  </div>
                  <Badge variant="outline">Confirmed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

