-- COMPLETE FIX FOR EXAM PUBLISHING
-- This script fixes all issues preventing exam publishing

-- Step 1: Add 'published' to exam_status enum if not exists
DO $$ 
BEGIN
    -- Check if 'published' value exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'published' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'exam_status')
    ) THEN
        ALTER TYPE exam_status ADD VALUE 'published';
    END IF;
END $$;

-- Step 2: Drop ALL existing RLS policies for exams table
DROP POLICY IF EXISTS "Anyone can view published exams" ON public.exams;
DROP POLICY IF EXISTS "Students can view their registered exams" ON public.exams;
DROP POLICY IF EXISTS "Only admins can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can manage all exams" ON public.exams;
DROP POLICY IF EXISTS "Students can view their scheduled exams" ON public.exams;

-- Step 3: Create comprehensive RLS policies
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

-- Step 4: Verify the enum now includes all values
-- You can check this with: SELECT unnest(enum_range(NULL::exam_status));
