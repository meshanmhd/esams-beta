'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  Building2, 
  Clock,
  Calendar,
  MapPin
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalExams: number
  publishedExams: number
  scheduledExams: number
  upcomingExams: number
  totalStudents: number
  totalHalls: number
  totalDepartments: number
}

interface RecentExam {
  id: string
  title: string
  date: string
  status: string
  hall: string
  students: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    publishedExams: 0,
    scheduledExams: 0,
    upcomingExams: 0,
    totalStudents: 0,
    totalHalls: 0,
    totalDepartments: 0
  })
  const [recentExams, setRecentExams] = useState<RecentExam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch exams data
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*')
      
      if (examsError) throw examsError

      // Fetch students data
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
      
      if (studentsError) throw studentsError

      // Fetch halls data
      const { data: halls, error: hallsError } = await supabase
        .from('exam_halls')
        .select('*')
      
      if (hallsError) throw hallsError

      // Fetch departments data
      const { data: departments, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
      
      if (departmentsError) throw departmentsError

      // Calculate stats
      const totalExams = exams?.length || 0
      const publishedExams = exams?.filter(e => e.status === 'published').length || 0
      const scheduledExams = exams?.filter(e => e.status === 'scheduled').length || 0
      const upcomingExams = exams?.filter(e => {
        const examDate = new Date(e.exam_date)
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        return examDate >= today && examDate <= nextWeek
      }).length || 0

      setStats({
        totalExams,
        publishedExams,
        scheduledExams,
        upcomingExams,
        totalStudents: students?.length || 0,
        totalHalls: halls?.length || 0,
        totalDepartments: departments?.length || 0
      })

      // Set recent exams
      const recent = exams?.slice(0, 3).map(exam => ({
        id: exam.id,
        title: exam.title,
        date: exam.exam_date,
        status: exam.status,
        hall: exam.hall_name || 'TBD',
        students: exam.registered_students || 0
      })) || []

      setRecentExams(recent)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default'
      case 'scheduled': return 'secondary'
      case 'draft': return 'outline'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedExams} published, {stats.scheduledExams} scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingExams}</div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.totalDepartments} departments
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exam Halls</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHalls}</div>
            <p className="text-xs text-muted-foreground">
              Available venues
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Recent Exams */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Exams</h2>
          <Link href="/admin/exams">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
        <div className="grid gap-4">
          {recentExams.map((exam) => (
            <Card key={exam.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{exam.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {exam.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {exam.hall}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {exam.students} students
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(exam.status)}>
                      {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                    </Badge>
                    <Link href={`/admin/exams/${exam.id}`}>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
