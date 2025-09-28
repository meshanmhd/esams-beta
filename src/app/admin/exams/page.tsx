'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, Users, MapPin, Search, Filter, Eye, Edit, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { supabase } from '@/lib/supabase'

interface Exam {
  id: string
  title: string
  subject: string
  exam_date: string
  start_time: string
  end_time: string
  status: 'draft' | 'scheduled' | 'published' | 'ongoing' | 'completed' | 'cancelled'
  registrations: number
  allocations: number
  departments: string[]
  collision_group?: string
}

export default function AdminExamsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [allocationFilter, setAllocationFilter] = useState<string>('all')

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          *,
          departments:exam_departments(
            department:departments(name)
          )
        `)
        .order('exam_date', { ascending: true })

      if (examsError) throw examsError

      const examsWithDetails = examsData?.map(exam => ({
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        exam_date: exam.exam_date,
        start_time: exam.start_time,
        end_time: exam.end_time,
        status: exam.status,
        registrations: exam.registered_students || 0,
        allocations: exam.allocated_students || 0,
        departments: exam.departments?.map((d: any) => d.department.name) || [],
        collision_group: exam.collision_group
      })) || []

      setExams(examsWithDetails)
    } catch (error) {
      // Handle error silently
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

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter
    
    const matchesAllocation = allocationFilter === 'all' || 
      (allocationFilter === 'allocated' && exam.allocations > 0) ||
      (allocationFilter === 'not_allocated' && exam.allocations === 0)
    
    return matchesSearch && matchesStatus && matchesAllocation
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'scheduled': return 'default'
      case 'published': return 'default'
      case 'ongoing': return 'destructive'
      case 'completed': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusCounts = () => {
    return {
      total: exams.length,
      draft: exams.filter(e => e.status === 'draft').length,
      scheduled: exams.filter(e => e.status === 'scheduled').length,
      published: exams.filter(e => e.status === 'published').length,
      ongoing: exams.filter(e => e.status === 'ongoing').length,
      completed: exams.filter(e => e.status === 'completed').length,
      allocated: exams.filter(e => e.allocations > 0).length,
      not_allocated: exams.filter(e => e.allocations === 0).length
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Exam Management
            </h1>
            <p className="text-gray-600">
              Create and manage exam schedules with seat allocation
            </p>
          </div>
          <Link href="/admin/exams/create">
            <Button className="rounded-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({statusCounts.total})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({statusCounts.draft})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({statusCounts.scheduled})</TabsTrigger>
            <TabsTrigger value="published">Published ({statusCounts.published})</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing ({statusCounts.ongoing})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
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
                        placeholder="Search exams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allocation">Allocation</Label>
                    <Select value={allocationFilter} onValueChange={setAllocationFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All allocations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Allocations</SelectItem>
                        <SelectItem value="allocated">Allocated</SelectItem>
                        <SelectItem value="not_allocated">Not Allocated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Results</Label>
                    <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                      <span className="text-sm text-muted-foreground">
                        {filteredExams.length} exams
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exam Cards */}
            <div className="grid gap-6">
              {filteredExams.map((exam) => (
                <Card key={exam.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{exam.title}</CardTitle>
                        <CardDescription className="text-base">
                          {exam.subject} • {exam.exam_date} • {exam.start_time} - {exam.end_time}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(exam.status)}>
                          {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                        </Badge>
                        {exam.allocations > 0 && (
                          <Badge variant="outline">
                            Allocated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Hall allocation pending
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {exam.registrations} registered
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {exam.allocations} allocated
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Departments:</span> {exam.departments.join(', ')}
                      </div>
                    </div>
                    
                    {exam.collision_group && (
                      <div className="mb-4">
                        <Badge variant="secondary">
                          Collision Group: {exam.collision_group}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Link href={`/admin/exams/${exam.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/admin/exams/${exam.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/admin/exams/${exam.id}/allocations`}>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Manage Allocations
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredExams.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No exams found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {searchTerm || statusFilter !== 'all' || allocationFilter !== 'all'
                        ? 'Try adjusting your filters or search terms.'
                        : 'Get started by creating your first exam.'
                      }
                    </p>
                    <Link href="/admin/exams/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Exam
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Individual tab contents for each status */}
          {['draft', 'scheduled', 'published', 'ongoing', 'completed'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-6">
              <div className="grid gap-6">
                {exams.filter(exam => exam.status === status).map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{exam.title}</CardTitle>
                          <CardDescription className="text-base">
                            {exam.subject} • {exam.exam_date} • {exam.start_time} - {exam.end_time}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(exam.status)}>
                            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                          </Badge>
                          {exam.allocations > 0 && (
                            <Badge variant="outline">
                              Allocated
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Hall allocation pending
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {exam.registrations} registered
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {exam.allocations} allocated
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Departments:</span> {exam.departments.join(', ')}
                        </div>
                      </div>
                      
                      {exam.collision_group && (
                        <div className="mb-4">
                          <Badge variant="secondary">
                            Collision Group: {exam.collision_group}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Link href={`/admin/exams/${exam.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/admin/exams/${exam.id}/allocations`}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Manage Allocations
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {exams.filter(exam => exam.status === status).length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No {status} exams found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {status === 'draft' 
                          ? 'Create a new exam to get started.'
                          : `No exams are currently in ${status} status.`
                        }
                      </p>
                      <Link href="/admin/exams/create">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Exam
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  )
}
