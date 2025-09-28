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
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'
import { runSeatAllocation, generateExamLayout, type Student, type ExamHall, type CollisionGroup, type AllocationResult } from '@/lib/seat-allocation'
import { ExamLayoutVisualizer } from '@/components/exam-layout-visualizer'

interface ExamFormData {
  title: string
  subject: string
  description: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: string
  selected_halls: string[] // Changed to multi-select
  max_students: string
  instructions: string
  collision_group_id: string
  selected_departments: string[]
}

interface Department {
  id: string
  name: string
  code: string
  student_count: number
}

interface ExamHall {
  id: string
  name: string
  capacity: number
  rows: number
  columns: number
  block?: string
  floor?: string
  seating_type: 'single' | 'double'
  layout_type: string
}

interface CollisionGroup {
  id: string
  name: string
  description?: string
  departments: Department[]
}

export default function CreateExamPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [departments, setDepartments] = useState<Department[]>([])
  const [examHalls, setExamHalls] = useState<ExamHall[]>([])
  const [collisionGroups, setCollisionGroups] = useState<CollisionGroup[]>([])
  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    subject: '',
    description: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: '',
    selected_halls: [], // Changed to array
    max_students: '',
    instructions: '',
    collision_group_id: '',
    selected_departments: []
  })
  const [isAllocating, setIsAllocating] = useState(false)
  const [allocationComplete, setAllocationComplete] = useState(false)
  const [allocationResult, setAllocationResult] = useState<AllocationResult | null>(null)
  const [showLayoutVisualizer, setShowLayoutVisualizer] = useState(false)
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  // Fetch real data from database
  useEffect(() => {
    fetchDepartments()
    fetchExamHalls()
    fetchCollisionGroups()
  }, [])

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          student_count:profiles(count)
        `)
        .order('name')

      if (error) throw error

      const departmentsWithCount = data?.map(dept => ({
        ...dept,
        student_count: dept.student_count?.[0]?.count || 0
      })) || []

      setDepartments(departmentsWithCount)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchExamHalls = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_halls')
        .select('*')
        .order('name')

      if (error) throw error
      setExamHalls(data || [])
    } catch (error) {
      console.error('Error fetching exam halls:', error)
    }
  }

  const fetchCollisionGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('collision_groups')
        .select(`
          *,
          departments:collision_group_departments(
            department:departments(*)
          )
        `)

      if (error) throw error

      const groupsWithDepartments = data?.map(group => ({
        ...group,
        departments: group.departments?.map((cgd: any) => cgd.department) || []
      })) || []

      setCollisionGroups(groupsWithDepartments)
    } catch (error) {
      console.error('Error fetching collision groups:', error)
    }
  }

  const fetchStudentsForDepartments = async (departmentIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(name),
          classroom:classrooms(name)
        `)
        .eq('role', 'student')
        .in('department_id', departmentIds)
        .order('roll_number')

      if (error) throw error

      const studentsWithDepartment = data?.map(student => ({
        id: student.id,
        full_name: student.full_name,
        roll_number: student.roll_number || '',
        department_id: student.department_id,
        department_name: student.department?.name || 'No Department',
        classroom_id: student.classroom_id,
        classroom_name: student.classroom?.name || 'No Classroom'
      })) || []

      setStudents(studentsWithDepartment)
      return studentsWithDepartment
    } catch (error) {
      console.error('Error fetching students:', error)
      return []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  const steps = [
    { id: 1, title: 'Basic Details', description: 'Exam information and timing' },
    { id: 2, title: 'Departments', description: 'Select participating departments' },
    { id: 3, title: 'Preview & Allocate', description: 'Review and run seat allocation' }
  ]

  const progress = (currentStep / steps.length) * 100

  const handleInputChange = (field: keyof ExamFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDepartmentToggle = (deptId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_departments: prev.selected_departments.includes(deptId)
        ? prev.selected_departments.filter(id => id !== deptId)
        : [...prev.selected_departments, deptId]
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

  const calculateTotalStudents = () => {
    return formData.selected_departments.reduce((total, deptId) => {
      const dept = departments.find(d => d.id === deptId)
      return total + (dept?.student_count || 0)
    }, 0)
  }

  const getSelectedHall = () => {
    return examHalls.find(hall => hall.id === formData.hall_id)
  }

  const getSelectedCollisionGroup = () => {
    return collisionGroups.find(group => group.id === formData.collision_group_id)
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.subject && formData.exam_date && 
               formData.start_time && formData.end_time && formData.duration_minutes && 
               formData.selected_halls.length > 0
      case 2:
        return formData.selected_departments.length > 0
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length && canProceedToNext()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRunAllocation = async () => {
    setIsAllocating(true)
    
    try {
      // Fetch students from selected departments
      const students = await fetchStudentsForDepartments(formData.selected_departments)
      
      if (students.length === 0) {
        alert('No students found in selected departments')
        setIsAllocating(false)
        return
      }

      // Convert exam halls to the format expected by the allocator
      const hallsForAllocation: ExamHall[] = formData.selected_halls.map(hallId => {
        const hall = examHalls.find(h => h.id === hallId)
        return {
          id: hall!.id,
          name: hall!.name,
          capacity: hall!.capacity,
          rows: hall!.rows,
          columns: hall!.columns,
          block: hall!.block,
          floor: hall!.floor,
          seating_type: hall!.seating_type,
          layout_type: hall!.layout_type || 'standard'
        }
      })

      // Convert collision groups to the format expected by the allocator
      const collisionGroupsForAllocation: CollisionGroup[] = collisionGroups.map(group => ({
        id: group.id,
        name: group.name,
        departments: group.departments.map((dept: any) => dept.id)
      }))

      // Run seat allocation
      const result = await runSeatAllocation(students, hallsForAllocation, collisionGroupsForAllocation)
      
      setAllocationResult(result)
      setAllocationComplete(true)
    } catch (error) {
      console.error('Error running seat allocation:', error)
      alert('Error running seat allocation. Please try again.')
    } finally {
      setIsAllocating(false)
    }
  }

  const handleSaveAsDraft = () => {
    // Save exam as draft
    console.log('Saving as draft:', formData)
    router.push('/admin/exams')
  }

  const handlePublishExam = () => {
    // Publish exam
    console.log('Publishing exam:', formData)
    router.push('/admin/exams')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Mathematics Final Exam"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="e.g., Mathematics"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the exam"
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
                <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                  placeholder="180"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_students">Max Students</Label>
                <Input
                  id="max_students"
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => handleInputChange('max_students', e.target.value)}
                  placeholder="Leave empty for no limit"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Exam Halls *</Label>
              <div className="text-sm text-gray-600 mb-3">
                Select one or more exam halls for this exam
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examHalls.map((hall) => (
                  <div key={hall.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id={`hall-${hall.id}`}
                      checked={formData.selected_halls.includes(hall.id)}
                      onCheckedChange={() => handleHallToggle(hall.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`hall-${hall.id}`} className="cursor-pointer">
                        <div className="font-medium">{hall.name}</div>
                        <div className="text-sm text-gray-600">
                          {hall.block} • {hall.floor} • {hall.capacity} seats • {hall.seating_type === 'double' ? 'Double' : 'Single'} seating
                        </div>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
              {formData.selected_halls.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    Selected Halls ({formData.selected_halls.length})
                  </div>
                  <div className="text-sm text-blue-700">
                    Total Capacity: {formData.selected_halls.reduce((total, hallId) => {
                      const hall = examHalls.find(h => h.id === hallId)
                      return total + (hall?.capacity || 0)
                    }, 0)} seats
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collision_group_id">Collision Group (Optional)</Label>
              <Select value={formData.collision_group_id} onValueChange={(value) => handleInputChange('collision_group_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select collision group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No collision group</SelectItem>
                  {collisionGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Special instructions for students"
                rows={4}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Select Departments</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose which departments will participate in this exam
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id={`dept-${dept.id}`}
                    checked={formData.selected_departments.includes(dept.id)}
                    onCheckedChange={() => handleDepartmentToggle(dept.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`dept-${dept.id}`} className="cursor-pointer">
                      <div className="font-medium">{dept.name} ({dept.code})</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {dept.student_count} students
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">Total Students</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {calculateTotalStudents()}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-200">
                {formData.selected_departments.length} departments selected
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Exam Summary</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Review the exam details and run seat allocation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Exam Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm"><strong>Date:</strong> {formData.exam_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm"><strong>Time:</strong> {formData.start_time} - {formData.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm"><strong>Halls:</strong> {formData.selected_halls.map(hallId => {
                      const hall = examHalls.find(h => h.id === hallId)
                      return hall?.name
                    }).join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm"><strong>Students:</strong> {calculateTotalStudents()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.selected_departments.map(deptId => {
                      const dept = departments.find(d => d.id === deptId)
                      return dept ? (
                        <div key={deptId} className="flex justify-between items-center">
                          <span className="text-sm">{dept.name} ({dept.code})</span>
                          <Badge variant="secondary">{dept.student_count}</Badge>
                        </div>
                      ) : null
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {getSelectedCollisionGroup() && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collision Group</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-medium">{getSelectedCollisionGroup()?.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {getSelectedCollisionGroup()?.description}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {getSelectedCollisionGroup()?.departments.map(dept => (
                        <Badge key={dept.id} variant="outline">
                          {dept.name} ({dept.code})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            <div className="text-center space-y-4">
              {!allocationComplete ? (
                <div>
                  <Button 
                    onClick={handleRunAllocation} 
                    disabled={isAllocating}
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    {isAllocating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running Allocation...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Seat Allocation
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-600">
                    This will automatically assign seats to students based on collision group constraints
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Seat allocation completed successfully!</span>
                  </div>
                  
                  {/* Allocation Summary */}
                  {allocationResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{allocationResult.allocation_summary.total_students}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">Allocated</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">{allocationResult.allocation_summary.allocated_students}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">Utilization</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(allocationResult.allocation_summary.utilization_rate)}%
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Hall Details */}
                  {allocationResult && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">Hall Allocation Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allocationResult.halls.map((hall) => (
                          <Card key={hall.hall_id}>
                            <CardHeader>
                              <CardTitle className="text-base">{hall.hall_name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Capacity:</span>
                                  <span>{hall.total_capacity}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Allocated:</span>
                                  <span className="text-green-600">{hall.allocated_students}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Utilization:</span>
                                  <span className="text-blue-600">
                                    {Math.round((hall.allocated_students / hall.total_capacity) * 100)}%
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowLayoutVisualizer(true)}
                      disabled={!allocationResult}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Layout
                    </Button>
                    <Button variant="outline" onClick={handleSaveAsDraft}>
                      <Save className="h-4 w-4 mr-2" />
                      Save as Draft
                    </Button>
                    <Button onClick={handlePublishExam}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish Exam
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Exam
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Set up a new exam with seat allocation
              </p>
            </div>
          </div>

          {/* Progress */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Step {currentStep} of {steps.length}</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between">
                  {steps.map((step) => (
                    <div key={step.id} className="text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.id <= currentStep 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {step.id}
                      </div>
                      <div className="mt-2 text-xs">
                        <div className="font-medium">{step.title}</div>
                        <div className="text-gray-500">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card>
            <CardContent className="pt-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          {currentStep < 3 && (
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!canProceedToNext()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Layout Visualizer Modal */}
      {showLayoutVisualizer && allocationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <ExamLayoutVisualizer 
                layouts={generateExamLayout(allocationResult, formData.selected_halls.map(hallId => {
                  const hall = examHalls.find(h => h.id === hallId)
                  return {
                    id: hall!.id,
                    name: hall!.name,
                    capacity: hall!.capacity,
                    rows: hall!.rows,
                    columns: hall!.columns,
                    block: hall!.block,
                    floor: hall!.floor,
                    seating_type: hall!.seating_type,
                    layout_type: hall!.layout_type || 'standard'
                  }
                }))}
                onClose={() => setShowLayoutVisualizer(false)}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
