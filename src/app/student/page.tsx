'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { GraduationCap, Calendar, Clock, MapPin, Building, Users, Eye } from 'lucide-react'

interface Exam {
  id: string
  title: string
  subject: string
  description: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  instructions: string
  status: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'completed'
  scheduled_at?: string
  created_at: string
}

interface ExamAllocation {
  id: string
  exam_id: string
  hall_id: string
  student_id: string
  seat_row: number
  seat_column: number
  seat_number: string
  allocated_at: string
  exam: Exam
  hall: {
    id: string
    name: string
    building?: string
    floor?: string
    capacity: number
    rows: number
    columns: number
    seating_type: 'single' | 'double'
  }
}

export default function StudentDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [examAllocations, setExamAllocations] = useState<ExamAllocation[]>([])
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedExam, setSelectedExam] = useState<ExamAllocation | null>(null)
  const [showExamDetails, setShowExamDetails] = useState(false)

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'student')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && profile?.role === 'student') {
      fetchStudentData()
    }
  }, [user, profile])

  const fetchStudentData = async () => {
    try {
      setLoadingData(true)
      
      // Fetch exam allocations for this student
      const { data: allocations, error: allocationError } = await supabase
        .from('exam_allocations')
        .select(`
          *,
          exam:exams(*),
          hall:exam_halls(*)
        `)
        .eq('student_id', user?.id)
        .in('exam.status', ['published', 'scheduled'])

      if (allocationError) {
        return
      }

      setExamAllocations(allocations || [])

      // Fetch upcoming exams (published and scheduled) that this student's department is part of
      const { data: departmentData, error: deptError } = await supabase
        .from('profiles')
        .select('classroom:classrooms(department_id)')
        .eq('id', user?.id)
        .single()

      if (deptError || !departmentData?.classroom?.department_id) {
        return
      }

      const { data: exams, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
          exam_departments!inner(department_id)
        `)
        .eq('exam_departments.department_id', departmentData.classroom.department_id)
        .in('status', ['published', 'scheduled'])
        .gte('exam_date', new Date().toISOString().split('T')[0])

      if (examError) {
        return
      }

      setUpcomingExams(exams || [])
    } catch (error) {
      // Handle error silently
    } finally {
      setLoadingData(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <Calendar className="h-4 w-4" />
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const handleExamClick = (exam: Exam) => {
    const allocation = examAllocations.find(a => a.exam_id === exam.id)
    if (allocation) {
      setSelectedExam(allocation)
      setShowExamDetails(true)
    }
  }

  if (loading || loadingData) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {profile?.full_name || user.email}
              </h1>
              <p className="text-sm text-gray-500 truncate">
                Student Portal
              </p>
              {profile?.student_id && (
                <p className="text-xs text-gray-400 mt-1">
                  ID: {profile.student_id}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="secondary" className="hidden sm:flex items-center gap-1 text-xs">
                <GraduationCap className="h-3 w-3" />
                Student
              </Badge>
              <Button variant="outline" size="sm" onClick={signOut} className="text-xs">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">

        {/* Quick Stats - Mobile Optimized */}
        <div className="mb-6">
          <Card className="rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Upcoming Exams</p>
                    <p className="text-xl font-bold text-black">{upcomingExams.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-gray-900">{upcomingExams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Exams - Mobile Optimized */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Exams</h2>
            <Badge variant="outline" className="text-xs">
              {upcomingExams.length} exams
            </Badge>
          </div>
          
          {upcomingExams.length === 0 ? (
            <Card className="rounded-lg shadow-sm border border-gray-200">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">No upcoming exams</p>
                <p className="text-sm text-gray-400 mt-1">Check back later for new exams</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam) => {
                const allocation = examAllocations.find(a => a.exam_id === exam.id)
                const examDate = new Date(exam.exam_date)
                const isToday = examDate.toDateString() === new Date().toDateString()
                const isTomorrow = examDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
                
                return (
                  <Card 
                    key={exam.id}
                    className="rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleExamClick(exam)}
                  >
                    <CardContent className="p-4">
                      {/* Mobile Layout */}
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                              {exam.title}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                              {exam.subject}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(exam.status)} text-xs`}>
                            {exam.status}
                          </Badge>
                        </div>
                        
                        {/* Date and Time */}
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{examDate.toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{exam.start_time}</span>
                        </div>
                        
                        {/* Allocation Info */}
                        {allocation && (
                          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            <MapPin className="h-3 w-3" />
                            <span>Seat {allocation.seat_number}</span>
                            <span>•</span>
                            <span className="truncate">{allocation.hall.name}</span>
                          </div>
                        )}
                        
                        {/* Scheduled Info */}
                        {exam.status === 'scheduled' && exam.scheduled_at && (
                          <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                            <Clock className="h-3 w-3" />
                            <span>Publishes: {new Date(exam.scheduled_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {/* Action Button */}
                        {allocation && (
                          <div className="pt-2">
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Exam Details Modal - Mobile Responsive */}
        <Dialog open={showExamDetails} onOpenChange={setShowExamDetails}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto bg-white p-0">
            <DialogHeader className="p-4 border-b border-gray-200">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {selectedExam?.exam.title}
              </DialogTitle>
            </DialogHeader>
            
            {selectedExam && (
              <div className="p-4 space-y-4">
                {/* Exam Details - Mobile Layout */}
                <div className="space-y-4">
                  {/* Exam Information Card */}
                  <Card className="rounded-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Exam Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-600">Subject</p>
                          <p className="text-sm text-black">{selectedExam.exam.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Duration</p>
                          <p className="text-sm text-black">{selectedExam.exam.duration_minutes} min</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-600">Date</p>
                          <p className="text-sm text-black">{new Date(selectedExam.exam.exam_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Time</p>
                          <p className="text-sm text-black">{selectedExam.exam.start_time}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Your Allocation Card */}
                  <Card className="rounded-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Your Seat Allocation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Seat Number</p>
                          <p className="text-2xl font-bold text-green-600 font-mono">{selectedExam.seat_number}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-600">Hall</p>
                          <p className="text-sm text-black">{selectedExam.hall.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Position</p>
                          <p className="text-sm text-black">Row {selectedExam.seat_row}, Col {selectedExam.seat_column}</p>
                        </div>
                      </div>
                      {(selectedExam.hall.building || selectedExam.hall.floor) && (
                        <div className="grid grid-cols-2 gap-3">
                          {selectedExam.hall.building && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Building</p>
                              <p className="text-sm text-black">{selectedExam.hall.building}</p>
                            </div>
                          )}
                          {selectedExam.hall.floor && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Floor</p>
                              <p className="text-sm text-black">{selectedExam.hall.floor}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Instructions - Mobile */}
                {selectedExam.exam.instructions && (
                  <Card className="rounded-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedExam.exam.instructions}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Hall Layout Preview - Mobile */}
                <Card className="rounded-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Hall Layout
                    </CardTitle>
                    <p className="text-xs text-gray-600">
                      Your seat is highlighted in green
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-center text-gray-600 mb-3">
                        <p className="font-medium text-sm">{selectedExam.hall.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedExam.hall.seating_type === 'double' ? 'Double Seated' : 'Single Seated'} • 
                          {selectedExam.hall.rows}×{selectedExam.hall.columns}
                        </p>
                      </div>
                      
                      {/* Mobile-optimized layout visualization */}
                      <div className="overflow-x-auto">
                        <div className="grid gap-1 justify-center mx-auto" style={{
                          gridTemplateColumns: `repeat(${selectedExam.hall.columns}, 1fr)`,
                          width: 'fit-content',
                          minWidth: '200px'
                        }}>
                          {Array.from({ length: selectedExam.hall.rows * selectedExam.hall.columns }, (_, index) => {
                            const row = Math.floor(index / selectedExam.hall.columns) + 1
                            const col = (index % selectedExam.hall.columns) + 1
                            const isStudentSeat = row === selectedExam.seat_row && col === selectedExam.seat_column
                            
                            return (
                              <div
                                key={index}
                                className={`w-6 h-6 border border-gray-300 rounded text-xs flex items-center justify-center font-mono ${
                                  isStudentSeat 
                                    ? 'bg-green-500 text-white border-green-600 font-bold' 
                                    : 'bg-white text-gray-600'
                                }`}
                              >
                                {isStudentSeat ? 'U' : `${row}-${col}`}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

