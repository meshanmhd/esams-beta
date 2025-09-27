// Seat allocation algorithm for exam halls
// Implements collision group constraints and optimal seat distribution

export interface Student {
  id: string
  full_name: string
  roll_number: string
  department_id: string
  department_name: string
  classroom_id?: string
  classroom_name?: string
}

export interface ExamHall {
  id: string
  name: string
  building?: string
  floor?: string
  capacity: number
  rows: number
  columns: number
  layout_type: string
}

export interface Seat {
  id: string
  row_number: number
  column_number: number
  seat_number: string
  student_id?: string
  student?: Student
  is_occupied: boolean
}

export interface CollisionGroup {
  id: string
  name: string
  departments: string[] // department IDs that should not be adjacent
}

export interface AllocationResult {
  halls: {
    hall_id: string
    hall_name: string
    seats: Seat[]
    total_capacity: number
    allocated_students: number
  }[]
  unallocated_students: Student[]
  allocation_summary: {
    total_students: number
    total_capacity: number
    allocated_students: number
    unallocated_students: number
    utilization_rate: number
  }
}

export class SeatAllocator {
  private students: Student[]
  private halls: ExamHall[]
  private collisionGroups: CollisionGroup[]
  private allocatedSeats: Map<string, Seat> = new Map()

  constructor(students: Student[], halls: ExamHall[], collisionGroups: CollisionGroup[] = []) {
    this.students = students
    this.halls = halls
    this.collisionGroups = collisionGroups
  }

  /**
   * Main allocation algorithm
   * Implements collision group constraints and optimal distribution
   */
  public allocateSeats(): AllocationResult {
    // Sort students by department for better grouping
    const sortedStudents = this.sortStudentsByDepartment()
    
    // Initialize seats for all halls
    const hallSeats = this.initializeSeats()
    
    // Allocate students to seats
    const allocationResult = this.allocateStudentsToSeats(sortedStudents, hallSeats)
    
    return allocationResult
  }

  /**
   * Sort students by department to group them together
   */
  private sortStudentsByDepartment(): Student[] {
    return [...this.students].sort((a, b) => {
      // First sort by department
      if (a.department_id !== b.department_id) {
        return a.department_id.localeCompare(b.department_id)
      }
      // Then by classroom within department
      if (a.classroom_id && b.classroom_id && a.classroom_id !== b.classroom_id) {
        return a.classroom_id.localeCompare(b.classroom_id)
      }
      // Finally by roll number
      return a.roll_number.localeCompare(b.roll_number)
    })
  }

  /**
   * Initialize seat grid for all halls
   */
  private initializeSeats(): Map<string, Seat[]> {
    const hallSeats = new Map<string, Seat[]>()
    
    this.halls.forEach(hall => {
      const seats: Seat[] = []
      let seatNumber = 1
      
      for (let row = 1; row <= hall.rows; row++) {
        for (let col = 1; col <= hall.columns; col++) {
          seats.push({
            id: `${hall.id}-${row}-${col}`,
            row_number: row,
            column_number: col,
            seat_number: seatNumber.toString().padStart(3, '0'),
            is_occupied: false
          })
          seatNumber++
        }
      }
      
      hallSeats.set(hall.id, seats)
    })
    
    return hallSeats
  }

  /**
   * Allocate students to seats with collision group constraints
   */
  private allocateStudentsToSeats(students: Student[], hallSeats: Map<string, Seat[]>): AllocationResult {
    const result: AllocationResult = {
      halls: [],
      unallocated_students: [],
      allocation_summary: {
        total_students: students.length,
        total_capacity: 0,
        allocated_students: 0,
        unallocated_students: 0,
        utilization_rate: 0
      }
    }

    // Calculate total capacity
    this.halls.forEach(hall => {
      result.allocation_summary.total_capacity += hall.capacity
    })

    // Process each hall
    this.halls.forEach(hall => {
      const seats = hallSeats.get(hall.id) || []
      const hallResult = {
        hall_id: hall.id,
        hall_name: hall.name,
        seats: [...seats],
        total_capacity: hall.capacity,
        allocated_students: 0
      }

      // Allocate students to this hall
      let studentIndex = 0
      const remainingStudents = students.slice(studentIndex)
      
      for (const seat of seats) {
        if (studentIndex >= students.length) break
        
        const student = students[studentIndex]
        
        // Check if this seat allocation violates collision group constraints
        if (this.isValidSeatAllocation(student, seat, hallResult.seats)) {
          seat.student_id = student.id
          seat.student = student
          seat.is_occupied = true
          hallResult.allocated_students++
          studentIndex++
        }
      }

      result.halls.push(hallResult)
    })

    // Add unallocated students
    result.unallocated_students = students.slice(studentIndex)
    result.allocation_summary.allocated_students = students.length - result.unallocated_students.length
    result.allocation_summary.unallocated_students = result.unallocated_students.length
    result.allocation_summary.utilization_rate = 
      result.allocation_summary.total_capacity > 0 
        ? (result.allocation_summary.allocated_students / result.allocation_summary.total_capacity) * 100
        : 0

    return result
  }

