'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap, 
  Calendar,
  Edit,
  Save,
  X,
  Download,
  History,
  Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface StudentProfile {
  id: string
  full_name: string
  email: string
  student_id: string
  roll_number: string
  phone?: string
  department: {
    id: string
    name: string
    code: string
  }
  classroom: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
}

interface ExamHistory {
  id: string
  title: string
  subject: string
  exam_date: string
  status: 'completed' | 'ongoing' | 'scheduled'
  hall: string
  seat?: string
  score?: number
  grade?: string
}

export default function StudentProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth()
  const router = useRouter()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  })

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'student')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  // Mock data - replace with actual data fetching
  useEffect(() => {
    const mockProfile: StudentProfile = {
      id: user?.id || '1',
      full_name: profile?.full_name || 'John Doe',
      email: user?.email || 'john.doe@university.edu',
      student_id: 'STU001',
      roll_number: 'CS001',
      phone: '+1234567890',
      department: {
        id: '1',
        name: 'Computer Science',
        code: 'CS'
      },
      classroom: {
        id: '1',
        name: 'CS-A'
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    }
    setStudentProfile(mockProfile)
    setFormData({
      full_name: mockProfile.full_name,
      phone: mockProfile.phone || ''
    })

    const mockExamHistory: ExamHistory[] = [
      {
        id: '1',
        title: 'Mathematics Final Exam',
        subject: 'Mathematics',
        exam_date: '2024-01-15',
        status: 'completed',
        hall: 'Hall A',
        seat: 'A-15',
        score: 85,
        grade: 'B+'
      },
      {
        id: '2',
        title: 'Physics Midterm',
        subject: 'Physics',
        exam_date: '2024-01-20',
        status: 'completed',
        hall: 'Hall B',
        seat: 'B-8',
        score: 92,
        grade: 'A-'
      },
      {
        id: '3',
        title: 'Chemistry Lab Exam',
        subject: 'Chemistry',
        exam_date: '2024-01-25',
        status: 'scheduled',
        hall: 'Lab 1',
        seat: 'L-12'
      }
    ]
    setExamHistory(mockExamHistory)
  }, [user, profile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'student' || !studentProfile) {
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone
      })
      
      if (!error) {
        setStudentProfile(prev => prev ? {
          ...prev,
          full_name: formData.full_name,
          phone: formData.phone
        } : null)
        setIsEditing(false)
      } else {
        console.error('Error updating profile:', error)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: studentProfile.full_name,
      phone: studentProfile.phone || ''
    })
    setIsEditing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'ongoing': return 'destructive'
      case 'scheduled': return 'secondary'
      default: return 'secondary'
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade?.charAt(0)) {
      case 'A': return 'text-green-600 dark:text-green-400'
      case 'B': return 'text-blue-600 dark:text-blue-400'
      case 'C': return 'text-yellow-600 dark:text-yellow-400'
      case 'D': return 'text-orange-600 dark:text-orange-400'
      case 'F': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your personal information and view exam history
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="history">Exam History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and contact information
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{studentProfile.full_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{studentProfile.email}</span>
                      </div>
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="student_id">Student ID</Label>
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                        <Award className="h-4 w-4 text-gray-500" />
                        <span>{studentProfile.student_id}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roll_number">Roll Number</Label>
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span>{studentProfile.roll_number}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="+1234567890"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{studentProfile.phone || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Department</Label>
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span>{studentProfile.department.name} ({studentProfile.department.code})</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Classroom</Label>
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span>{studentProfile.classroom.name}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Member Since</Label>
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{new Date(studentProfile.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Account Actions</CardTitle>
                  <CardDescription>
                    Manage your account settings and data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Profile Data
                  </Button>
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {/* Exam History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Exam History</CardTitle>
                  <CardDescription>
                    View your past and upcoming exam records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {examHistory.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{exam.title}</h3>
                            <Badge variant={getStatusColor(exam.status)}>
                              {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{exam.exam_date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span>{exam.hall}</span>
                            </div>
                            {exam.seat && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Seat: {exam.seat}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {exam.score && exam.grade && (
                            <div className="space-y-1">
                              <div className="text-lg font-bold">{exam.score}%</div>
                              <div className={`text-sm font-medium ${getGradeColor(exam.grade)}`}>
                                Grade: {exam.grade}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {examHistory.length === 0 && (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No exam history found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Your exam records will appear here once you start taking exams.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {examHistory.filter(e => e.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Completed Exams
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {examHistory.filter(e => e.status === 'scheduled').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Upcoming Exams
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {examHistory.filter(e => e.score).length > 0 
                          ? Math.round(examHistory.filter(e => e.score).reduce((sum, e) => sum + (e.score || 0), 0) / examHistory.filter(e => e.score).length)
                          : 0
                        }%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Average Score
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
