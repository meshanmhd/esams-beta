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
import { Search, Filter, Eye, Shield, User, Clock, MapPin, Monitor } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'

interface LoginAttempt {
  id: string
  email: string
  user_id?: string
  user_name?: string
  success: boolean
  ip_address: string
  user_agent: string
  location?: string
  created_at: string
  failure_reason?: string
}

export default function LoginAttemptsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    fetchLoginAttempts()
  }, [])

  const fetchLoginAttempts = async () => {
    try {
      // This would typically fetch from a login_attempts table
      // For now, we'll use mock data
      const mockAttempts: LoginAttempt[] = [
        {
          id: '1',
          email: 'john.doe@example.com',
          user_id: 'user1',
          user_name: 'John Doe',
          success: true,
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'New York, US',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          user_id: 'user2',
          user_name: 'Jane Smith',
          success: false,
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          location: 'California, US',
          created_at: '2024-01-15T09:15:00Z',
          failure_reason: 'Invalid password'
        },
        {
          id: '3',
          email: 'admin@esams.com',
          user_id: 'admin1',
          user_name: 'Admin User',
          success: true,
          ip_address: '192.168.1.102',
          user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          location: 'Texas, US',
          created_at: '2024-01-15T08:45:00Z'
        },
        {
          id: '4',
          email: 'unknown@example.com',
          success: false,
          ip_address: '192.168.1.103',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'Florida, US',
          created_at: '2024-01-15T07:20:00Z',
          failure_reason: 'User not found'
        }
      ]

      setLoginAttempts(mockAttempts)
    } catch (error) {
      console.error('Error fetching login attempts:', error)
    }
  }

  const filteredAttempts = loginAttempts.filter(attempt => {
    const matchesSearch = attempt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (attempt.user_name && attempt.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         attempt.ip_address.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'success' && attempt.success) ||
      (statusFilter === 'failed' && !attempt.success)
    
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'today' && new Date(attempt.created_at).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'week' && new Date(attempt.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusCounts = () => {
    return {
      total: loginAttempts.length,
      successful: loginAttempts.filter(a => a.success).length,
      failed: loginAttempts.filter(a => !a.success).length,
      today: loginAttempts.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length,
      thisWeek: loginAttempts.filter(a => new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    }
  }

  const statusCounts = getStatusCounts()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (success: boolean) => {
    return success ? 'default' : 'destructive'
  }

  const getStatusText = (success: boolean) => {
    return success ? 'Success' : 'Failed'
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
              Login Attempts
            </h1>
            <p className="text-gray-600">
              Monitor and analyze user login attempts and security events
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{statusCounts.total}</div>
                <div className="text-sm text-gray-600">Total Attempts</div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statusCounts.successful}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statusCounts.today}</div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({statusCounts.total})</TabsTrigger>
            <TabsTrigger value="successful">Successful ({statusCounts.successful})</TabsTrigger>
            <TabsTrigger value="failed">Failed ({statusCounts.failed})</TabsTrigger>
            <TabsTrigger value="today">Today ({statusCounts.today})</TabsTrigger>
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
                        placeholder="Search attempts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="success">Successful</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date Range</Label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="All dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Results</Label>
                    <div className="flex items-center h-10 px-3 py-2 border rounded-lg bg-muted">
                      <span className="text-sm text-muted-foreground">
                        {filteredAttempts.length} attempts
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Login Attempts Grid */}
            <div className="grid gap-6">
              {filteredAttempts.map((attempt) => (
                <Card key={attempt.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{attempt.email}</CardTitle>
                        <CardDescription className="text-base">
                          {attempt.user_name || 'Unknown User'} • {formatDate(attempt.created_at)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(attempt.success)}>
                          {getStatusText(attempt.success)}
                        </Badge>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{attempt.ip_address}</span>
                      </div>
                      {attempt.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{attempt.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{formatDate(attempt.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {attempt.success ? 'Secure' : 'Security Alert'}
                        </span>
                      </div>
                    </div>
                    {!attempt.success && attempt.failure_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">
                          <strong>Failure Reason:</strong> {attempt.failure_reason}
                        </p>
                      </div>
                    )}
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 break-all">
                        <strong>User Agent:</strong> {attempt.user_agent}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAttempts.length === 0 && (
              <Card className="rounded-xl shadow-sm border border-gray-200">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-black mb-2">
                      No login attempts found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                        ? 'Try adjusting your filters or search terms.'
                        : 'No login attempts have been recorded.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Individual tab contents for each category */}
          {['successful', 'failed', 'today'].map((category) => (
            <TabsContent key={category} value={category} className="space-y-6">
              <div className="grid gap-6">
                {loginAttempts.filter(attempt => {
                  switch (category) {
                    case 'successful': return attempt.success
                    case 'failed': return !attempt.success
                    case 'today': return new Date(attempt.created_at).toDateString() === new Date().toDateString()
                    default: return true
                  }
                }).map((attempt) => (
                  <Card key={attempt.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{attempt.email}</CardTitle>
                          <CardDescription className="text-base">
                            {attempt.user_name || 'Unknown User'} • {formatDate(attempt.created_at)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(attempt.success)}>
                            {getStatusText(attempt.success)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{attempt.ip_address}</span>
                        </div>
                        {attempt.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{attempt.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{formatDate(attempt.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {attempt.success ? 'Secure' : 'Security Alert'}
                          </span>
                        </div>
                      </div>
                      {!attempt.success && attempt.failure_reason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">
                            <strong>Failure Reason:</strong> {attempt.failure_reason}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  )
}
