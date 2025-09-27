'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Building2, Users, GraduationCap, Search, School } from 'lucide-react'
import { CollapsibleFilter } from '@/components/ui/collapsible-filter'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'

interface Department {
  id: string
  name: string
  code: string
  description?: string
  student_count: number
  classroom_count: number
  created_at: string
}

interface Classroom {
  id: string
  name: string
  teacher: string
  student_count: number
  department_id: string
  created_at: string
}

export default function DepartmentsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isClassroomDialogOpen, setIsClassroomDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  })
  const [classroomFormData, setClassroomFormData] = useState({
    name: '',
    teacher: ''
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    fetchDepartments()
    fetchClassrooms()
  }, [])

  const fetchDepartments = async () => {
    try {
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true })

      if (departmentsError) throw departmentsError

      // Get student count and classroom count for each department
      const departmentsWithCounts = await Promise.all(
        departmentsData?.map(async (dept) => {
          const { count: studentCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id)
            .eq('role', 'student')

          const { count: classroomCount } = await supabase
            .from('classrooms')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id)

          return {
            ...dept,
            student_count: studentCount || 0,
            classroom_count: classroomCount || 0
          }
        }) || []
      )

      setDepartments(departmentsWithCounts)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchClassrooms = async () => {
    try {
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select('*')
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
            student_count: count || 0
          }
        }) || []
      )

      setClassrooms(classroomsWithCounts)
    } catch (error) {
      console.error('Error fetching classrooms:', error)
    }
  }

  const handleCreateDepartment = async () => {
    try {
      const { error } = await supabase
        .from('departments')
        .insert({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          created_by: user?.id
        })

      if (error) throw error

      // Reset form data
      setFormData({ name: '', code: '', description: '' })
      setIsCreateDialogOpen(false)
      
      // Refresh data
      await fetchDepartments()
    } catch (error) {
      console.error('Error creating department:', error)
    }
  }

  const handleEditDepartment = async () => {
    if (!editingDepartment) return

    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          updated_by: user?.id
        })
        .eq('id', editingDepartment.id)

      if (error) throw error

      setEditingDepartment(null)
      setFormData({ name: '', code: '', description: '' })
      setIsEditDialogOpen(false)
      fetchDepartments()
    } catch (error) {
      console.error('Error updating department:', error)
    }
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId)

      if (error) throw error

      await fetchDepartments()
    } catch (error) {
      console.error('Error deleting department:', error)
    }
  }

  const handleCreateClassroom = async () => {
    if (!selectedDepartment) return

    try {
      const { error } = await supabase
        .from('classrooms')
        .insert({
          name: classroomFormData.name,
          teacher: classroomFormData.teacher,
          department_id: selectedDepartment.id,
          created_by: user?.id
        })

      if (error) throw error

      // Reset form data
      setClassroomFormData({ name: '', teacher: '' })
      setIsClassroomDialogOpen(false)
      setSelectedDepartment(null)
      
      // Refresh data
      await fetchClassrooms()
      await fetchDepartments()
    } catch (error) {
      console.error('Error creating classroom:', error)
    }
  }

  const openClassroomDialog = (department: Department) => {
    setSelectedDepartment(department)
    setIsClassroomDialogOpen(true)
  }

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || ''
    })
    setIsEditDialogOpen(true)
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              Departments Management
            </h1>
            <p className="text-gray-600">
              Manage academic departments and their information
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
                <DialogDescription>
                  Add a new academic department to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Department Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      placeholder="e.g., CS"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the department"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700">
                  Cancel
                </Button>
                <Button onClick={handleCreateDepartment} disabled={!formData.name || !formData.code}>
                  Create Department
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <CollapsibleFilter className="mb-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search Departments</Label>
            <Input
              id="search"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md rounded-lg"
            />
          </div>
        </CollapsibleFilter>

        {/* Departments Grid */}
        <div className="grid gap-6">
          {filteredDepartments.map((department) => (
            <Card key={department.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{department.name}</CardTitle>
                    <CardDescription className="text-base">
                      {department.code} • {department.head_of_department || 'No HOD assigned'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {department.student_count} students
                    </Badge>
                    <Badge variant="secondary">
                      {department.classroom_count} classrooms
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openClassroomDialog(department)}
                      className="rounded-lg"
                    >
                      <School className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(department)}
                      className="rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDepartment(department.id)}
                      className="rounded-lg bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {department.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {department.student_count} students
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Code: {department.code}
                    </span>
                  </div>
                </div>
                {department.description && (
                  <p className="mt-3 text-sm text-gray-600">
                    {department.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDepartments.length === 0 && (
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No departments found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first department.'}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>
                Update the department information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Department Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Department Code *</Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="e.g., CS"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the department"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700">
                Cancel
              </Button>
              <Button onClick={handleEditDepartment} disabled={!formData.name || !formData.code}>
                Update Department
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Classroom Dialog */}
        <Dialog open={isClassroomDialogOpen} onOpenChange={setIsClassroomDialogOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle>Add Classroom to {selectedDepartment?.name}</DialogTitle>
              <DialogDescription>
                Create a new classroom for this department.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="classroom-name">Classroom Name *</Label>
                <Input
                  id="classroom-name"
                  value={classroomFormData.name}
                  onChange={(e) => setClassroomFormData({...classroomFormData, name: e.target.value})}
                  placeholder="e.g., CS-A, CS-B"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Teacher Name *</Label>
                <Input
                  id="teacher"
                  value={classroomFormData.teacher}
                  onChange={(e) => setClassroomFormData({...classroomFormData, teacher: e.target.value})}
                  placeholder="e.g., Dr. John Smith"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsClassroomDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClassroom} disabled={!classroomFormData.name || !classroomFormData.teacher}>
                Add Classroom
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}