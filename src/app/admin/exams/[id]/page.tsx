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
  AlertCircle
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
  status: 'draft' | 'published' | 'completed'
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
  seat_number: string
  row_number: number
  column_number: number
  student: {
    id: string
    full_name: string
    roll_number: string
    department_name: string
    classroom_name?: string
  }
  hall: ExamHall
}

export default function ExamDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [seatAllocations, setSeatAllocations] = useState<SeatAllocation[]>([])
  const [examHalls, setExamHalls] = useState<ExamHall[]>([])
  const [showLayout, setShowLayout] = useState(false)
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

      // Fetch seat allocations with student and hall details
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('seat_allocations')
        .select(`
          *,
          student:profiles(
            id,
            full_name,
            roll_number,
            department:departments(name),
            classroom:classrooms(name)
          ),
          hall:exam_halls(*)
        `)
        .eq('exam_id', id)

      if (allocationsError) throw allocationsError

      const allocationsWithDetails = allocationsData?.map(allocation => ({
        ...allocation,
        student: {
          id: allocation.student.id,
          full_name: allocation.student.full_name,
          roll_number: allocation.student.roll_number,
          department_name: allocation.student.department?.name || 'No Department',
          classroom_name: allocation.student.classroom?.name || 'No Classroom'
        },
        hall: allocation.hall
      })) || []

      setSeatAllocations(allocationsWithDetails)

      // Get unique halls from allocations
      const uniqueHalls = allocationsWithDetails.reduce((acc, allocation) => {
        if (!acc.find(h => h.id === allocation.hall.id)) {
          acc.push(allocation.hall)
        }
        return acc
      }, [] as ExamHall[])

      setExamHalls(uniqueHalls)

    } catch (error) {
      console.error('Error fetching exam details:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const generateLayoutData = () => {
    const layouts = examHalls.map(hall => {
      const hallAllocations = seatAllocations.filter(a => a.hall_id === hall.id)
      
      // Create seat grid
      const seats = []
      let seatNumber = 1
      
      for (let row = 1; row <= hall.rows; row++) {
        for (let col = 1; col <= hall.columns; col++) {
          const allocation = hallAllocations.find(a => a.row_number === row && a.column_number === col)
          
          seats.push({
            id: `${hall.id}-${row}-${col}`,
            row,
            column,
            seat_number: seatNumber.toString().padStart(3, '0'),
            student: allocation ? {
              id: allocation.student.id,
              name: allocation.student.full_name,
              roll_number: allocation.student.roll_number,
              department: allocation.student.department_name
            } : null,
            is_occupied: !!allocation
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
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <AlertCircle className="h-4 w-4" />
      case 'published':
        return <CheckCircle className="h-4 w-4" />
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
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
                  </CardContent>
                </Card>

                {/* Halls and Allocations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Exam Halls & Allocations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {examHalls.map((hall) => {
                        const hallAllocations = seatAllocations.filter(a => a.hall_id === hall.id)
                        return (
                          <div key={hall.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{hall.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {hall.building} • {hall.floor} • {hall.capacity} seats
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-green-600">
                                  {hallAllocations.length} allocated
                                </div>
                                <div className="text-xs text-gray-500">
                                  {Math.round((hallAllocations.length / hall.capacity) * 100)}% utilization
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              Layout: {hall.rows} rows × {hall.columns} columns
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => setShowLayout(true)}
                      disabled={seatAllocations.length === 0}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Seat Layout
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Students
                    </Button>
                    <Button variant="outline" className="w-full">
                      <MapPin className="h-4 w-4 mr-2" />
                      Manage Halls
                    </Button>
                  </CardContent>
                </Card>

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
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Layout Visualizer Modal */}
            {showLayout && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto">
                  <div className="p-6">
                    <ExamLayoutVisualizer 
                      layouts={generateLayoutData()}
                      onClose={() => setShowLayout(false)}
                    />
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
