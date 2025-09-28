'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExamLayoutVisualizer } from '@/components/exam-layout-visualizer'
import jsPDF from 'jspdf'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Building2,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react'

interface Exam {
  id: string
  title: string
  subject: string
  description: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  max_students: number
  instructions: string
  status: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'completed'
  scheduled_at?: string
  created_at: string
  updated_at: string
  created_by: string
}

interface ExamHall {
  id: string
  name: string
  building?: string
  floor?: string
  capacity: number
  rows: number
  columns: number
  layout_type: string
}

interface SeatAllocation {
  id: string
  exam_id: string
  hall_id: string
  student_id: string
  seat_row: number
  seat_column: number
  seat_number: string
  student: {
    id: string
    full_name: string
    roll_number: string
    department_name: string
    classroom_name?: string
  }
}

export default function ExamDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [seatAllocations, setSeatAllocations] = useState<SeatAllocation[]>([])
  const [examHalls, setExamHalls] = useState<ExamHall[]>([])
  const [examDepartments, setExamDepartments] = useState<any[]>([])
  const [departmentStudents, setDepartmentStudents] = useState<any[]>([])
  const [showLayout, setShowLayout] = useState(false)
  const [showHallLayout, setShowHallLayout] = useState(false)
  const [showDepartmentStudents, setShowDepartmentStudents] = useState(false)
  const [selectedHall, setSelectedHall] = useState<ExamHall | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null)
  const [showAllLayouts, setShowAllLayouts] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDateTime, setScheduleDateTime] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (id) {
      fetchExamDetails()
    }
  }, [id])

  const fetchExamDetails = async () => {
    try {
      setLoadingData(true)

      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', id)
        .single()

      if (examError) throw examError
      setExam(examData)

      // Fetch seat allocations with student details
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('exam_allocations')
        .select(`
          *,
          student:profiles(
            id,
            full_name,
            roll_number,
            department:departments(name),
            classroom:classrooms(name)
          )
        `)
        .eq('exam_id', id)

      if (allocationsError) throw allocationsError

      const allocationsWithDetails = allocationsData?.map((allocation: any) => ({
        ...allocation,
        student: {
          id: allocation.student.id,
          full_name: allocation.student.full_name,
          roll_number: allocation.student.roll_number,
          department_name: allocation.student.department?.name || 'No Department',
          classroom_name: allocation.student.classroom?.name || 'No Classroom'
        }
      })) || []

      setSeatAllocations(allocationsWithDetails)

      // Fetch exam halls separately
      const { data: hallsData, error: hallsError } = await supabase
        .from('exam_halls')
        .select('*')
        .order('name')

      if (hallsError) throw hallsError
      setExamHalls(hallsData || [])

      // Fetch exam departments
      const { data: deptData, error: deptError } = await supabase
        .from('exam_departments')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('exam_id', id)

      if (deptError) throw deptError
      setExamDepartments(deptData || [])

      // Fetch students from selected departments
      if (deptData && deptData.length > 0) {
        const departmentIds = deptData.map((d: any) => d.department_id)
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select(`
            *,
            department:departments(name),
            classroom:classrooms(name)
          `)
          .eq('role', 'student')
          .in('department_id', departmentIds)
          .order('roll_number')

        if (studentsError) throw studentsError
        setDepartmentStudents(studentsData || [])
      }

    } catch (error) {
      // Handle error silently
    } finally {
      setLoadingData(false)
    }
  }

  const generateLayoutData = () => {
    const layouts = examHalls.map(hall => {
      const hallAllocations = seatAllocations.filter(a => a.hall_id === hall.id)
      
      // Create seat grid with actual allocations
      const seats = []
      let seatNumber = 1
      
      for (let row = 1; row <= hall.rows; row++) {
        for (let col = 1; col <= hall.columns; col++) {
          const allocation = hallAllocations.find(a => a.seat_row === row && a.seat_column === col)
          
          seats.push({
            id: `${hall.id}-${row}-${col}`,
            row,
            column: col,
            seat_number: allocation ? allocation.seat_number : seatNumber.toString().padStart(3, '0'),
            student: allocation ? {
              id: allocation.student.id,
              name: allocation.student.full_name,
              roll_number: allocation.student.roll_number,
              department: allocation.student.department_name
            } : null,
            is_occupied: !!allocation,
            seating_type: (hall.layout_type === 'double' ? 'double' : 'single') as 'double' | 'single'
          })
          seatNumber++
        }
      }

      return {
        hall_id: hall.id,
        hall_name: hall.name,
        rows: hall.rows,
        columns: hall.columns,
        seats
      }
    })

    return layouts
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'scheduled':
        return 'bg-purple-100 text-purple-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'unpublished':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEditExam = () => {
    router.push(`/admin/exams/${id}/edit`)
  }

  const handleDeleteExam = async () => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return
    }

    try {
      // Delete exam allocations first
      const { error: allocError } = await supabase
        .from('exam_allocations')
        .delete()
        .eq('exam_id', id)

      if (allocError) throw allocError

      // Delete exam departments
      const { error: deptError } = await supabase
        .from('exam_departments')
        .delete()
        .eq('exam_id', id)

      if (deptError) throw deptError

      // Delete the exam
      const { error: examError } = await supabase
        .from('exams')
        .delete()
        .eq('id', id)

      if (examError) throw examError

      alert('Exam deleted successfully!')
      router.push('/admin/exams')
    } catch (error) {
      // Handle error silently
      alert('Failed to delete exam. Please try again.')
    }
  }

  const handleUnpublishExam = async () => {
    if (!confirm('Are you sure you want to unpublish this exam? Students will no longer be able to see it.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'unpublished' })
        .eq('id', id)

      if (error) throw error

      alert('Exam unpublished successfully! Students can no longer see this exam.')
      // Refresh the exam data
      window.location.reload()
    } catch (error: any) {
      alert(`Failed to unpublish exam: ${error.message || 'Unknown error'}`)
    }
  }

  const handleRepublishExam = async () => {
    if (!confirm('Are you sure you want to republish this exam? Students will be able to see it again.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'published' })
        .eq('id', id)

      if (error) throw error

      alert('Exam republished successfully! Students can now see this exam again.')
      // Refresh the exam data
      window.location.reload()
    } catch (error) {
      // Handle error silently
      alert('Failed to republish exam. Please try again.')
    }
  }

  const handleScheduleExam = async () => {
    if (!scheduleDateTime) {
      alert('Please select a schedule date and time')
      return
    }

    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          status: 'scheduled',
          scheduled_at: scheduleDateTime
        })
        .eq('id', id)

      if (error) throw error

      alert('Exam scheduled successfully! It will be published automatically at the scheduled time.')
      setShowScheduleModal(false)
      window.location.reload()
    } catch (error) {
      // Handle error silently
      alert('Failed to schedule exam. Please try again.')
    }
  }

  const handlePublishNow = async () => {
    if (!confirm('Are you sure you want to publish this exam now? Students will be able to see it immediately.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          status: 'published',
          scheduled_at: null
        })
        .eq('id', id)

      if (error) throw error

      alert('Exam published successfully! Students can now see this exam.')
      window.location.reload()
    } catch (error) {
      // Handle error silently
      alert('Failed to publish exam. Please try again.')
    }
  }

  const handleUpdateSchedule = async () => {
    if (!scheduleDateTime) {
      alert('Please select a schedule date and time')
      return
    }

    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          scheduled_at: scheduleDateTime
        })
        .eq('id', id)

      if (error) throw error

      alert('Schedule updated successfully!')
      setShowScheduleModal(false)
      window.location.reload()
    } catch (error) {
      // Handle error silently
      alert('Failed to update schedule. Please try again.')
    }
  }

  const generatePDF = () => {
    if (!exam || !seatAllocations.length) {
      alert('No allocation data available to generate PDF')
      return
    }

    const doc = new jsPDF()
    
    // Header Section
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('ILAHIA COLLEGE OF ENGINEERING & TECHNOLOGY', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(exam.title.toUpperCase(), 105, 30, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    const examDate = new Date(exam.exam_date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).replace(/\//g, '/')
    const dayName = new Date(exam.exam_date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const session = exam.start_time < '12:00' ? '(FN)' : '(AN)'
    doc.text(`SEATING ARRANGEMENT -${examDate} ${dayName} ${session}`, 105, 40, { align: 'center' })
    
    // No lines around the title
    
    // Table headers
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    
    // Table position
    const startY = 55
    const colPositions = [20, 50, 90, 120, 140]
    
    // Headers
    doc.text('ROOM', colPositions[0], startY)
    doc.text('DEPARTMENT', colPositions[1], startY)
    doc.text('ROLL NO', colPositions[2], startY)
    doc.text('COUNT', colPositions[3], startY)
    doc.text('TOTAL', colPositions[4], startY)
    
    // No header lines
    
    // Group allocations by hall and department
    const groupedAllocations = seatAllocations.reduce((acc, allocation) => {
      const hallId = allocation.hall_id
      const deptName = allocation.student.department_name
      
      if (!acc[hallId]) {
        acc[hallId] = {}
      }
      if (!acc[hallId][deptName]) {
        acc[hallId][deptName] = []
      }
      acc[hallId][deptName].push(allocation)
      return acc
    }, {} as any)
    
    let currentY = startY + 8
    let isFirstHall = true
    
    // Process each hall
    Object.entries(groupedAllocations).forEach(([hallId, deptGroups], hallIndex) => {
      const hall = examHalls.find(h => h.id === hallId)
      if (!hall) return
      
      const hallName = hall.name
      let hallTotal = 0
      let isFirstDept = true
      
      // Process each department in this hall
      Object.entries(deptGroups as any).forEach(([deptName, allocations], deptIndex) => {
        const allocationsList = allocations as SeatAllocation[]
        const rollNumbers = allocationsList.map((a: any) => a.seat_number).sort((a: any, b: any) => parseInt(a) - parseInt(b))
        const minRoll = Math.min(...rollNumbers.map(r => parseInt(r)))
        const maxRoll = Math.max(...rollNumbers.map(r => parseInt(r)))
        const count = allocationsList.length
        
        hallTotal += count
        
        // Table row
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        
        // Room number (only show once per hall)
        if (isFirstDept) {
          doc.text(hallName, colPositions[0], currentY)
        }
        
        // Department
        doc.text(deptName, colPositions[1], currentY)
        
        // Roll numbers (center aligned)
        doc.text(`${minRoll}-${maxRoll}`, colPositions[2] + 10, currentY, { align: 'center' })
        
        // Count (right aligned)
        doc.text(count.toString(), colPositions[3] + 15, currentY, { align: 'right' })
        
        // Total (only show once per hall, right aligned)
        if (deptIndex === Object.keys(deptGroups as any).length - 1) {
          doc.text(hallTotal.toString(), colPositions[4] + 15, currentY, { align: 'right' })
        }
        
        // No row lines
        
        currentY += 5
        isFirstDept = false
      })
      
      // No hall separator lines
      
      isFirstHall = false
    })
    
    // No final bottom line
    
    // Download the PDF
    const fileName = `${exam.title.replace(/\s+/g, '_')}_${examDate.replace(/\//g, '-')}.pdf`
    doc.save(fileName)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <AlertCircle className="h-4 w-4" />
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'published':
        return <CheckCircle className="h-4 w-4" />
      case 'unpublished':
        return <AlertCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading || loadingData) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!exam) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Exam Not Found</h2>
            <p className="text-gray-600 mb-6">The exam you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/admin/exams')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
                  <p className="text-gray-600">{exam.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(exam.status)}>
                  {getStatusIcon(exam.status)}
                  <span className="ml-1 capitalize">{exam.status}</span>
                </Badge>
                <Button variant="outline" size="sm" onClick={handleEditExam}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                {/* Draft Status - Can run allocation and publish/schedule */}
                {exam.status === 'draft' && (
                  <>
                    <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700" onClick={() => setShowAllLayouts(true)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Run Allocation
                    </Button>
                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={handlePublishNow}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish Now
                    </Button>
                    <Button variant="outline" size="sm" className="text-purple-600 hover:text-purple-700" onClick={() => setShowScheduleModal(true)}>
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </>
                )}
                
                {/* Scheduled Status - Can modify schedule or publish now */}
                {exam.status === 'scheduled' && (
                  <>
                    <Button variant="outline" size="sm" className="text-purple-600 hover:text-purple-700" onClick={() => {
                      setScheduleDateTime(exam.scheduled_at || '')
                      setShowScheduleModal(true)
                    }}>
                      <Clock className="h-4 w-4 mr-2" />
                      Modify Schedule
                    </Button>
                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={handlePublishNow}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish Now
                    </Button>
                  </>
                )}
                
                {/* Published Status - Can unpublish */}
                {exam.status === 'published' && (
                  <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700" onClick={handleUnpublishExam}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Unpublish
                  </Button>
                )}
                
                
                {/* Unpublished Status - Can republish */}
                {exam.status === 'unpublished' && (
                  <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={handleRepublishExam}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Republish
                  </Button>
                )}
                
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDeleteExam}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Exam Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Exam Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm"><strong>Date:</strong> {exam.exam_date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm"><strong>Time:</strong> {exam.start_time} - {exam.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm"><strong>Duration:</strong> {exam.duration_minutes} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm"><strong>Max Students:</strong> {exam.max_students || 'No limit'}</span>
                      </div>
                    </div>
                    {exam.description && (
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{exam.description}</p>
                      </div>
                    )}
                    {exam.instructions && (
                      <div>
                        <h4 className="font-medium mb-2">Instructions</h4>
                        <p className="text-sm text-gray-600">{exam.instructions}</p>
                      </div>
                    )}
                    {exam.status === 'scheduled' && exam.scheduled_at && (
                      <div>
                        <h4 className="font-medium mb-2">Scheduled Publishing</h4>
                        <p className="text-sm text-gray-600">
                          Will be published on: {new Date(exam.scheduled_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Auto-publish enabled
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Exam Halls - Simplified List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Exam Halls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {examHalls.map((hall) => {
                        const hallAllocations = seatAllocations.filter(a => a.hall_id === hall.id)
                        const seatingType = hall.layout_type === 'double' ? 'Double Seated' : 'Single Seated'
                        return (
                          <div 
                            key={hall.id} 
                            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              setSelectedHall(hall)
                              setShowHallLayout(true)
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{hall.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {hall.building} • {hall.floor} • {hall.capacity} seats
                                </p>
                                <p className="text-xs text-gray-500">
                                  {hall.rows} rows × {hall.columns} columns • {seatingType}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-green-600">
                                  {hallAllocations.length} allocated
                                </div>
                                <div className="text-xs text-gray-500">
                                  {Math.round((hallAllocations.length / hall.capacity) * 100)}% utilization
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  Click to view layout
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Departments - Simplified List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Departments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {examDepartments.map((dept) => {
                        const deptStudents = departmentStudents.filter(s => s.department_id === dept.department_id)
                        return (
                          <div 
                            key={dept.id} 
                            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              setSelectedDepartment({ ...dept, students: deptStudents })
                              setShowDepartmentStudents(true)
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{dept.department.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {deptStudents.length} students enrolled
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-blue-600">
                                  Click to view students
                              </div>
                            </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Statistics moved here */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Allocated:</span>
                      <span className="font-medium">{seatAllocations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Capacity:</span>
                      <span className="font-medium">
                        {examHalls.reduce((total, hall) => total + hall.capacity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Utilization:</span>
                      <span className="font-medium text-blue-600">
                        {examHalls.length > 0 ? Math.round(
                          (seatAllocations.length / examHalls.reduce((total, hall) => total + hall.capacity, 0)) * 100
                        ) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Departments:</span>
                      <span className="font-medium">{examDepartments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Exam Halls:</span>
                      <span className="font-medium">{examHalls.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => setShowAllLayouts(true)}
                      disabled={seatAllocations.length === 0}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View All Layouts
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={generatePDF}
                      disabled={seatAllocations.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* All Layouts Modal - 40% Hall List + 60% Layout */}
            {showAllLayouts && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50 p-8"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)' }}
              >
                <div 
                  className="rounded-lg w-full max-w-7xl h-[85vh] overflow-hidden"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex h-full">
                    {/* Left Side - Hall List (40%) */}
                    <div className="w-2/5 border-r border-gray-200 overflow-y-auto">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">Exam Halls</h2>
                          <Button variant="outline" size="sm" onClick={() => setShowAllLayouts(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                      <div className="p-6 space-y-2">
                        {examHalls.map((hall) => {
                          const hallAllocations = seatAllocations.filter(a => a.hall_id === hall.id)
                          const isSelected = selectedHall?.id === hall.id
                          return (
                            <div
                              key={hall.id}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-blue-50 border-2 border-blue-300' 
                                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                              }`}
                              onClick={() => setSelectedHall(hall)}
                            >
                              <div className="font-medium text-sm">{hall.name}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {hall.building} • {hall.floor} • {hall.capacity} seats
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {hall.rows} rows × {hall.columns} columns
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                {hallAllocations.length} allocated
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Right Side - Layout (60%) */}
                    <div className="w-3/5 overflow-y-auto">
                      <div className="h-full p-8">
                        {selectedHall ? (
                    <ExamLayoutVisualizer 
                            layouts={[{
                              hall_id: selectedHall.id,
                              hall_name: selectedHall.name,
                              rows: selectedHall.rows,
                              columns: selectedHall.columns,
                              seats: generateLayoutData().find(l => l.hall_id === selectedHall.id)?.seats || []
                            }]}
                            onClose={() => setShowAllLayouts(false)}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>Select a hall from the list to view its layout</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hall Layout Modal */}
            {showHallLayout && selectedHall && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50 p-8"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)' }}
                onClick={() => setShowHallLayout(false)}
              >
                <div 
                  className="rounded-lg w-full max-w-6xl h-[85vh] overflow-auto"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-8">
                    <ExamLayoutVisualizer 
                      layouts={[{
                        hall_id: selectedHall.id,
                        hall_name: selectedHall.name,
                        rows: selectedHall.rows,
                        columns: selectedHall.columns,
                        seats: generateLayoutData().find(l => l.hall_id === selectedHall.id)?.seats || []
                      }]}
                      onClose={() => setShowHallLayout(false)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Department Students Modal */}
            {showDepartmentStudents && selectedDepartment && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50 p-8"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)' }}
              >
                <div 
                  className="rounded-lg w-full max-w-4xl h-[85vh] overflow-auto"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold">{selectedDepartment.department.name} - Students</h2>
                        <p className="text-sm text-gray-600">
                          {selectedDepartment.students.length} students enrolled
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setShowDepartmentStudents(false)}>
                        Close
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {selectedDepartment.students.map((student: any) => {
                        const allocation = seatAllocations.find(a => a.student_id === student.id)
                        return (
                          <div key={student.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{student.full_name}</h4>
                                <p className="text-sm text-gray-600">Roll: {student.roll_number}</p>
                                <p className="text-xs text-gray-500">
                                  {student.classroom?.name || 'No classroom assigned'}
                                </p>
                              </div>
                              <div className="text-right">
                                {allocation ? (
                                  <div className="text-sm">
                                    <div className="font-medium text-green-600">
                                      Seat {allocation.seat_number}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Row {allocation.seat_row}, Col {allocation.seat_column}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      {examHalls.find(h => h.id === allocation.hall_id)?.name}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    Not allocated
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50 p-8"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)' }}
              >
                <div 
                  className="rounded-lg w-full max-w-md h-auto overflow-auto"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">
                        {exam?.status === 'scheduled' ? 'Modify Schedule' : 'Schedule Exam'}
                      </h2>
                      <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(false)}>
                        Close
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Schedule Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduleDateTime}
                          onChange={(e) => setScheduleDateTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>The exam will be automatically published at the scheduled time.</p>
                        {exam?.status === 'scheduled' && exam.scheduled_at && (
                          <p className="mt-2">
                            <strong>Current schedule:</strong> {new Date(exam.scheduled_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowScheduleModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={exam?.status === 'scheduled' ? handleUpdateSchedule : handleScheduleExam}
                          disabled={!scheduleDateTime}
                        >
                          {exam?.status === 'scheduled' ? 'Update Schedule' : 'Schedule Exam'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
