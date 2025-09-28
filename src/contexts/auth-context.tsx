'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import { createUserProfile, getUserProfile } from '@/lib/auth-helpers'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInStudent: (email: string, password: string) => Promise<{ error: Error | null }>
  unifiedSignIn: (email: string, password: string) => Promise<{ error: Error | null; userType?: 'admin' | 'student' }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      // Try to fetch by auth_user_id first (for admin users)
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single()
      
      // If not found, try to fetch by id (for student users)
      if (profileError && profileError.code === 'PGRST116') {
        const { data: profileDataById, error: profileErrorById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        profileData = profileDataById
        profileError = profileErrorById
      }
      
      if (profileError) {
        setProfile(null)
      } else {
        setProfile(profileData)
      }
    } catch (error) {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    // This is for admin login only
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInStudent = async (email: string, password: string) => {
    // Student login using custom password verification
    try {
      const { data, error } = await supabase.rpc('verify_student_password', {
        student_email: email,
        password: password
      })

      if (error) {
        return { error: new Error('Invalid credentials') }
      }

      if (!data) {
        return { error: new Error('Invalid credentials') }
      }

      // Get student profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('role', 'student')
        .single()

      if (profileError || !profileData) {
        return { error: new Error('Student not found') }
      }

      // Set profile for student (no Supabase auth session)
      setProfile(profileData)
      setUser({ id: profileData.id, email: profileData.email } as User)
      setSession(null) // No Supabase session for students

      return { error: null }
    } catch (error) {
      return { error: new Error('Login failed') }
    }
  }

  const unifiedSignIn = async (email: string, password: string) => {
    setLoading(true)
    
    try {
      // First check if user exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()
      
      if (profileError) {
        setLoading(false)
        
        // Check if it's a "no rows found" error
        if (profileError.message.includes('No rows found') || profileError.message.includes('PGRST116')) {
          return { error: new Error('User not found. Please contact administrator.') }
        }
        
        return { error: new Error('Database error: ' + profileError.message) }
      }

      if (!profileData) {
        setLoading(false)
        return { error: new Error('User not found. Please contact administrator.') }
      }

      // Check if user is active
      if (!profileData.is_active) {
        setLoading(false)
        return { error: new Error('Account is deactivated. Please contact administrator.') }
      }

      // Handle admin login
      if (profileData.role === 'admin') {
        try {
          const { data: authData, error: adminError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (adminError) {
            setLoading(false)
            return { error: new Error('Invalid admin credentials') }
          }

          if (authData.user) {
            // Update profile with auth_user_id if not set
            if (!profileData.auth_user_id) {
              await supabase
                .from('profiles')
                .update({ auth_user_id: authData.user.id })
                .eq('id', profileData.id)
            }

            setProfile(profileData)
            setUser(authData.user)
            setSession(authData.session)
            setLoading(false)
            return { error: null, userType: 'admin' }
          }
        } catch (error) {
          setLoading(false)
          return { error: new Error('Admin login failed') }
        }
      }

      // Handle student login
      if (profileData.role === 'student') {
        // Simple password verification (in production, use proper password hashing)
        if (!profileData.password_hash) {
          setLoading(false)
          return { error: new Error('Student account not properly set up') }
        }

        // Hash the provided password and compare
        const hashedPassword = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
        const hashedPasswordHex = Array.from(new Uint8Array(hashedPassword))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

        if (hashedPasswordHex !== profileData.password_hash) {
          setLoading(false)
          return { error: new Error('Invalid student credentials') }
        }

        // Student login successful
        setProfile(profileData)
        setUser({ id: profileData.id, email: profileData.email } as User)
        setSession(null) // No Supabase session for students
        setLoading(false)
        return { error: null, userType: 'student' }
      }

      setLoading(false)
      return { error: new Error('Invalid user role: ' + profileData.role) }
    } catch (error) {
      setLoading(false)
      return { error: new Error('Login failed: ' + (error as Error).message) }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      setLoading(false)
    } catch (error) {
      // Still clear the state even if signOut fails
      setUser(null)
      setProfile(null)
      setSession(null)
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    return { error: error ? new Error(error.message) : null }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signInStudent,
    unifiedSignIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
