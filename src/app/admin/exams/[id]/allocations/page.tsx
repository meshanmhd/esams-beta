'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Settings, 
  Eye, 
  RotateCcw, 
  Download,
  Maximize2,
  User,
  Building2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface Seat {
  id: string
  seat_number: string
  row_number: number
  column_number: number
  status: 'available' | 'occupied' | 'reserved'
  student?: {
    id: string
    full_name: string
    roll_number: string
    department: string
  }
}

interface ExamHall {
  id: string
  name: string
  building?: string
  floor?: string
  capacity: number
  layout_type: string
  rows: number
  columns: number
}

interface Exam {
  id: string
  title: string
  subject: string
  exam_date: string
  start_time: string
  end_time: string
  hall: ExamHall
  total_students: number
  allocated_students: number
}

export default function SeatAllocationPage({ params }: { params: { id: string } }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  // Mock data - replace with actual data fetching
  useEffect(() => {
    const mockExam: Exam = {
      id: params.id,
      title: 'Mathematics Final Exam',
      subject: 'Mathematics',
      exam_date: '2024-01-15',
      start_time: '09:00',
      end_time: '12:00',
      hall: {
        id: '1',
        name: 'Hall A',
        building: 'Main Building',
        floor: 'Ground Floor',
        capacity: 100,
        layout_type: 'standard',
        rows: 10,
        columns: 10
      },
      total_students: 85,
      allocated_students: 85
    }
    setExam(mockExam)

    // Generate mock seats
    const mockSeats: Seat[] = []
    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 10; col++) {
        const seatNumber = `${String.fromCharCode(64 + row)}-${col}`
        const isOccupied = Math.random() > 0.15 // 85% occupied
        
        mockSeats.push({
          id: `${row}-${col}`,
          seat_number: seatNumber,
          row_number: row,
          column_number: col,
          status: isOccupied ? 'occupied' : 'available',
          student: isOccupied ? {
            id: `student-${row}-${col}`,
            full_name: `Student ${row}${col}`,
            roll_number: `CS${String(row).padStart(2, '0')}${String(col).padStart(2, '0')}`,
            department: 'Computer Science'
          } : undefined
        })
      }
    }
    setSeats(mockSeats)
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin' || !exam) {
    return null
  }

  const getSeatColor = (seat: Seat) => {
    switch (seat.status) {
      case 'occupied':
        return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200'
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200'
      case 'available':
        return 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600'
    }
  }

  const getSeatIcon = (seat: Seat) => {
    if (seat.status === 'occupied') {
      return <User className="h-3 w-3" />
    }
    return null
  }

  const renderSeatGrid = () => {
    const rows = exam.hall.rows
    const columns = exam.hall.columns
    
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
              const seat = seats.find(s => s.row_number === rowIndex + 1 && s.column_number === colIndex + 1)
              if (!seat) return null
              
              return (
                <Dialog key={seat.id}>
                  <DialogTrigger asChild>
                    <button
                      className={`w-8 h-8 border rounded text-xs font-medium flex items-center justify-center hover:scale-105 transition-transform ${getSeatColor(seat)}`}
                      onClick={() => setSelectedSeat(seat)}
                    >
                      {getSeatIcon(seat) || seat.seat_number.split('-')[1]}
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Seat {seat.seat_number}</DialogTitle>
                      <DialogDescription>
                        {seat.status === 'occupied' ? 'Occupied by student' : 'Available seat'}
                      </DialogDescription>
                    </DialogHeader>
                    {seat.student && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{seat.student.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{seat.student.roll_number}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {seat.student.department}
                          </span>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const occupiedSeats = seats.filter(s => s.status === 'occupied').length
  const availableSeats = seats.filter(s => s.status === 'available').length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Seat Allocation
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {exam.title} - {exam.hall.name}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFullscreen(!isFullscreen)}>
                <Maximize2 className="h-4 w-4 mr-2" />
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Layout
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Statistics */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hall Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{exam.hall.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {exam.hall.building && exam.hall.floor && (
                      <div>{exam.hall.building}, {exam.hall.floor}</div>
                    )}
                    <div>Capacity: {exam.hall.capacity} seats</div>
                    <div>Layout: {exam.hall.layout_type}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Allocation Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Students</span>
                    <Badge variant="secondary">{exam.total_students}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Allocated</span>
                    <Badge variant="default">{occupiedSeats}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Available</span>
                    <Badge variant="outline">{availableSeats}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Utilization</span>
                    <Badge variant="outline">
                      {Math.round((occupiedSeats / exam.hall.capacity) * 100)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reallocate Seats
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Adjust Layout
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View by Department
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Seat Layout */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Classroom Layout</CardTitle>
                  <CardDescription>
                    Click on any seat to view student details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      {renderSeatGrid()}
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-6 flex justify-center">
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                        <span>Occupied</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                        <span>Reserved</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Department View */}
          <div className="mt-8">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="departments">By Department</TabsTrigger>
                <TabsTrigger value="unallocated">Unallocated Students</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Allocation Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{occupiedSeats}</div>
                        <div className="text-sm text-green-600">Allocated Seats</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{availableSeats}</div>
                        <div className="text-sm text-blue-600">Available Seats</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round((occupiedSeats / exam.hall.capacity) * 100)}%
                        </div>
                        <div className="text-sm text-purple-600">Hall Utilization</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="departments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Allocation by Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Computer Science', 'Electronics', 'Mechanical'].map((dept) => (
                        <div key={dept} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{dept}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {Math.floor(Math.random() * 30) + 20} students allocated
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {Math.floor(Math.random() * 30) + 20} seats
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="unallocated" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Unallocated Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        All students allocated
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        All registered students have been assigned seats.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
