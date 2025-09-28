'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Edit, Trash2, Save, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Seat {
  id: string
  number: number
  row: number
  column: number
  status: 'available' | 'occupied' | 'blocked'
  student_id?: string
  student_name?: string
}

interface HallLayout {
  id: string
  name: string
  capacity: number
  layout_type: string
  seats: Seat[]
}

export default function HallLayoutPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [hall, setHall] = useState<HallLayout | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [isAddSeatDialogOpen, setIsAddSeatDialogOpen] = useState(false)
  const [newSeatData, setNewSeatData] = useState({
    row: '',
    column: '',
    status: 'available' as const
  })

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (params.id) {
      fetchHallLayout()
    }
  }, [params.id])

  const fetchHallLayout = async () => {
    try {
      // Fetch hall data
      const { data: hallData, error: hallError } = await supabase
        .from('exam_halls')
        .select('*')
        .eq('id', params.id)
        .single()

      if (hallError) throw hallError

      // Fetch seats data
      const { data: seatsData, error: seatsError } = await supabase
        .from('seats')
        .select(`
          *,
          student:profiles(full_name)
        `)
        .eq('hall_id', params.id)
        .order('row_number', { ascending: true })
        .order('column_number', { ascending: true })

      if (seatsError) throw seatsError

      const seats = seatsData?.map((seat: any) => ({
        id: seat.id,
        number: seat.seat_number,
        row: seat.row_number,
        column: seat.column_number,
        status: seat.status,
        student_id: seat.student_id,
        student_name: seat.student?.full_name
      })) || []

      setHall({
        id: hallData.id,
        name: hallData.name,
        capacity: hallData.capacity,
        layout_type: hallData.layout_type,
        seats
      })
    } catch (error) {
      console.error('Error fetching hall layout:', error)
    }
  }

  const generateSeatGrid = () => {
    if (!hall) return []

    const maxRow = Math.max(...hall.seats.map(s => s.row), 0)
    const maxCol = Math.max(...hall.seats.map(s => s.column), 0)
    
    const grid = []
    
    for (let row = 1; row <= maxRow; row++) {
      const rowSeats = []
      for (let col = 1; col <= maxCol; col++) {
        const seat = hall.seats.find(s => s.row === row && s.column === col)
        rowSeats.push(seat || null)
      }
      grid.push(rowSeats)
    }
    
    return grid
  }

  const getSeatStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300 text-green-800'
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800'
      case 'blocked': return 'bg-gray-100 border-gray-300 text-gray-800'
      default: return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const handleSeatClick = (seatId: string) => {
    if (!isEditing) return
    
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    )
  }

  const handleSeatStatusChange = (status: string) => {
    // Update selected seats status
    // This would typically involve API calls
    console.log('Updating seats:', selectedSeats, 'to status:', status)
    setSelectedSeats([])
  }

  const addNewSeat = async () => {
    try {
      const { error } = await supabase
        .from('seats')
        .insert({
          hall_id: params.id,
          row_number: parseInt(newSeatData.row),
          column_number: parseInt(newSeatData.column),
          seat_number: hall?.seats.length ? Math.max(...hall.seats.map(s => s.number)) + 1 : 1,
          status: newSeatData.status
        })

      if (error) throw error

      setNewSeatData({ row: '', column: '', status: 'available' })
      setIsAddSeatDialogOpen(false)
      fetchHallLayout()
    } catch (error) {
      console.error('Error adding seat:', error)
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

  if (!hall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Hall not found</h2>
          <Button onClick={() => router.push('/admin/halls')}>
            Back to Halls
          </Button>
        </div>
      </div>
    )
  }

  const seatGrid = generateSeatGrid()

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">
              {hall.name} Layout
            </h1>
            <p className="text-gray-600">
              {hall.capacity} seats • {hall.layout_type} • 
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-lg"
            >
              {isEditing ? 'Exit Edit' : 'Edit Layout'}
            </Button>
            <Dialog open={isAddSeatDialogOpen} onOpenChange={setIsAddSeatDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Seat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white rounded-xl">
                <DialogHeader>
                  <DialogTitle>Add New Seat</DialogTitle>
                  <DialogDescription>
                    Add a new seat to the hall layout.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="row">Row</Label>
                      <Input
                        id="row"
                        type="number"
                        value={newSeatData.row}
                        onChange={(e) => setNewSeatData({...newSeatData, row: e.target.value})}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="column">Column</Label>
                      <Input
                        id="column"
                        type="number"
                        value={newSeatData.column}
                        onChange={(e) => setNewSeatData({...newSeatData, column: e.target.value})}
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newSeatData.status} onValueChange={(value: any) => setNewSeatData({...newSeatData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddSeatDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addNewSeat} disabled={!newSeatData.row || !newSeatData.column}>
                    Add Seat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Layout Editor */}
        {isEditing && selectedSeats.length > 0 && (
          <Card className="mb-6 rounded-xl shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Selected Seats: {selectedSeats.length}</h3>
                  <p className="text-sm text-gray-600">Choose an action for selected seats</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSeatStatusChange('available')}
                  >
                    Mark Available
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSeatStatusChange('blocked')}
                  >
                    Block Seats
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSeats([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hall Layout */}
        <Card className="rounded-xl shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hall Layout</span>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>Blocked</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Teacher's Desk */}
            <div className="mb-8 text-center">
              <Button 
                variant="outline" 
                className="bg-gray-800 text-white border-gray-800 hover:bg-gray-700 px-8 py-4 rounded-lg"
                disabled
              >
                Teacher's Desk / Board
              </Button>
            </div>

            {/* Seat Grid */}
            <div className="space-y-4">
              {seatGrid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-4">
                  <div className="w-8 text-sm font-medium text-gray-600">
                    R{rowIndex + 1}
                  </div>
                  <div className="flex gap-2">
                    {row.map((seat, colIndex) => (
                      <div key={colIndex}>
                        {seat ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-12 h-8 text-xs rounded-lg ${
                              getSeatStatusColor(seat.status)
                            } ${
                              isEditing ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : 'cursor-default'
                            } ${
                              selectedSeats.includes(seat.id) ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => handleSeatClick(seat.id)}
                          >
                            {seat.number}
                          </Button>
                        ) : (
                          <div className="w-12 h-8"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Hall Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {hall.seats.filter(s => s.status === 'available').length}
                </div>
                <div className="text-sm text-green-600">Available</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {hall.seats.filter(s => s.status === 'occupied').length}
                </div>
                <div className="text-sm text-red-600">Occupied</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {hall.seats.filter(s => s.status === 'blocked').length}
                </div>
                <div className="text-sm text-gray-600">Blocked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
