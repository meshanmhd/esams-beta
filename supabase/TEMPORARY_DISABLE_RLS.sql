-- TEMPORARY DISABLE RLS FOR TESTING
-- This will completely disable RLS on exams table to test if that's the issue

-- Step 1: Disable RLS on exams table
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;

-- Step 2: Disable RLS on exam_departments table
ALTER TABLE public.exam_departments DISABLE ROW LEVEL SECURITY;

-- Step 3: Disable RLS on seat_allocations table
ALTER TABLE public.seat_allocations DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('exams', 'exam_departments', 'seat_allocations');

-- Step 5: Success message
SELECT 'RLS temporarily disabled - try publishing an exam now' as status;
