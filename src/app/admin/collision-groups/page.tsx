'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, AlertTriangle, Users, BookOpen } from 'lucide-react'
import { CollapsibleFilter } from '@/components/ui/collapsible-filter'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'

interface CollisionGroup {
  id: string
  name: string
  description?: string
  departments: string[]
  department_names: string[]
  created_at: string
}

export default function CollisionGroupsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [collisionGroups, setCollisionGroups] = useState<CollisionGroup[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CollisionGroup | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departments: [] as string[]
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    fetchCollisionGroups()
    fetchDepartments()
  }, [])

  const fetchCollisionGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('collision_groups')
        .select(`
          *,
          departments:collision_group_departments(
            department:departments(name)
          )
        `)
        .order('name', { ascending: true })

      if (groupsError) throw groupsError

      const groupsWithDepartments = groupsData?.map(group => ({
        ...group,
        departments: group.departments?.map((d: any) => d.department.id) || [],
        department_names: group.departments?.map((d: any) => d.department.name) || []
      })) || []

      setCollisionGroups(groupsWithDepartments)
    } catch (error) {
      console.error('Error fetching collision groups:', error)
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

  const handleCreateGroup = async () => {
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('collision_groups')
        .insert({
          name: formData.name,
          description: formData.description,
          created_by: user?.id // Add the current user's ID
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add departments to collision group
      if (formData.departments.length > 0) {
        const departmentInserts = formData.departments.map(deptId => ({
          collision_group_id: groupData.id,
          department_id: deptId
        }))

        const { error: deptError } = await supabase
          .from('collision_group_departments')
          .insert(departmentInserts)

        if (deptError) throw deptError
      }

      // Reset form data
      setFormData({ name: '', description: '', departments: [] })
      setIsCreateDialogOpen(false)
      
      // Refresh data
      await fetchCollisionGroups()
    } catch (error) {
      console.error('Error creating collision group:', error)
    }
  }

  const handleEditGroup = async () => {
    if (!editingGroup) return

    try {
      const { error: groupError } = await supabase
        .from('collision_groups')
        .update({
          name: formData.name,
          description: formData.description,
          updated_by: user?.id // Add the current user's ID for updates
        })
        .eq('id', editingGroup.id)

      if (groupError) throw groupError

      // Update departments
      const { error: deleteError } = await supabase
        .from('collision_group_departments')
        .delete()
        .eq('collision_group_id', editingGroup.id)

      if (deleteError) throw deleteError

      if (formData.departments.length > 0) {
        const departmentInserts = formData.departments.map(deptId => ({
          collision_group_id: editingGroup.id,
          department_id: deptId
        }))

        const { error: deptError } = await supabase
          .from('collision_group_departments')
          .insert(departmentInserts)

        if (deptError) throw deptError
      }

      setEditingGroup(null)
      setFormData({ name: '', description: '', departments: [] })
      setIsEditDialogOpen(false)
      fetchCollisionGroups()
    } catch (error) {
      console.error('Error updating collision group:', error)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('collision_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      fetchCollisionGroups()
    } catch (error) {
      console.error('Error deleting collision group:', error)
    }
  }

  const openEditDialog = (group: CollisionGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
      departments: group.departments
    })
    setIsEditDialogOpen(true)
  }

  const toggleDepartment = (departmentId: string) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(departmentId)
        ? prev.departments.filter(id => id !== departmentId)
        : [...prev.departments, departmentId]
    }))
  }

  const getFilteredCollisionGroups = () => {
    return collisionGroups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
              Collision Groups Management
            </h1>
            <p className="text-gray-600">
              Manage seat allocation constraints and department groupings
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Collision Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle>Create New Collision Group</DialogTitle>
                <DialogDescription>
                  Create a collision group to manage seat allocation constraints between departments.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Engineering Core"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the collision group"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departments</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {departments.map(dept => (
                      <label key={dept.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.departments.includes(dept.id)}
                          onChange={() => toggleDepartment(dept.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={!formData.name}>
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <CollapsibleFilter className="mb-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search Collision Groups</Label>
            <Input
              id="search"
              placeholder="Search collision groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md rounded-lg"
            />
          </div>
        </CollapsibleFilter>

        {/* Collision Groups Grid */}
        <div className="grid gap-6">
          {getFilteredCollisionGroups().map((group) => (
            <Card key={group.id} className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    <CardDescription className="text-base">
                      {group.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {group.departments.length} departments
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(group)}
                      className="rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Departments in this group:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.department_names.map((deptName, index) => (
                      <Badge key={index} variant="secondary" className="rounded-lg">
                        {deptName}
                      </Badge>
                    ))}
                    {group.department_names.length === 0 && (
                      <span className="text-sm text-gray-500">No departments assigned</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {getFilteredCollisionGroups().length === 0 && (
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No collision groups found
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first collision group to manage seat allocation constraints.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Collision Group
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle>Edit Collision Group</DialogTitle>
              <DialogDescription>
                Update the collision group information and department assignments.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Engineering Core"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the collision group"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Departments</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {departments.map(dept => (
                    <label key={dept.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.departments.includes(dept.id)}
                        onChange={() => toggleDepartment(dept.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditGroup} disabled={!formData.name}>
                Update Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}