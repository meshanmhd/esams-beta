export type UserRole = 'admin' | 'student'
export type ExamStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'maintenance'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  student_id?: string
  roll_number?: string
  phone?: string
  department_id?: string
  classroom_id?: string
  password_hash?: string
  is_active?: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  auth_user_id?: string // Optional reference to auth.users(id)
  department?: Department
  classroom?: Classroom
}

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Classroom {
  id: string
  name: string
  department_id: string
  student_count: number
  created_at: string
  updated_at: string
  department?: Department
}

export interface CollisionGroup {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  created_by_profile?: Profile
  departments?: Department[]
}

export interface ExamHall {
  id: string
  name: string
  building?: string
  floor?: string
  capacity: number
  layout_type: string
  location?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Seat {
  id: string
  hall_id: string
  seat_number: string
  row_number?: number
  column_number?: number
  status: SeatStatus
  created_at: string
  updated_at: string
  hall?: ExamHall
}

export interface Exam {
  id: string
  title: string
  description?: string
  subject: string
  exam_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  hall_id: string
  status: ExamStatus
  max_students?: number
  instructions?: string
  collision_group_id?: string
  created_by: string
  created_at: string
  updated_at: string
  hall?: ExamHall
  created_by_profile?: Profile
  collision_group?: CollisionGroup
  departments?: Department[]
}

export interface ExamRegistration {
  id: string
  exam_id: string
  student_id: string
  registered_at: string
  status: string
  exam?: Exam
  student?: Profile
}

export interface SeatAllocation {
  id: string
  exam_id: string
  student_id: string
  seat_id: string
  allocated_at: string
  allocated_by: string
  exam?: Exam
  student?: Profile
  seat?: Seat
  allocated_by_profile?: Profile
}

export interface ExamAttendance {
  id: string
  exam_id: string
  student_id: string
  seat_allocation_id: string
  check_in_time?: string
  check_out_time?: string
  status: string
  notes?: string
  exam?: Exam
  student?: Profile
  seat_allocation?: SeatAllocation
}

// Database response types with Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      exam_halls: {
        Row: ExamHall
        Insert: Omit<ExamHall, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ExamHall, 'id' | 'created_at' | 'updated_at'>>
      }
      seats: {
        Row: Seat
        Insert: Omit<Seat, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Seat, 'id' | 'created_at' | 'updated_at'>>
      }
      exams: {
        Row: Exam
        Insert: Omit<Exam, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Exam, 'id' | 'created_at' | 'updated_at'>>
      }
      exam_registrations: {
        Row: ExamRegistration
        Insert: Omit<ExamRegistration, 'id' | 'registered_at'>
        Update: Partial<Omit<ExamRegistration, 'id' | 'registered_at'>>
      }
      seat_allocations: {
        Row: SeatAllocation
        Insert: Omit<SeatAllocation, 'id' | 'allocated_at'>
        Update: Partial<Omit<SeatAllocation, 'id' | 'allocated_at'>>
      }
      exam_attendance: {
        Row: ExamAttendance
        Insert: Omit<ExamAttendance, 'id'>
        Update: Partial<Omit<ExamAttendance, 'id'>>
      }
    }
  }
}
