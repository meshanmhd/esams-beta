-- RE-ENABLE RLS FOR SECURITY
-- Run this after testing to restore proper security

-- Step 1: Re-enable RLS on all tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_allocations ENABLE ROW LEVEL SECURITY;

-- Step 2: Create working RLS policies
DROP POLICY IF EXISTS "admin_full_access" ON public.exams;
DROP POLICY IF EXISTS "view_published_exams" ON public.exams;
DROP POLICY IF EXISTS "admin_manage_departments" ON public.exam_departments;
DROP POLICY IF EXISTS "admin_manage_allocations" ON public.seat_allocations;

-- Create simple, working policies
CREATE POLICY "admin_full_access" ON public.exams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "view_published_exams" ON public.exams FOR SELECT USING (
  status IN ('published', 'ongoing', 'completed')
);

CREATE POLICY "admin_manage_departments" ON public.exam_departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_manage_allocations" ON public.seat_allocations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Step 3: Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('exams', 'exam_departments', 'seat_allocations');

-- Step 4: Success message
SELECT 'RLS re-enabled with working policies!' as status;

