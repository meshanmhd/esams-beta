'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  MapPin, 
  Building2, 
  Eye, 
  EyeOff,
  Download,
  Printer,
  Search,
  Filter
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Student {
  id: string
  name: string
  roll_number: string
  department: string
}

interface Seat {
  id: string
  row: number
  column: number
  seat_number: string
  student: Student | null
  is_occupied: boolean
  seating_type: 'single' | 'double'
  bench_position?: 'left' | 'right'
}

interface HallLayout {
  hall_id: string
  hall_name: string
  rows: number
  columns: number
  seats: Seat[]
}

interface ExamLayoutVisualizerProps {
  layouts: HallLayout[]
  onClose?: () => void
}

export function ExamLayoutVisualizer({ layouts, onClose }: ExamLayoutVisualizerProps) {
  const [selectedHall, setSelectedHall] = useState(layouts[0]?.hall_id || '')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showEmptySeats, setShowEmptySeats] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const currentLayout = layouts.find(l => l.hall_id === selectedHall)
  
  if (!currentLayout) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No exam layout data available</p>
      </div>
    )
  }

  const filteredSeats = currentLayout.seats.filter(seat => {
    const matchesSearch = !searchTerm || 
      seat.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seat.student?.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = departmentFilter === 'all' || 
      seat.student?.department === departmentFilter
    
    const matchesEmpty = showEmptySeats || seat.is_occupied
    
    return matchesSearch && matchesDepartment && matchesEmpty
  })

  const occupiedSeats = currentLayout.seats.filter(seat => seat.is_occupied)
  const emptySeats = currentLayout.seats.filter(seat => !seat.is_occupied)
  const departments = [...new Set(occupiedSeats.map(seat => seat.student?.department).filter(Boolean))]

  const renderGridView = () => {
    // Group seats by position for double seating visualization
    const seatGroups = new Map<string, Seat[]>()
    
    filteredSeats.forEach(seat => {
      const positionKey = `${seat.row}-${seat.column}`
      if (!seatGroups.has(positionKey)) {
        seatGroups.set(positionKey, [])
      }
      seatGroups.get(positionKey)!.push(seat)
    })

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          {occupiedSeats.length} of {currentLayout.seats.length} seats occupied
        </div>
        
        <div 
          className="grid gap-1 p-2 border rounded-lg bg-gray-50"
          style={{ 
            gridTemplateColumns: `repeat(${currentLayout.columns}, 1fr)`,
            maxWidth: '100%',
            overflow: 'auto'
          }}
        >
          {Array.from(seatGroups.entries()).map(([positionKey, seats]) => {
            const firstSeat = seats[0]
            const isDoubleSeating = firstSeat.seating_type === 'double'
            
            return (
              <div
                key={positionKey}
                className={`
                  ${isDoubleSeating ? 'aspect-[2/1]' : 'aspect-square'} 
                  min-w-[20px] min-h-[20px] border rounded flex items-center justify-center text-[10px]
                  transition-all duration-200 hover:scale-105
                  ${seats.some(s => s.is_occupied) 
                    ? 'bg-blue-100 border-blue-300 text-blue-900' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                  }
                `}
                title={seats.map(s => s.student ? `${s.student.name} (${s.student.roll_number})` : `Seat ${s.seat_number}`).join(', ')}
              >
                {isDoubleSeating ? (
                  <div className="flex w-full h-full gap-1">
                    {seats.map(seat => (
                      <div key={seat.id} className="flex-1 flex flex-col items-center justify-center border-r last:border-r-0">
                        <div className="font-mono text-[8px] text-gray-500">
                          {seat.seat_number}
                        </div>
                        {seat.student && (
                          <div className="text-center">
                            <div className="font-medium truncate max-w-[16px] text-[8px]">
                              {seat.student.roll_number}
                            </div>
                            <div className="text-[7px] text-gray-600 truncate max-w-[16px]">
                              {seat.student.name.split(' ')[0]}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="font-mono text-[9px] text-gray-500">
                      {firstSeat.seat_number}
                    </div>
                    {firstSeat.student && (
                      <div className="text-center">
                        <div className="font-medium truncate max-w-[18px] text-[9px]">
                          {firstSeat.student.roll_number}
                        </div>
                        <div className="text-[8px] text-gray-600 truncate max-w-[18px]">
                          {firstSeat.student.name.split(' ')[0]}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderListView = () => (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 mb-4">
        {occupiedSeats.length} of {currentLayout.seats.length} seats occupied
      </div>
      
      <div className="space-y-1">
        {filteredSeats.map((seat) => (
          <div
            key={seat.id}
            className={`
              flex items-center justify-between p-3 rounded-lg border
              ${seat.is_occupied 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className="font-mono text-sm font-medium">
                {seat.seat_number}
              </div>
              <div className="text-sm">
                Row {seat.row}, Column {seat.column}
                {seat.seating_type === 'double' && seat.bench_position && (
                  <span className="text-xs text-gray-500"> ({seat.bench_position})</span>
                )}
              </div>
            </div>
            {seat.student ? (
              <div className="text-right">
                <div className="font-medium text-sm">
                  {seat.student.name}
                </div>
                <div className="text-xs text-gray-600">
                  {seat.student.roll_number} • {seat.student.department}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Empty
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Hall Layout</h2>
          <p className="text-gray-600">Seat allocation visualization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Hall Selection */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Hall:</span>
        </div>
        <Select value={selectedHall} onValueChange={setSelectedHall}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {layouts.map((layout) => (
              <SelectItem key={layout.hall_id} value={layout.hall_id}>
                {layout.hall_name} ({layout.seats.filter(s => s.is_occupied).length}/{layout.seats.length} occupied)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept || ''}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmptySeats(!showEmptySeats)}
          >
            {showEmptySeats ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showEmptySeats ? 'Hide Empty' : 'Show Empty'}
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="mt-4">
          {renderGridView()}
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          {renderListView()}
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentLayout.seats.length}</div>
            <p className="text-xs text-gray-500">seats available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Occupied Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{occupiedSeats.length}</div>
            <p className="text-xs text-gray-500">students allocated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((occupiedSeats.length / currentLayout.seats.length) * 100)}%
            </div>
            <p className="text-xs text-gray-500">hall utilization</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
