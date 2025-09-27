'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, MapPin, Building2, Users } from 'lucide-react'
import { CollapsibleFilter } from '@/components/ui/collapsible-filter'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin-layout'
import { supabase } from '@/lib/supabase'

interface ExamHall {
  id: string
  name: string
  building?: string
  floor?: string
  capacity: number
  rows: number
  columns: number
  block?: string
  location?: string
  description?: string
}

export default function ExamHallsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [halls, setHalls] = useState<ExamHall[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingHall, setEditingHall] = useState<ExamHall | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    capacity: '',
    rows: '',
    columns: '',
    block: '',
    location: '',
    description: ''
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    fetchHalls()
  }, [])

  const fetchHalls = async () => {
    try {
      const { data: hallsData, error: hallsError } = await supabase
        .from('exam_halls')
        .select('*')
        .order('name', { ascending: true })

      if (hallsError) throw hallsError

      setHalls(hallsData || [])
    } catch (error) {
      console.error('Error fetching halls:', error)
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

  const handleCreateHall = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_halls')
        .insert({
          name: formData.name,
          building: formData.building,
          floor: formData.floor,
          capacity: parseInt(formData.capacity),
          rows: parseInt(formData.rows),
          columns: parseInt(formData.columns),
          block: formData.block,
          location: formData.location,
          description: formData.description,
          created_by: user?.id
        })
        .select()
        .single()

      if (error) throw error

      // Reset form data
      setFormData({
        name: '',
        building: '',
        floor: '',
        capacity: '',
        rows: '',
        columns: '',
        block: '',
        location: '',
        description: ''
      })
      setIsCreateDialogOpen(false)
      
      // Refresh data
      await fetchHalls()
    } catch (error) {
      console.error('Error creating hall:', error)
    }
  }

  const handleEditHall = async () => {
    if (!editingHall) return
    
    try {
      const { error } = await supabase
        .from('exam_halls')
        .update({
          name: formData.name,
          building: formData.building,
          floor: formData.floor,
          capacity: parseInt(formData.capacity),
          rows: parseInt(formData.rows),
          columns: parseInt(formData.columns),
          block: formData.block,
          location: formData.location,
          description: formData.description,
          updated_by: user?.id
        })
        .eq('id', editingHall.id)

      if (error) throw error

      setEditingHall(null)
      setFormData({
        name: '',
        building: '',
        floor: '',
        capacity: '',
        rows: '',
        columns: '',
        block: '',
        location: '',
        description: ''
      })
      setIsEditDialogOpen(false)
      fetchHalls()
    } catch (error) {
      console.error('Error updating hall:', error)
    }
  }

  const handleDeleteHall = async (hallId: string) => {
    try {
      const { error } = await supabase
        .from('exam_halls')
        .delete()
        .eq('id', hallId)

      if (error) throw error

      fetchHalls()
    } catch (error) {
      console.error('Error deleting hall:', error)
    }
  }

  const openEditDialog = (hall: ExamHall) => {
    setEditingHall(hall)
    setFormData({
      name: hall.name,
      building: hall.building || '',
      floor: hall.floor || '',
      capacity: hall.capacity.toString(),
      rows: hall.rows.toString(),
      columns: hall.columns.toString(),
      block: hall.block || '',
      location: hall.location || '',
      description: hall.description || ''
    })
    setIsEditDialogOpen(true)
  }

  const getFilteredHalls = () => {
    return halls.filter(hall =>
      hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hall.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hall.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }


  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Exam Halls Management
            </h1>
            <p className="text-gray-600">
              Manage exam venues and seating arrangements
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Hall
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle>Create New Exam Hall</DialogTitle>
                <DialogDescription>
                  Add a new exam hall with seating capacity and layout details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hall Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Hall A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="building">Building</Label>
                    <Input
                      id="building"
                      value={formData.building}
                      onChange={(e) => setFormData({...formData, building: e.target.value})}
                      placeholder="e.g., Main Building"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor</Label>
                    <Input
                      id="floor"
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: e.target.value})}
                      placeholder="e.g., Ground Floor"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rows">Number of Rows</Label>
                    <Input
                      id="rows"
                      type="number"
                      value={formData.rows}
                      onChange={(e) => setFormData({...formData, rows: e.target.value})}
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="columns">Number of Columns</Label>
                    <Input
                      id="columns"
                      type="number"
                      value={formData.columns}
                      onChange={(e) => setFormData({...formData, columns: e.target.value})}
                      placeholder="e.g., 8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="block">Block</Label>
                    <Input
                      id="block"
                      value={formData.block}
                      onChange={(e) => setFormData({...formData, block: e.target.value})}
                      placeholder="e.g., Block A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g., Main Campus"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Additional details about the hall"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateHall} disabled={!formData.name || !formData.capacity}>
                  Create Hall
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <CollapsibleFilter className="mb-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search Exam Halls</Label>
            <Input
              id="search"
              placeholder="Search exam halls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md rounded-lg"
            />
          </div>
        </CollapsibleFilter>

        <div className="grid gap-6">
          {getFilteredHalls().map((hall) => (
            <Card key={hall.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{hall.name}</CardTitle>
                    <CardDescription className="text-base">
                      {hall.block && hall.building && hall.floor ? `${hall.block}, ${hall.building}, ${hall.floor}` : hall.location}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {hall.rows}×{hall.columns}
                    </Badge>
                    <Link href={`/admin/halls/${hall.id}/layout`}>
                      <Button variant="outline" size="sm" className="rounded-lg">
                        Layout
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(hall)}
                      className="rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteHall(hall.id)}
                      className="rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Capacity: {hall.capacity} seats
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Layout: {hall.rows}×{hall.columns} grid
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {hall.location || 'No location specified'}
                    </span>
                  </div>
                </div>
                {hall.description && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {hall.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {getFilteredHalls().length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No exam halls found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Get started by creating your first exam hall.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hall
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle>Edit Exam Hall</DialogTitle>
              <DialogDescription>
                Update the exam hall details and seating arrangement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Hall Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Hall A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">Capacity *</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-building">Building</Label>
                  <Input
                    id="edit-building"
                    value={formData.building}
                    onChange={(e) => setFormData({...formData, building: e.target.value})}
                    placeholder="e.g., Main Building"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-floor">Floor</Label>
                  <Input
                    id="edit-floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({...formData, floor: e.target.value})}
                    placeholder="e.g., Ground Floor"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-rows">Number of Rows</Label>
                  <Input
                    id="edit-rows"
                    type="number"
                    value={formData.rows}
                    onChange={(e) => setFormData({...formData, rows: e.target.value})}
                    placeholder="e.g., 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-columns">Number of Columns</Label>
                  <Input
                    id="edit-columns"
                    type="number"
                    value={formData.columns}
                    onChange={(e) => setFormData({...formData, columns: e.target.value})}
                    placeholder="e.g., 8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-block">Block</Label>
                  <Input
                    id="edit-block"
                    value={formData.block}
                    onChange={(e) => setFormData({...formData, block: e.target.value})}
                    placeholder="e.g., Block A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Main Campus"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Additional details about the hall"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditHall} disabled={!formData.name || !formData.capacity}>
                Update Hall
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