  /**
   * Check if placing a student in a seat violates collision group constraints
   */
  private isValidSeatAllocation(student: Student, seat: Seat, allSeats: Seat[]): boolean {
    // Find collision groups that include this student's department
    const relevantCollisionGroups = this.collisionGroups.filter(group => 
      group.departments.includes(student.department_id)
    )

    if (relevantCollisionGroups.length === 0) {
      return true // No collision constraints
    }

    // Check adjacent seats for collision group violations
    const adjacentSeats = this.getAdjacentSeats(seat, allSeats)
    
    for (const adjacentSeat of adjacentSeats) {
      if (adjacentSeat.student) {
        // Check if adjacent student is in the same collision group
        for (const collisionGroup of relevantCollisionGroups) {
          if (collisionGroup.departments.includes(adjacentSeat.student.department_id)) {
            return false // Collision detected
          }
        }
      }
    }

    return true
  }

  /**
   * Get adjacent seats (left, right, front, back)
   */
  private getAdjacentSeats(seat: Seat, allSeats: Seat[]): Seat[] {
    const adjacent: Seat[] = []
    
    // Find the hall this seat belongs to
    const hallId = seat.id.split('-')[0]
    const hall = this.halls.find(h => h.id === hallId)
    if (!hall) return adjacent

    // Check left seat
    if (seat.column_number > 1) {
      const leftSeat = allSeats.find(s => 
        s.row_number === seat.row_number && 
        s.column_number === seat.column_number - 1
      )
      if (leftSeat) adjacent.push(leftSeat)
    }

    // Check right seat
    if (seat.column_number < hall.columns) {
      const rightSeat = allSeats.find(s => 
        s.row_number === seat.row_number && 
        s.column_number === seat.column_number + 1
      )
      if (rightSeat) adjacent.push(rightSeat)
    }

    // Check front seat
    if (seat.row_number > 1) {
      const frontSeat = allSeats.find(s => 
        s.row_number === seat.row_number - 1 && 
        s.column_number === seat.column_number
      )
      if (frontSeat) adjacent.push(frontSeat)
    }

    // Check back seat
    if (seat.row_number < hall.rows) {
      const backSeat = allSeats.find(s => 
        s.row_number === seat.row_number + 1 && 
        s.column_number === seat.column_number
      )
      if (backSeat) adjacent.push(backSeat)
    }

    return adjacent
  }

  /**
   * Generate seat layout visualization data
   */
  public generateLayoutVisualization(allocationResult: AllocationResult): any[] {
    return allocationResult.halls.map(hall => ({
      hall_id: hall.hall_id,
      hall_name: hall.hall_name,
      rows: this.halls.find(h => h.id === hall.hall_id)?.rows || 0,
      columns: this.halls.find(h => h.id === hall.hall_id)?.columns || 0,
      seats: hall.seats.map(seat => ({
        id: seat.id,
        row: seat.row_number,
        column: seat.column_number,
        seat_number: seat.seat_number,
        student: seat.student ? {
          id: seat.student.id,
          name: seat.student.full_name,
          roll_number: seat.student.roll_number,
          department: seat.student.department_name
        } : null,
        is_occupied: seat.is_occupied
      }))
    }))
  }
}

/**
 * Utility function to run seat allocation
 */
export async function runSeatAllocation(
  students: Student[],
  halls: ExamHall[],
  collisionGroups: CollisionGroup[] = []
): Promise<AllocationResult> {
  const allocator = new SeatAllocator(students, halls, collisionGroups)
  return allocator.allocateSeats()
}

/**
 * Utility function to generate layout visualization
 */
export function generateExamLayout(allocationResult: AllocationResult, halls: ExamHall[]): any[] {
  const allocator = new SeatAllocator([], halls, [])
  return allocator.generateLayoutVisualization(allocationResult)
}
