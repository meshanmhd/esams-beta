'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  Navigation
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ExamDetails {
  id: string
  title: string
  subject: string
  description?: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: 'published' | 'scheduled' | 'ongoing' | 'completed'
  hall: {
    id: string
    name: string
    building?: string
    floor?: string
    capacity: number
    layout_type: string
  }
  student_seat?: {
    seat_number: string
    row_number: number
    column_number: number
  }
  registration_status: 'registered' | 'confirmed' | 'cancelled'
  attendance_status: 'not_checked_in' | 'checked_in' | 'checked_out'
  instructions?: string
  departments: string[]
  collision_group?: string
}

export default function StudentExamDetailsPage({ params }: { params: { id: string } }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [exam, setExam] = useState<ExamDetails | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'student')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  // Mock data - replace with actual data fetching
  useEffect(() => {
    const mockExam: ExamDetails = {
      id: params.id,
      title: 'Mathematics Final Exam',
      subject: 'Mathematics',
      description: 'Comprehensive final examination covering all topics from the semester',
      exam_date: '2024-01-15',
      start_time: '09:00',
      end_time: '12:00',
      duration_minutes: 180,
      status: 'published',
      hall: {
        id: '1',
        name: 'Hall A',
        building: 'Main Building',
        floor: 'Ground Floor',
        capacity: 100,
        layout_type: 'standard'
      },
      student_seat: {
        seat_number: 'A-15',
        row_number: 1,
        column_number: 15
      },
      registration_status: 'confirmed',
      attendance_status: 'not_checked_in',
      instructions: 'Please bring your student ID, calculator, and writing materials. No electronic devices except calculators are allowed.',
      departments: ['Computer Science', 'Electronics'],
      collision_group: 'Engineering Core'
    }
    setExam(mockExam)
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'student' || !exam) {
    return null
  }

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

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    // Simulate PDF download
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsDownloading(false)
    // In real implementation, this would trigger the PDF download
    console.log('Downloading seat allocation PDF...')
  }

  const handleCheckIn = () => {
    // Handle check-in logic
    console.log('Checking in for exam...')
  }

  const renderSeatLayout = () => {
    if (!exam.student_seat) return null

    const rows = 10
    const columns = 10
    const studentRow = exam.student_seat.row_number
    const studentCol = exam.student_seat.column_number

    return (
      <div className="space-y-2">
        {/* Column headers */}
        <div className="flex gap-1 ml-8">
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="w-8 h-6 flex items-center justify-center text-xs font-medium text-gray-500">
              {i + 1}
            </div>
          ))}
        </div>
        
        {/* Seat grid */}
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-1">
            {/* Row header */}
            <div className="w-6 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
              {String.fromCharCode(65 + rowIndex)}
            </div>
            
            {/* Seats in row */}
            {Array.from({ length: columns }, (_, colIndex) => {
              const isStudentSeat = rowIndex + 1 === studentRow && colIndex + 1 === studentCol
              const seatNumber = `${String.fromCharCode(65 + rowIndex)}-${colIndex + 1}`
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-8 h-8 border rounded text-xs font-medium flex items-center justify-center ${
                    isStudentSeat
                      ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  {isStudentSeat ? (
                    <User className="h-3 w-3" />
                  ) : (
                    colIndex + 1
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {exam.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {exam.subject} • {exam.exam_date}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Exam Information */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">Exam Information</CardTitle>
                      <CardDescription>
                        {exam.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusColor(exam.status)}>
                        {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                      </Badge>
                      <Badge variant={getRegistrationStatusColor(exam.registration_status)}>
                        {exam.registration_status.charAt(0).toUpperCase() + exam.registration_status.slice(1)}
                      </Badge>
                    </div>
                  </div>
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
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm"><strong>Duration:</strong> {exam.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm"><strong>Venue:</strong> {exam.hall.name}</span>
                    </div>
                  </div>

                  {exam.hall.building && exam.hall.floor && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Location:</strong> {exam.hall.building}, {exam.hall.floor}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Departments:</strong> {exam.departments.join(', ')}
                    </span>
                  </div>

                  {exam.collision_group && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Collision Group:</strong> {exam.collision_group}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seat Information */}
              {exam.student_seat && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Your Seat Assignment</CardTitle>
                    <CardDescription>
                      You have been assigned a seat for this exam
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">Your Seat</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {exam.student_seat.seat_number}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-200">
                        Row {exam.student_seat.row_number}, Column {exam.student_seat.column_number}
                      </div>
                    </div>

                    <div className="text-center">
                      <h4 className="font-medium mb-3">Classroom Layout</h4>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 inline-block">
                        {renderSeatLayout()}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        Your seat is highlighted in blue
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Instructions */}
              {exam.instructions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Exam Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {exam.instructions}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {exam.student_seat && (
                    <Button 
                      className="w-full" 
                      onClick={handleCheckIn}
                      disabled={exam.attendance_status === 'checked_in'}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {exam.attendance_status === 'checked_in' ? 'Checked In' : 'Check In'}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>

                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    View Instructions
                  </Button>
                </CardContent>
              </Card>

              {/* Hall Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hall Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{exam.hall.name}</span>
                  </div>
                  {exam.hall.building && exam.hall.floor && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {exam.hall.building}, {exam.hall.floor}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Capacity: {exam.hall.capacity} seats
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Layout: {exam.hall.layout_type}
                  </div>
                </CardContent>
              </Card>

              {/* Status Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Registration</span>
                    <Badge variant={getRegistrationStatusColor(exam.registration_status)}>
                      {exam.registration_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Seat Allocation</span>
                    <Badge variant={exam.student_seat ? 'default' : 'secondary'}>
                      {exam.student_seat ? 'Allocated' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Attendance</span>
                    <Badge variant={
                      exam.attendance_status === 'checked_in' ? 'default' : 
                      exam.attendance_status === 'checked_out' ? 'outline' : 'secondary'
                    }>
                      {exam.attendance_status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Help */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
