import { supabase } from './supabase'
import { Profile } from '@/types/database'

/**
 * Create a user profile after successful authentication
 */
export async function createUserProfile(user: any, additionalData?: {
  full_name?: string
  student_id?: string
  roll_number?: string
  phone?: string
  department_id?: string
  classroom_id?: string
}): Promise<{ profile: Profile | null; error: Error | null }> {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return { profile: null, error: new Error(fetchError.message) }
    }

    if (existingProfile) {
      return { profile: existingProfile, error: null }
    }

    // Create new profile
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: additionalData?.full_name || user.user_metadata?.full_name || user.email,
      role: 'student' as const,
      student_id: additionalData?.student_id || null,
      roll_number: additionalData?.roll_number || null,
      phone: additionalData?.phone || null,
      department_id: additionalData?.department_id || null,
      classroom_id: additionalData?.classroom_id || null,
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (insertError) {
      return { profile: null, error: new Error(insertError.message) }
    }

    return { profile: newProfile, error: null }
  } catch (error) {
    return { 
      profile: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<Profile>
): Promise<{ profile: Profile | null; error: Error | null }> {
  try {
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { profile: null, error: new Error(error.message) }
    }

    return { profile: updatedProfile, error: null }
  } catch (error) {
    return { 
      profile: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    }
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<{ profile: Profile | null; error: Error | null }> {
  try {
    // First, get the basic profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return { profile: null, error: new Error(error.message) }
    }

    // If profile has department_id, fetch department separately
    if (profile.department_id) {
      const { data: department } = await supabase
        .from('departments')
        .select('*')
        .eq('id', profile.department_id)
        .single()
      
      if (department) {
        profile.department = department
      }
    }

    // If profile has classroom_id, fetch classroom separately
    if (profile.classroom_id) {
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', profile.classroom_id)
        .single()
      
      if (classroom) {
        profile.classroom = classroom
      }
    }

    return { profile, error: null }
  } catch (error) {
    return { 
      profile: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    }
  }
}

/**
 * Promote user to admin
 */
export async function promoteToAdmin(userId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)

    if (error) {
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    }
  }
}
