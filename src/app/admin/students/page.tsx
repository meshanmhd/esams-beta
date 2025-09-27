'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Filter, Eye, Edit, Trash2, GraduationCap, Mail, Phone, MapPin, Plus, School, Users } from 'lucide-react'
import { CollapsibleFilter } from '@/components/ui/collapsible-filter'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'
import { useStudents, useDepartments, useCreateStudent } from '@/hooks/useDataFetching'

interface Student {
  id: string
  full_name: string
  email: string
  phone?: string
  student_id: string
  roll_number?: string
  department_id?: string
  classroom_id?: string
  department_name: string
  classroom_name: string
  created_at: string
}

interface Classroom {
  id: string
  name: string
  teacher: string
  student_count: number
  department_id: string
  department_name: string
}

interface Department {
  id: string
  name: string
  code: string
}

export default function StudentsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    roll_number: '',
    department_id: '',
    classroom_id: '',
    password: ''
  })

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    fetchStudents()
    fetchClassrooms()
    fetchDepartments()
  }, [])

  // Debug effect to log when data changes
  useEffect(() => {
    console.log('Departments loaded:', departments)
    console.log('Classrooms loaded:', classrooms)
  }, [departments, classrooms])

  const fetchStudents = async () => {
    try {
      // First get students without relationships
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true })

      if (studentsError) throw studentsError

      // Then fetch departments and classrooms separately
      const studentsWithDepartment = await Promise.all(
        studentsData?.map(async (student) => {
          let departmentName = 'No Department'
          let classroomName = 'No Classroom'

          if (student.department_id) {
            const { data: department } = await supabase
              .from('departments')
              .select('name')
              .eq('id', student.department_id)
              .single()
            if (department) departmentName = department.name
          }

          if (student.classroom_id) {
            const { data: classroom } = await supabase
              .from('classrooms')
              .select('name')
              .eq('id', student.classroom_id)
              .single()
            if (classroom) classroomName = classroom.name
          }

          return {
            ...student,
            department_name: departmentName,
            classroom_name: classroomName
          }
        }) || []
      )

      setStudents(studentsWithDepartment)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchClassrooms = async () => {
    try {
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select(`
          *,
          department:departments(name)
        `)
        .order('name', { ascending: true })

      if (classroomsError) throw classroomsError

      // Get student count for each classroom
      const classroomsWithCounts = await Promise.all(
        classroomsData?.map(async (classroom) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('classroom_id', classroom.id)
            .eq('role', 'student')

          return {
            ...classroom,
            student_count: count || 0,
            department_name: classroom.department?.name || 'No Department'
          }
        }) || []
      )

      setClassrooms(classroomsWithCounts)
    } catch (error) {
      console.error('Error fetching classrooms:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true })

      if (departmentsError) throw departmentsError
      setDepartments(departmentsData || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleCreateStudent = async () => {
    try {
      console.log('Starting student creation with data:', createFormData)
      
      // Validate required fields
      if (!createFormData.full_name || !createFormData.email || !createFormData.roll_number || !createFormData.password) {
        console.error('Please fill in all required fields')
        alert('Please fill in all required fields')
        return
      }

      // Validate UUIDs are not empty strings and are valid UUIDs
      if (!createFormData.department_id || createFormData.department_id === '' || createFormData.department_id === 'all') {
        console.error('Please select a department')
        alert('Please select a department')
        return
      }
      if (!createFormData.classroom_id || createFormData.classroom_id === '' || createFormData.classroom_id === 'all') {
        console.error('Please select a classroom')
        alert('Please select a classroom')
        return
      }

      // Additional UUID validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(createFormData.department_id)) {
        console.error('Invalid department ID format')
        alert('Invalid department ID format')
        return
      }
      if (!uuidRegex.test(createFormData.classroom_id)) {
        console.error('Invalid classroom ID format')
        alert('Invalid classroom ID format')
        return
      }

      console.log('Validating password hash...')
      
      // Simple password hash (client-side for now)
      const hashedPassword = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(createFormData.password))
      const hashedPasswordHex = Array.from(new Uint8Array(hashedPassword))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      console.log('Password hashed successfully, creating student...')
      console.log('Department ID:', createFormData.department_id)
      console.log('Classroom ID:', createFormData.classroom_id)
      
      // Generate student ID (simple format)
      const studentId = 'STU-' + Math.random().toString(36).substr(2, 5).toUpperCase()
      
      // Create student directly in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          full_name: createFormData.full_name,
          email: createFormData.email,
          phone: createFormData.phone || null,
          student_id: studentId,
          roll_number: createFormData.roll_number,
          department_id: createFormData.department_id,
          classroom_id: createFormData.classroom_id,
          password_hash: hashedPasswordHex,
          role: 'student',
          is_active: true,
          auth_user_id: null,
          created_by: null,
          updated_by: null
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating student:', profileError)
        alert('Error creating student: ' + profileError.message)
        throw profileError
      }

      if (!profileData) {
        const errorMsg = 'Failed to create student profile - no data returned'
        console.error(errorMsg)
        alert(errorMsg)
        throw new Error(errorMsg)
      }

      console.log('Student created successfully:', profileData)
      alert('Student created successfully! Student ID: ' + profileData.student_id)

      // Reset form and close dialog
      setCreateFormData({
        full_name: '',
        email: '',
        phone: '',
        roll_number: '',
        department_id: '',
        classroom_id: '',
        password: ''
      })
      setIsCreateDialogOpen(false)
      
      // Refresh data
      await fetchStudents()
    } catch (error) {
      console.error('Error creating student:', error)
      alert('Error creating student: ' + (error as Error).message)
    }
  }

  const getFilteredStudents = () => {
    return students.filter(student => {
      const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesClassroom = selectedClassroom === 'all' || student.classroom_id === selectedClassroom
      const matchesDepartment = selectedDepartment === 'all' || student.department_id === selectedDepartment
      
      return matchesSearch && matchesClassroom && matchesDepartment
    })
  }

  const getFilteredClassrooms = () => {
    return classrooms.filter(classroom => {
      const matchesDepartment = selectedDepartment === 'all' || classroom.department_id === selectedDepartment
      return matchesDepartment
    })
  }

  const getStatusCounts = () => {
    const filteredStudents = getFilteredStudents()
    return {
      total: filteredStudents.length,
      byClassroom: classrooms.reduce((acc, classroom) => {
        acc[classroom.id] = students.filter(s => s.classroom_id === classroom.id).length
        return acc
      }, {} as Record<string, number>)
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Students by Classroom
            </h1>
            <p className="text-gray-600">
              View and manage students organized by classroom and department
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a new student profile and assign them to a classroom.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={createFormData.full_name}
                      onChange={(e) => setCreateFormData({...createFormData, full_name: e.target.value})}
                      placeholder="e.g., John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                      placeholder="e.g., john.doe@university.edu"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData({...createFormData, phone: e.target.value})}
                      placeholder="e.g., +1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roll_number">Roll Number *</Label>
                    <Input
                      id="roll_number"
                      value={createFormData.roll_number}
                      onChange={(e) => setCreateFormData({...createFormData, roll_number: e.target.value})}
                      placeholder="e.g., CS001"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select 
                      value={createFormData.department_id} 
                      onValueChange={(value) => {
                        console.log('Department selected:', value)
                        setCreateFormData({...createFormData, department_id: value, classroom_id: ''})
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classroom">Classroom *</Label>
                    <Select 
                      value={createFormData.classroom_id} 
                      onValueChange={(value) => {
                        console.log('Classroom selected:', value)
                        setCreateFormData({...createFormData, classroom_id: value})
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select classroom" />
                      </SelectTrigger>
                      <SelectContent>
                        {classrooms
                          .filter(classroom => classroom.department_id === createFormData.department_id)
                          .map(classroom => (
                            <SelectItem key={classroom.id} value={classroom.id}>{classroom.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                    placeholder="Enter student password"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateStudent} 
                  disabled={
                    !createFormData.full_name || 
                    !createFormData.email || 
                    !createFormData.roll_number || 
                    !createFormData.department_id || 
                    !createFormData.classroom_id || 
                    !createFormData.password ||
                    createFormData.department_id === '' ||
                    createFormData.classroom_id === '' ||
                    createFormData.department_id === 'all' ||
                    createFormData.classroom_id === 'all'
                  }
                >
                  Add Student
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <CollapsibleFilter className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classroom">Classroom</Label>
              <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                <SelectTrigger>
                  <SelectValue placeholder="All classrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classrooms</SelectItem>
                  {getFilteredClassrooms().map(classroom => (
                    <SelectItem key={classroom.id} value={classroom.id}>{classroom.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Results</Label>
              <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm text-muted-foreground">
                  {statusCounts.total} students
                </span>
              </div>
            </div>
          </div>
        </CollapsibleFilter>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Classrooms Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  Classrooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getFilteredClassrooms().map((classroom) => (
                    <div
                      key={classroom.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedClassroom === classroom.id
                          ? 'bg-black text-white border-black'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => setSelectedClassroom(classroom.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{classroom.name}</p>
                          <p className="text-sm opacity-70">{classroom.department_name}</p>
                        </div>
                        <Badge variant={selectedClassroom === classroom.id ? "secondary" : "outline"}>
                          {classroom.student_count}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-60 mt-1">Teacher: {classroom.teacher}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          <div className="lg:col-span-3">
            <div className="grid gap-4">
              {getFilteredStudents().map((student) => (
                <Card key={student.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{student.full_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {student.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <School className="h-3 w-3" />
                            {student.classroom_name}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Student ID: {student.student_id} | Roll: {student.roll_number}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {student.department_name}
                        </Badge>
                        <Badge variant="secondary">
                          {student.student_id}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {getFilteredStudents().length === 0 && (
              <Card className="rounded-xl shadow-sm border border-gray-200">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-black mb-2">
                      No students found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || selectedClassroom !== 'all' || selectedDepartment !== 'all'
                        ? 'Try adjusting your filters or search terms.'
                        : 'No students are currently registered.'
                      }
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}