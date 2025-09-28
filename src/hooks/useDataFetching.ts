import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Generic data fetching hook with proper error handling and caching
export function useDataFetching<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean
    staleTime?: number
    retry?: number
    refetchOnWindowFocus?: boolean
  }
) {
  return useQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    retry: options?.retry ?? 2,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  })
}

// Hook for data mutations with automatic cache invalidation
export function useDataMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  invalidateQueries?: string[][],
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      // Invalidate related queries to refresh data
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey })
        })
      }
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('Mutation error:', error)
      options?.onError?.(error)
    },
  })
}

// Specific hooks for common data fetching patterns
export function useStudents() {
  return useDataFetching(
    ['students'],
    async () => {
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true })

      if (studentsError) throw studentsError

      // Fetch departments and classrooms separately
      const studentsWithDepartment = await Promise.all(
        studentsData?.map(async (student: any) => {
          let departmentName = 'No Department'
          let classroomName = 'No Classroom'

          if (student.department_id) {
            const { data: department } = await supabase
              .from('departments')
              .select('name')
              .eq('id', student.department_id)
              .single()
            if (department) departmentName = department.name
          }

          if (student.classroom_id) {
            const { data: classroom } = await supabase
              .from('classrooms')
              .select('name')
              .eq('id', student.classroom_id)
              .single()
            if (classroom) classroomName = classroom.name
          }

          return {
            ...student,
            department_name: departmentName,
            classroom_name: classroomName
          }
        }) || []
      )

      return studentsWithDepartment
    }
  )
}

export function useDepartments() {
  return useDataFetching(
    ['departments'],
    async () => {
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true })

      if (departmentsError) throw departmentsError
      return departmentsData || []
    }
  )
}

export function useExams() {
  return useDataFetching(
    ['exams'],
    async () => {
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          *,
          hall:exam_halls(name, capacity),
          departments:exam_departments(
            department:departments(name)
          )
        `)
        .order('exam_date', { ascending: true })

      if (examsError) throw examsError

      const examsWithDetails = examsData?.map((exam: any) => ({
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        exam_date: exam.exam_date,
        start_time: exam.start_time,
        end_time: exam.end_time,
        status: exam.status,
        hall: { 
          name: exam.hall?.name || 'TBD', 
          capacity: exam.hall?.capacity || 0 
        },
        registrations: exam.registered_students || 0,
        allocations: exam.allocated_students || 0,
        departments: exam.departments?.map((d: any) => d.department.name) || [],
        collision_group: exam.collision_group
      })) || []

      return examsWithDetails
    }
  )
}

// Hook for creating students with proper cache invalidation
export function useCreateStudent() {
  return useDataMutation(
    async (studentData: any) => {
      try {
        // Validate required fields
        if (!studentData.full_name || !studentData.email || !studentData.roll_number || !studentData.department_id) {
          throw new Error('Missing required fields: full_name, email, roll_number, and department_id are required')
        }

        // Check if email already exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', studentData.email)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          throw new Error(`Error checking existing profile: ${checkError.message}`)
        }

        if (existingProfile) {
          throw new Error('A user with this email already exists')
        }

        // Check if roll number already exists for the same department
        const { data: existingRoll, error: rollError } = await supabase
          .from('profiles')
          .select('id')
          .eq('roll_number', studentData.roll_number)
          .eq('department_id', studentData.department_id)
          .single()

        if (rollError && rollError.code !== 'PGRST116') {
          throw new Error(`Error checking existing roll number: ${rollError.message}`)
        }

        if (existingRoll) {
          throw new Error('A student with this roll number already exists in this department')
        }

        // Validate department exists
        const { data: department, error: deptError } = await supabase
          .from('departments')
          .select('id')
          .eq('id', studentData.department_id)
          .single()

        if (deptError) {
          throw new Error(`Invalid department: ${deptError.message}`)
        }

        if (!department) {
          throw new Error('Selected department does not exist')
        }

        // Validate classroom if provided
        if (studentData.classroom_id) {
          const { data: classroom, error: classError } = await supabase
            .from('classrooms')
            .select('id')
            .eq('id', studentData.classroom_id)
            .single()

          if (classError) {
            throw new Error(`Invalid classroom: ${classError.message}`)
          }

          if (!classroom) {
            throw new Error('Selected classroom does not exist')
          }
        }

        // Create the student profile using the ultimate database function
        const { data, error } = await supabase.rpc('create_student_ultimate', {
          p_email: studentData.email,
          p_full_name: studentData.full_name,
          p_phone: studentData.phone || null,
          p_student_id: studentData.student_id || null,
          p_roll_number: studentData.roll_number || null,
          p_department_id: studentData.department_id || null,
          p_classroom_id: studentData.classroom_id || null,
          p_password_hash: studentData.password_hash || null,
          p_created_by: studentData.created_by || null
        })

        if (error) {
          console.error('Supabase insert error:', error)
          throw new Error(`Failed to create student: ${error.message}`)
        }

        // The function returns a table, so we take the first result
        return data[0]
      } catch (error) {
        console.error('Student creation error:', error)
        throw error
      }
    },
    [['students'], ['users']]
  )
}

// Hook for updating students
export function useUpdateStudent() {
  return useDataMutation(
    async ({ id, ...updateData }: { id: string } & any) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    [['students'], ['users']]
  )
}

// Hook for deleting students
export function useDeleteStudent() {
  return useDataMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    [['students'], ['users']]
  )
}

