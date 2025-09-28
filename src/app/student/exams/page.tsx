'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, MapPin, Clock, User, Search, Filter, Eye, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface StudentExam {
  id: string
  title: string
  subject: string
  exam_date: string
  start_time: string
  end_time: string
  status: 'published' | 'scheduled' | 'ongoing' | 'completed'
  hall: { 
    name: string
    building?: string
    floor?: string
  }
  seat?: { 
    seat_number: string
    row_number: number
    column_number: number
  }
  registration_status: 'registered' | 'confirmed' | 'cancelled'
  attendance_status: 'not_checked_in' | 'checked_in' | 'checked_out'
  is_allocated: boolean
  can_register: boolean
  max_students?: number
  current_registrations?: number
}

export default function StudentExamsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [exams, setExams] = useState<StudentExam[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [allocationFilter, setAllocationFilter] = useState<string>('all')

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'student')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  // Fetch real exam data
  useEffect(() => {
    if (user && profile?.role === 'student') {
      fetchStudentExams()
    }
  }, [user, profile])

  const fetchStudentExams = async () => {
    try {
      // Fetch exams that the student is registered for
      const { data: registrations, error: regError } = await supabase
        .from('exam_registrations')
        .select(`
          *,
          exam:exams(
            *,
            hall:exam_halls(*),
            seat_allocation:seat_allocations(
              seat:seats(*)
            )
          )
        `)
        .eq('student_id', user?.id)
        .eq('status', 'registered')

      if (regError) throw regError

      // Transform the data to match our interface
      const studentExams: StudentExam[] = registrations?.map((reg: any) => {
        const exam = reg.exam
        const hall = exam.hall
        const seatAllocation = reg.exam.seat_allocation?.[0]
        
        return {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          exam_date: exam.exam_date,
          start_time: exam.start_time,
          end_time: exam.end_time,
          status: exam.status,
          hall: {
            name: hall.name,
            building: hall.building,
            floor: hall.floor
          },
          seat: seatAllocation?.seat ? {
            seat_number: seatAllocation.seat.seat_number,
            row_number: seatAllocation.seat.row_number,
            column_number: seatAllocation.seat.column_number
          } : undefined,
          registration_status: reg.status,
          attendance_status: 'not_checked_in', // This would come from attendance table
          is_allocated: !!seatAllocation,
          can_register: false,
          max_students: exam.max_students,
          current_registrations: 0 // This would need to be calculated
        }
      }) || []

      setExams(studentExams)
    } catch (error) {
      console.error('Error fetching student exams:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'student') {
    return null
  }

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter
    
    const matchesAllocation = allocationFilter === 'all' || 
      (allocationFilter === 'allocated' && exam.is_allocated) ||
      (allocationFilter === 'not_allocated' && !exam.is_allocated)
    
    return matchesSearch && matchesStatus && matchesAllocation
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default'
      case 'scheduled': return 'secondary'
      case 'ongoing': return 'destructive'
      case 'completed': return 'outline'
      default: return 'secondary'
    }
  }

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default'
      case 'registered': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusCounts = () => {
    return {
      total: exams.length,
      published: exams.filter(e => e.status === 'published').length,
      scheduled: exams.filter(e => e.status === 'scheduled').length,
      ongoing: exams.filter(e => e.status === 'ongoing').length,
      completed: exams.filter(e => e.status === 'completed').length,
      allocated: exams.filter(e => e.is_allocated).length,
      not_allocated: exams.filter(e => !e.is_allocated).length
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Exams
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View your registered exams and seat assignments
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({statusCounts.total})</TabsTrigger>
            <TabsTrigger value="published">Published ({statusCounts.published})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({statusCounts.scheduled})</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing ({statusCounts.ongoing})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search exams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allocation">Allocation</Label>
                    <Select value={allocationFilter} onValueChange={setAllocationFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All allocations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Allocations</SelectItem>
                        <SelectItem value="allocated">Allocated</SelectItem>
                        <SelectItem value="not_allocated">Not Allocated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Results</Label>
                    <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                      <span className="text-sm text-muted-foreground">
                        {filteredExams.length} exams
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exam Cards */}
            <div className="grid gap-6">
              {filteredExams.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{exam.title}</CardTitle>
                        <CardDescription className="text-base">
                          {exam.subject} • {exam.exam_date} • {exam.start_time} - {exam.end_time}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(exam.status)}>
                          {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                        </Badge>
                        <Badge variant={getRegistrationStatusColor(exam.registration_status)}>
                          {exam.registration_status.charAt(0).toUpperCase() + exam.registration_status.slice(1)}
                        </Badge>
                        {exam.is_allocated && (
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Allocated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {exam.hall.name}
                          {exam.hall.building && exam.hall.floor && (
                            <span> • {exam.hall.building}, {exam.hall.floor}</span>
                          )}
                        </span>
                      </div>
                      {exam.seat ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Seat: {exam.seat.seat_number} (Row {exam.seat.row_number}, Col {exam.seat.column_number})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {exam.is_allocated ? 'Seat allocation pending' : 'Not registered'}
                          </span>
                        </div>
                      )}
                      {exam.max_students && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {exam.current_registrations}/{exam.max_students} registered
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {exam.seat && exam.status === 'published' && (
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Check In
                        </Button>
                      )}
                      {exam.can_register && (
                        <Button size="sm">
                          Register
                        </Button>
                      )}
                      {exam.is_allocated && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download PDF
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredExams.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No exams found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {searchTerm || statusFilter !== 'all' || allocationFilter !== 'all'
                        ? 'Try adjusting your filters or search terms.'
                        : 'No exams are currently available for registration.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Individual tab contents for each status */}
          {['published', 'scheduled', 'ongoing', 'completed'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-6">
              <div className="grid gap-6">
                {exams.filter(exam => exam.status === status).map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{exam.title}</CardTitle>
                          <CardDescription className="text-base">
                            {exam.subject} • {exam.exam_date} • {exam.start_time} - {exam.end_time}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(exam.status)}>
                            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                          </Badge>
                          <Badge variant={getRegistrationStatusColor(exam.registration_status)}>
                            {exam.registration_status.charAt(0).toUpperCase() + exam.registration_status.slice(1)}
                          </Badge>
                          {exam.is_allocated && (
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Allocated
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {exam.hall.name}
                            {exam.hall.building && exam.hall.floor && (
                              <span> • {exam.hall.building}, {exam.hall.floor}</span>
                            )}
                          </span>
                        </div>
                        {exam.seat ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Seat: {exam.seat.seat_number} (Row {exam.seat.row_number}, Col {exam.seat.column_number})
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {exam.is_allocated ? 'Seat allocation pending' : 'Not registered'}
                            </span>
                          </div>
                        )}
                        {exam.max_students && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {exam.current_registrations}/{exam.max_students} registered
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        {exam.seat && exam.status === 'published' && (
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Check In
                          </Button>
                        )}
                        {exam.can_register && (
                          <Button size="sm">
                            Register
                          </Button>
                        )}
                        {exam.is_allocated && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download PDF
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {exams.filter(exam => exam.status === status).length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No {status} exams found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {status === 'published' 
                          ? 'No published exams are currently available.'
                          : `No exams are currently in ${status} status.`
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
