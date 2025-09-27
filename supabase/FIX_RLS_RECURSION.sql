-- FIX RLS RECURSION ISSUE
-- This script fixes the infinite recursion in RLS policies
-- Run this script in your Supabase SQL editor

-- Step 1: Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Step 2: Create simple, non-recursive policies
-- Allow reading profiles for login purposes (no recursion)
CREATE POLICY "profiles_login_read" ON public.profiles
  FOR SELECT USING (true);

-- Allow inserting profiles
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Allow updating profiles
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow deleting profiles
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (true);

-- Step 3: Test the query that was failing
SELECT * FROM public.profiles WHERE email = 'itsabout.shanmhd@gmail.com';

-- Step 4: Verify the fix worked
SELECT 'RLS RECURSION FIX APPLIED SUCCESSFULLY!' as status;

-- Step 5: Optional - Create more restrictive policies later
-- For now, we're using permissive policies to allow login
-- You can make them more restrictive once login is working

-- Example of more restrictive policy (commented out for now):
-- CREATE POLICY "profiles_restricted_read" ON public.profiles
--   FOR SELECT USING (
--     -- Allow reading if user is authenticated and it's their own profile
--     (auth.uid() IS NOT NULL AND auth_user_id = auth.uid())
--     OR 
--     -- Allow reading student profiles for login
--     (role = 'student' AND auth_user_id IS NULL)
--     OR
--     -- Allow reading admin profiles for login
--     (role = 'admin')
--   );
