-- DEBUG AND FIX AUTH ISSUE
-- This script will help us identify and fix the authentication problem

-- Step 1: Check current user authentication
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_auth_role;

-- Step 2: Check if the current user exists in profiles table
SELECT 
  id,
  full_name,
  role,
  email,
  created_at
FROM public.profiles 
WHERE id = auth.uid();

-- Step 3: Check all admin users
SELECT 
  id,
  full_name,
  role,
  email
FROM public.profiles 
WHERE role = 'admin';

-- Step 4: Check if RLS is enabled on exams table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'exams';

-- Step 5: Check existing policies on exams table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'exams';

-- Step 6: If the current user is not an admin, make them one
-- (Replace 'your-email@example.com' with your actual email)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = auth.uid();

-- Step 7: If the above doesn't work, try this alternative approach
-- Create a policy that allows the current user specifically
DROP POLICY IF EXISTS "current_user_admin" ON public.exams;
CREATE POLICY "current_user_admin" ON public.exams FOR ALL USING (
  id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Step 8: Alternative - temporarily disable RLS for testing
-- ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;

-- Step 9: Check the result
SELECT 'Debug completed - check the results above' as status;
