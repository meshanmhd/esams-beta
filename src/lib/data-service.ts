import { supabase } from './supabase'

// Optimized data fetching service with caching and parallel requests

export class DataService {
  // Student data fetching
  static async fetchStudentData(userId: string) {
    const [allocationsResult, departmentResult] = await Promise.allSettled([
      // Fetch exam allocations
      supabase
        .from('exam_allocations')
        .select(`
          *,
          exam:exams(*),
          hall:exam_halls(*)
        `)
        .eq('student_id', userId)
        .in('exam.status', ['published', 'scheduled']),
      
      // Fetch student's department
      supabase
        .from('profiles')
        .select('classroom:classrooms(department_id)')
        .eq('id', userId)
        .single()
    ])

    const allocations = allocationsResult.status === 'fulfilled' && !allocationsResult.value.error
      ? allocationsResult.value.data || []
      : []

    let upcomingExams = []
    if (departmentResult.status === 'fulfilled' && 
        !departmentResult.value.error && 
        departmentResult.value.data?.classroom?.department_id) {
      
      const { data: exams } = await supabase
        .from('exams')
        .select(`
          *,
          exam_departments!inner(department_id)
        `)
        .eq('exam_departments.department_id', departmentResult.value.data.classroom.department_id)
        .in('status', ['published', 'scheduled'])
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .order('exam_date', { ascending: true })

      upcomingExams = exams || []
    }

    return { allocations, upcomingExams }
  }

  // Admin exams fetching
  static async fetchAdminExams() {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        subject,
        exam_date,
        start_time,
        end_time,
        status,
        created_at,
        departments:exam_departments(
          department:departments(name)
        )
      `)
      .order('exam_date', { ascending: true })

    if (error) throw error

    return data?.map((exam: any) => ({
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      status: exam.status,
      registrations: 0,
      allocations: 0,
      departments: exam.departments?.map((d: any) => d.department.name) || [],
      collision_group: ''
    })) || []
  }

  // Exam details fetching
  static async fetchExamDetails(examId: string) {
    const [examResult, allocationsResult, hallsResult, examDeptResult] = await Promise.allSettled([
      // Fetch exam details
      supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single(),

      // Fetch seat allocations
      supabase
        .from('exam_allocations')
        .select(`
          *,
          student:profiles(
            id,
            full_name,
            roll_number,
            department:departments(name),
            classroom:classrooms(name)
          )
        `)
        .eq('exam_id', examId),

      // Fetch exam halls
      supabase
        .from('exam_halls')
        .select('*')
        .order('name'),

      // Fetch exam departments
      supabase
        .from('exam_departments')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('exam_id', examId)
    ])

    const exam = examResult.status === 'fulfilled' && !examResult.value.error
      ? examResult.value.data
      : null

    const allocations = allocationsResult.status === 'fulfilled' && !allocationsResult.value.error
      ? allocationsResult.value.data?.map((allocation: any) => ({
          ...allocation,
          student: {
            id: allocation.student.id,
            full_name: allocation.student.full_name,
            roll_number: allocation.student.roll_number,
            department_name: allocation.student.department?.name || 'No Department',
            classroom_name: allocation.student.classroom?.name || 'No Classroom'
          }
        })) || []
      : []

    const halls = hallsResult.status === 'fulfilled' && !hallsResult.value.error
      ? hallsResult.value.data || []
      : []

    const examDepartments = examDeptResult.status === 'fulfilled' && !examDeptResult.value.error
      ? examDeptResult.value.data || []
      : []

    // Fetch students from departments if needed
    let departmentStudents = []
    if (examDepartments.length > 0) {
      const departmentIds = examDepartments.map((d: any) => d.department_id)
      const { data: studentsData } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(name),
          classroom:classrooms(name)
        `)
        .eq('role', 'student')
        .in('department_id', departmentIds)
        .order('roll_number')

      departmentStudents = studentsData?.map((student: any) => ({
        ...student,
        department: examDepartments.find((d: any) => d.department_id === student.department_id)?.department
      })) || []
    }

    return {
      exam,
      allocations,
      halls,
      examDepartments,
      departmentStudents
    }
  }

  // Exam creation data fetching
  static async fetchExamCreationData() {
    const [departmentsResult, hallsResult, collisionGroupsResult] = await Promise.allSettled([
      // Fetch departments with student count
      supabase
        .from('departments')
        .select(`
          *,
          student_count:profiles(count)
        `)
        .eq('student_count.role', 'student')
        .order('name'),

      // Fetch exam halls
      supabase
        .from('exam_halls')
        .select('*')
        .order('name'),

      // Fetch collision groups
      supabase
        .from('collision_groups')
        .select(`
          *,
          departments:collision_group_departments(
            department:departments(*)
          )
        `)
        .order('name')
    ])

    const departments = departmentsResult.status === 'fulfilled' && !departmentsResult.value.error
      ? departmentsResult.value.data?.map((dept: any) => ({
          ...dept,
          student_count: dept.student_count?.[0]?.count || 0
        })) || []
      : []

    const halls = hallsResult.status === 'fulfilled' && !hallsResult.value.error
      ? hallsResult.value.data || []
      : []

    const collisionGroups = collisionGroupsResult.status === 'fulfilled' && !collisionGroupsResult.value.error
      ? collisionGroupsResult.value.data?.map((group: any) => ({
          ...group,
          departments: group.departments?.map((cgd: any) => cgd.department) || []
        })) || []
      : []

    return { departments, halls, collisionGroups }
  }

  // Students fetching for departments
  static async fetchStudentsForDepartments(departmentIds: string[]) {
    if (departmentIds.length === 0) return []

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        department:departments(*),
        classroom:classrooms(*)
      `)
      .eq('role', 'student')
      .in('department_id', departmentIds)
      .order('roll_number')

    if (error) return []

    return data?.map((student: any) => ({
      ...student,
      department_name: student.department?.name || 'No Department',     
      classroom_name: student.classroom?.name || 'No Classroom'
    })) || []
  }
}

