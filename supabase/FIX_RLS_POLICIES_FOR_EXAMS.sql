-- Fix RLS policies for exams table to allow admin users to insert
-- This fixes the "new row violates row-level security policy" error

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Anyone can view published exams" ON public.exams;
DROP POLICY IF EXISTS "Students can view their registered exams" ON public.exams;
DROP POLICY IF EXISTS "Only admins can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can manage all exams" ON public.exams;
DROP POLICY IF EXISTS "Students can view their scheduled exams" ON public.exams;

-- Create comprehensive policies that work properly
CREATE POLICY "Admins can manage all exams" ON public.exams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view published exams" ON public.exams FOR SELECT USING (status IN ('published', 'ongoing', 'completed'));

CREATE POLICY "Students can view their scheduled exams" ON public.exams FOR SELECT USING (
  status = 'scheduled' AND
  EXISTS (
    SELECT 1 FROM public.exam_departments ed
    JOIN public.profiles p ON p.department_id = ed.department_id
    WHERE ed.exam_id = exams.id AND p.id = auth.uid()
  )
);
