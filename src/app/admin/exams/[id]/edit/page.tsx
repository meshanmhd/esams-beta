'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Building2, 
  Settings,
  Eye,
  Play,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  X,
  RotateCcw
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'
import { runSeatAllocation, generateExamLayout, type Student, type ExamHall as SeatAllocatorExamHall, type CollisionGroup as SeatAllocatorCollisionGroup, type AllocationResult } from '@/lib/seat-allocation'
import { ExamLayoutVisualizer } from '@/components/exam-layout-visualizer'

interface ExamFormData {
  title: string
  subject: string
  description: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: string
  selected_halls: string[]
  max_students: string
  instructions: string
  selected_departments: string[]
  selected_collision_groups: string[]
}

interface Department {
  id: string
  name: string
  student_count: number
}

interface ExamHall {
  id: string
  name: string
  building: string
  floor: string
  capacity: number
  rows: number
  columns: number
  layout_type: string
  seating_type?: 'single' | 'double'
}

interface CollisionGroup {
  id: string
  name: string
  description: string
  departments?: string[]
}

export default function EditExamPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    subject: '',
    description: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: '',
    selected_halls: [],
    max_students: '',
    instructions: '',
    selected_departments: [],
    selected_collision_groups: []
  })
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [examHalls, setExamHalls] = useState<ExamHall[]>([])
  const [collisionGroups, setCollisionGroups] = useState<CollisionGroup[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [allocationResult, setAllocationResult] = useState<AllocationResult | null>(null)
  const [allocationComplete, setAllocationComplete] = useState(false)
  const [isAllocating, setIsAllocating] = useState(false)
  const [showLayout, setShowLayout] = useState(false)
  const [showSchedulePopup, setShowSchedulePopup] = useState(false)
  const [scheduleAt, setScheduleAt] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)

  const steps = [
    { id: 1, title: 'Basic Details', description: 'Exam information' },
    { id: 2, title: 'Departments', description: 'Select departments' },
    { id: 3, title: 'Halls & Groups', description: 'Choose halls and collision groups' },
    { id: 4, title: 'Allocation', description: 'Run seat allocation' },
    { id: 5, title: 'Review', description: 'Review and publish' }
  ]

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (id) {
      fetchExamData()
    }
  }, [id])

  const fetchExamData = async () => {
    try {
      setLoadingData(true)
      
      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', id)
        .single()

      if (examError) throw examError
      
      // Set form data
      setFormData({
        title: examData.title || '',
        subject: examData.subject || '',
        description: examData.description || '',
        exam_date: examData.exam_date || '',
        start_time: examData.start_time || '',
        end_time: examData.end_time || '',
        duration_minutes: examData.duration_minutes?.toString() || '',
        selected_halls: [],
        max_students: examData.max_students?.toString() || '',
        instructions: examData.instructions || '',
        selected_departments: [],
        selected_collision_groups: []
      })

      // Fetch exam departments
      const { data: deptData, error: deptError } = await supabase
        .from('exam_departments')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('exam_id', id)

      if (deptError) throw deptError
      
      setFormData(prev => ({
        ...prev,
        selected_departments: deptData?.map((d: any) => d.department_id) || []
      }))

      // Fetch all departments
      const { data: allDepts, error: allDeptsError } = await supabase
        .from('departments')
        .select(`
          *,
          profiles!inner(count)
        `)
        .eq('profiles.role', 'student')

      if (allDeptsError) throw allDeptsError
      
      setDepartments(allDepts?.map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        student_count: dept.profiles?.[0]?.count || 0
      })) || [])

      // Fetch exam halls
      const { data: hallsData, error: hallsError } = await supabase
        .from('exam_halls')
        .select('*')
        .order('name')

      if (hallsError) throw hallsError
      setExamHalls(hallsData || [])

      // Fetch collision groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('collision_groups')
        .select('*')
        .order('name')

      if (groupsError) throw groupsError
      setCollisionGroups(groupsData || [])

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
        
        const studentsList = studentsData?.map((student: any) => ({
          id: student.id,
          name: student.full_name,
          roll_number: student.roll_number,
          department: student.department?.name || 'Unknown',
          classroom: student.classroom?.name || 'Unknown',
          collision_group_id: student.collision_group_id
        })) || []
        
        setStudents(studentsList)
      }

    } catch (error) {
      console.error('Error fetching exam data:', error)
      alert('Failed to load exam data. Please try again.')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: keyof ExamFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDepartmentToggle = (departmentId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_departments: prev.selected_departments.includes(departmentId)
        ? prev.selected_departments.filter(id => id !== departmentId)
        : [...prev.selected_departments, departmentId]
    }))
  }

  const handleCollisionGroupToggle = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_collision_groups: prev.selected_collision_groups.includes(groupId)
        ? prev.selected_collision_groups.filter(id => id !== groupId)
        : [...prev.selected_collision_groups, groupId]
    }))
  }

  const handleHallToggle = (hallId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_halls: prev.selected_halls.includes(hallId)
        ? prev.selected_halls.filter(id => id !== hallId)
        : [...prev.selected_halls, hallId]
    }))
  }

  const runAllocation = async () => {
    if (formData.selected_halls.length === 0) {
      alert('Please select at least one exam hall')
      return
    }

    if (students.length === 0) {
      alert('No students found for selected departments')
      return
    }

    try {
      setIsAllocating(true)
      console.log('🚀 Starting seat allocation...')
      console.log('Students:', students.length)
      console.log('Selected halls:', formData.selected_halls)

      const hallsForAllocation = examHalls
        .filter(hall => formData.selected_halls.includes(hall.id))
        .map(hall => ({
          id: hall.id,
          name: hall.name,
          capacity: hall.capacity,
          rows: hall.rows,
          columns: hall.columns,
          layout_type: hall.layout_type,
          seating_type: (hall.seating_type as 'single' | 'double') || 'single'
        }))

      const collisionGroupsForAllocation = collisionGroups
        .filter(group => formData.selected_collision_groups.includes(group.id))
        .map(group => ({
          id: group.id,
          name: group.name,
          departments: group.departments || []
        }))

      console.log('Halls for allocation:', hallsForAllocation)
      console.log('Collision groups:', collisionGroupsForAllocation)

      const result = await runSeatAllocation(students, hallsForAllocation, collisionGroupsForAllocation)
      console.log('✅ Allocation result:', result)
      
      setAllocationResult(result)
      setAllocationComplete(true)
      console.log('🎉 Allocation completed successfully!')
    } catch (error) {
      console.error('Error running seat allocation:', error)
      alert('Error running seat allocation. Please try again.')
    } finally {
      setIsAllocating(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      console.log('Saving exam changes...')

      if (!user) {
        alert('You must be logged in to save changes')
        return
      }

      if (profile?.role !== 'admin') {
        alert('Only admin users can edit exams')
        return
      }

      if (!formData.title || !formData.subject || !formData.exam_date || !formData.start_time || !formData.end_time) {
        alert('Please fill in all required fields')
        return
      }

      // Update exam details
      const { error: examError } = await supabase
        .from('exams')
        .update({
          title: formData.title,
          subject: formData.subject,
          description: formData.description,
          exam_date: formData.exam_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          duration_minutes: Number(formData.duration_minutes),
          max_students: formData.max_students ? Number(formData.max_students) : null,
          instructions: formData.instructions
        })
        .eq('id', id)

      if (examError) throw examError

      // Update departments
      if (formData.selected_departments.length) {
        // Delete existing departments
        await supabase.from('exam_departments').delete().eq('exam_id', id)
        
        // Insert new departments
        const { error: deptError } = await supabase.from('exam_departments').insert(
          formData.selected_departments.map((deptId) => ({ exam_id: id, department_id: deptId }))
        )
        if (deptError) throw deptError
      }

      // Update allocations if reallocated
      if (allocationResult) {
        // Delete existing allocations
        await supabase.from('exam_allocations').delete().eq('exam_id', id)
        
        // Insert new allocations
        const allocationData = []
        for (const hall of allocationResult.halls) {
          for (const seat of hall.seats) {
            if (seat.student_id) {
              allocationData.push({
                exam_id: id,
                hall_id: hall.hall_id,
                student_id: seat.student_id,
                seat_row: seat.row_number,
                seat_column: seat.column_number,
                seat_number: seat.seat_number
              })
            }
          }
        }
        if (allocationData.length > 0) {
          const { error: allocError } = await supabase.from('exam_allocations').insert(allocationData)
          if (allocError) throw allocError
          console.log('Seat allocations updated:', allocationData.length, 'allocations')
        }
      }

      alert('Exam updated successfully!')
      router.push(`/admin/exams/${id}`)
    } catch (e: any) {
      console.error('Save error', e)
      alert(`Failed to save changes: ${e.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (loading || loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading exam data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Exam</h1>
            <p className="text-gray-600">Modify exam details and reallocate seats</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Progress value={(currentStep / steps.length) * 100} className="h-2" />
              <div className="flex justify-between">
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center space-y-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step.id}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{step.title}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Exam Details</CardTitle>
                <CardDescription>Enter the basic information for the exam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Exam Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter exam title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Enter subject"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter exam description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="exam_date">Exam Date *</Label>
                    <Input
                      id="exam_date"
                      type="date"
                      value={formData.exam_date}
                      onChange={(e) => handleInputChange('exam_date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                      placeholder="120"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_students">Max Students</Label>
                    <Input
                      id="max_students"
                      type="number"
                      value={formData.max_students}
                      onChange={(e) => handleInputChange('max_students', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    placeholder="Enter exam instructions"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Departments */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Departments</CardTitle>
                <CardDescription>Choose which departments will participate in this exam</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((department) => (
                    <div
                      key={department.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        formData.selected_departments.includes(department.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleDepartmentToggle(department.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={formData.selected_departments.includes(department.id)}
                          onChange={() => handleDepartmentToggle(department.id)}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{department.name}</h3>
                          <p className="text-sm text-gray-600">
                            {department.student_count} students
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Halls & Collision Groups */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Exam Halls */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Exam Halls</CardTitle>
                  <CardDescription>Choose halls for the exam</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {examHalls.map((hall) => (
                      <div
                        key={hall.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          formData.selected_halls.includes(hall.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleHallToggle(hall.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={formData.selected_halls.includes(hall.id)}
                            onChange={() => handleHallToggle(hall.id)}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{hall.name}</h3>
                            <p className="text-sm text-gray-600">
                              {hall.building} • {hall.floor} • {hall.capacity} seats
                            </p>
                            <p className="text-xs text-gray-500">
                              {hall.rows} rows × {hall.columns} columns
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Collision Groups */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Collision Groups</CardTitle>
                  <CardDescription>Choose collision groups for seat allocation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collisionGroups.map((group) => (
                      <div
                        key={group.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          formData.selected_collision_groups.includes(group.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCollisionGroupToggle(group.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={formData.selected_collision_groups.includes(group.id)}
                            onChange={() => handleCollisionGroupToggle(group.id)}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{group.name}</h3>
                            <p className="text-sm text-gray-600">{group.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Allocation */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Seat Allocation</CardTitle>
                <CardDescription>Run seat allocation for selected students and halls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Students</div>
                    <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-900">Selected Halls</div>
                    <div className="text-2xl font-bold text-green-600">{formData.selected_halls.length}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-purple-900">Collision Groups</div>
                    <div className="text-2xl font-bold text-purple-600">{formData.selected_collision_groups.length}</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={runAllocation}
                    disabled={isAllocating || students.length === 0 || formData.selected_halls.length === 0}
                    className="flex-1"
                  >
                    {isAllocating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Allocating Seats...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Allocation
                      </>
                    )}
                  </Button>
                  
                  {allocationComplete && (
                    <Button
                      variant="outline"
                      onClick={() => setShowLayout(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Layout
                    </Button>
                  )}
                </div>

                {allocationComplete && allocationResult && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Seat allocation completed successfully! {allocationResult.allocation_summary.allocated_students} students have been allocated seats.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Save Changes</CardTitle>
                <CardDescription>Review your changes and save the exam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Exam Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Title:</strong> {formData.title}</div>
                      <div><strong>Subject:</strong> {formData.subject}</div>
                      <div><strong>Date:</strong> {formData.exam_date}</div>
                      <div><strong>Time:</strong> {formData.start_time} - {formData.end_time}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Allocation Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Students:</strong> {students.length}</div>
                      <div><strong>Halls:</strong> {formData.selected_halls.length}</div>
                      <div><strong>Departments:</strong> {formData.selected_departments.length}</div>
                      {allocationComplete && (
                        <div><strong>Allocated:</strong> {allocationResult?.allocation_summary.allocated_students || 0}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  
                  {allocationComplete && (
                    <Button
                      variant="outline"
                      onClick={() => setShowLayout(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Layout
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={currentStep === steps.length}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Layout Visualizer Modal */}
        {showLayout && allocationResult && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)' }}
          >
            <div 
              className="rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="p-6">
                <ExamLayoutVisualizer
                  layouts={generateExamLayout(allocationResult, examHalls.map(hall => ({
                    ...hall,
                    seating_type: hall.seating_type || 'single'
                  })))}        
                  onClose={() => setShowLayout(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
