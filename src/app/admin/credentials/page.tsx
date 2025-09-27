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
import { Search, Download, UserCheck, Mail, Phone, Building2, GraduationCap, Eye, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'

interface StudentCredential {
  id: string
  full_name: string
  email: string
  phone?: string
  student_id: string
  department_name: string
  year: number
  semester: number
  is_active: boolean
  created_at: string
}

export default function CredentialsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<StudentCredential[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(name)
        `)
        .eq('role', 'student')
        .order('full_name', { ascending: true })

      if (studentsError) throw studentsError

      const studentsWithDepartment = studentsData?.map(student => ({
        ...student,
        department_name: student.department?.name || 'No Department'
      })) || []

      setStudents(studentsWithDepartment)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = departmentFilter === 'all' || student.department_id === departmentFilter
    const matchesYear = yearFilter === 'all' || student.year.toString() === yearFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && student.is_active) ||
      (statusFilter === 'inactive' && !student.is_active)
    
    return matchesSearch && matchesDepartment && matchesYear && matchesStatus
  })

  const getStatusCounts = () => {
    return {
      total: students.length,
      active: students.filter(s => s.is_active).length,
      inactive: students.filter(s => !s.is_active).length,
      byYear: {
        1: students.filter(s => s.year === 1).length,
        2: students.filter(s => s.year === 2).length,
        3: students.filter(s => s.year === 3).length,
        4: students.filter(s => s.year === 4).length
      }
    }
  }

  const statusCounts = getStatusCounts()

  const generateCredentials = async () => {
    try {
      // This would typically generate PDF credentials
      console.log('Generating credentials for students:', filteredStudents)
      // Implementation would involve PDF generation
    } catch (error) {
      console.error('Error generating credentials:', error)
    }
  }

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
              Student Credentials
            </h1>
            <p className="text-gray-600">
              Manage and generate student credentials and certificates
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-lg">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={generateCredentials} className="rounded-lg">
              <UserCheck className="h-4 w-4 mr-2" />
              Generate Credentials
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({statusCounts.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({statusCounts.inactive})</TabsTrigger>
            <TabsTrigger value="by-year">By Year</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <Card className="rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
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
                        className="pl-8 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="All years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Results</Label>
                    <div className="flex items-center h-10 px-3 py-2 border rounded-lg bg-muted">
                      <span className="text-sm text-muted-foreground">
                        {filteredStudents.length} students
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students Grid */}
            <div className="grid gap-6">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{student.full_name}</CardTitle>
                        <CardDescription className="text-base">
                          {student.student_id} • {student.department_name} • Year {student.year}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={student.is_active ? 'default' : 'secondary'}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{student.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.department_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Year {student.year}, Sem {student.semester}</span>
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
                    <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-black mb-2">
                      No students found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || yearFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your filters or search terms.'
                        : 'No students are registered in the system.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <div className="grid gap-6">
              {students.filter(s => s.is_active).map((student) => (
                <Card key={student.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{student.full_name}</CardTitle>
                        <CardDescription className="text-base">
                          {student.student_id} • {student.department_name} • Year {student.year}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Active</Badge>
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
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.department_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Year {student.year}, Sem {student.semester}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inactive" className="space-y-6">
            <div className="grid gap-6">
              {students.filter(s => !s.is_active).map((student) => (
                <Card key={student.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{student.full_name}</CardTitle>
                        <CardDescription className="text-base">
                          {student.student_id} • {student.department_name} • Year {student.year}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Inactive</Badge>
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
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.department_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Year {student.year}, Sem {student.semester}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="by-year" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(year => (
                <Card key={year} className="rounded-xl shadow-sm border border-gray-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-black">{statusCounts.byYear[year as keyof typeof statusCounts.byYear]}</div>
                      <div className="text-sm text-gray-600">Year {year} Students</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-6">
              {students.map((student) => (
                <Card key={student.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{student.full_name}</CardTitle>
                        <CardDescription className="text-base">
                          {student.student_id} • {student.department_name} • Year {student.year}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={student.is_active ? 'default' : 'secondary'}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">Year {student.year}</Badge>
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
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{student.department_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Year {student.year}, Sem {student.semester}</span>
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
