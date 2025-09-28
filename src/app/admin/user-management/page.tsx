'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Filter, Eye, Edit, Trash2, GraduationCap, Mail, Phone, MapPin, Plus } from 'lucide-react'
import { CollapsibleFilter } from '@/components/ui/collapsible-filter'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'
import { generateUUID } from '@/lib/uuid'
import { useStudents, useDepartments, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useDataFetching'

interface Student {
  id: string
  full_name: string
  email: string
  phone?: string
  student_id?: string
  roll_number?: string
  department_id?: string
  department_name: string
  classroom_id?: string
  classroom_name?: string
  created_at: string
}

export default function StudentsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
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

  // Use the new data fetching hooks
  const { data: students = [], isLoading: studentsLoading, error: studentsError } = useStudents()
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments()
  const createStudentMutation = useCreateStudent()
  const updateStudentMutation = useUpdateStudent()
  const deleteStudentMutation = useDeleteStudent()

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])


  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.student_id && student.student_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (student.roll_number && student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDepartment = departmentFilter === 'all' || student.department_id === departmentFilter
    
    return matchesSearch && matchesDepartment
  })

  const getStatusCounts = () => {
    return {
      total: students.length,
      withStudentId: students.filter(s => s.student_id).length,
      withoutStudentId: students.filter(s => !s.student_id).length,
      byDepartment: students.reduce((acc, student) => {
        const dept = student.department_name || 'No Department'
        acc[dept] = (acc[dept] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  const handleCreateStudent = async () => {
    try {
      // Validate required fields
      if (!createFormData.full_name || !createFormData.email || !createFormData.roll_number || !createFormData.department_id || !createFormData.password) {
        alert('Please fill in all required fields')
        return
      }

      // Hash the password
      const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
        password: createFormData.password
      })

      if (hashError) {
        console.error('Password hashing error:', hashError)
        alert('Error processing password. Please try again.')
        return
      }

      // Use the mutation to create student
      await createStudentMutation.mutateAsync({
        id: generateUUID(), // Generate UUID for student profile
        full_name: createFormData.full_name,
        email: createFormData.email,
        phone: createFormData.phone,
        student_id: generateUUID(), // Auto-generate student ID
        roll_number: createFormData.roll_number,
        department_id: createFormData.department_id,
        classroom_id: createFormData.classroom_id || null,
        password_hash: hashedPassword,
        role: 'student',
        is_active: true,
        created_by: profile?.id || null // Add created_by field
      })

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
      alert('Student created successfully!')
    } catch (error: any) {
      console.error('Error creating student:', error)
      alert(`Error creating student: ${error.message || 'Unknown error occurred'}`)
    }
  }

  const statusCounts = getStatusCounts()

  if (loading || studentsLoading || departmentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    )
  }

  if (studentsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Students</h2>
          <p className="text-gray-600">{studentsError.message}</p>
        </div>
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
              User Management
            </h1>
            <p className="text-gray-600">
              View and manage student profiles and information
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle>Create New Student</DialogTitle>
                <DialogDescription>
                  Add a new student to the system. They will receive login credentials via email.
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
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                      placeholder="Enter email address"
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
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roll_number">Roll Number *</Label>
                    <Input
                      id="roll_number"
                      value={createFormData.roll_number}
                      onChange={(e) => setCreateFormData({...createFormData, roll_number: e.target.value})}
                      placeholder="Enter roll number"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select value={createFormData.department_id} onValueChange={(value) => setCreateFormData({...createFormData, department_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classroom">Classroom</Label>
                    <Input
                      id="classroom"
                      value={createFormData.classroom_id}
                      onChange={(e) => setCreateFormData({...createFormData, classroom_id: e.target.value})}
                      placeholder="Enter classroom (optional)"
                    />
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateStudent} 
                  disabled={!createFormData.full_name || !createFormData.email || !createFormData.roll_number || !createFormData.password || createStudentMutation.isPending}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <CollapsibleFilter className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleFilter>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({statusCounts.total})</TabsTrigger>
            <TabsTrigger value="with-id">With Student ID ({statusCounts.withStudentId})</TabsTrigger>
            <TabsTrigger value="without-id">Without Student ID ({statusCounts.withoutStudentId})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">

            {/* Students Grid */}
            <div className="grid gap-6">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600">
                              {student.full_name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-black truncate">{student.full_name}</h3>
                            <p className="text-sm text-gray-600">
                              {student.student_id || student.roll_number || 'No ID'} • {student.department_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-48">{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant={student.student_id ? 'default' : 'secondary'} className="text-xs">
                          {student.student_id ? 'Registered' : 'Pending'}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredStudents.length === 0 && (
              <Card className="rounded-xl shadow-sm border border-gray-200">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-black mb-2">
                      No students found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || departmentFilter !== 'all'
                        ? 'Try adjusting your filters or search terms.'
                        : 'No students are registered in the system.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="with-id" className="space-y-6">
            <div className="grid gap-6">
              {students.filter(s => s.student_id).map((student) => (
                <Card key={student.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{student.full_name}</CardTitle>
                        <CardDescription className="text-base">
                          {student.student_id || student.roll_number || 'No ID'} • {student.department_name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Has Student ID</Badge>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.classroom_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="without-id" className="space-y-6">
            <div className="grid gap-6">
              {students.filter(s => !s.student_id).map((student) => (
                <Card key={student.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{student.full_name}</CardTitle>
                        <CardDescription className="text-base">
                          {student.student_id || student.roll_number || 'No ID'} • {student.department_name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">No Student ID</Badge>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.classroom_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  )
}