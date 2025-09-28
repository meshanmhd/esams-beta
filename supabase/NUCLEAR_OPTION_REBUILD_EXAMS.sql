-- NUCLEAR OPTION: Complete rebuild of exams table
-- Use this ONLY if the URGENT_RLS_FIX.sql doesn't work
-- WARNING: This will delete all existing exam data!

-- Step 1: Drop all dependent tables first
DROP TABLE IF EXISTS public.seat_allocations CASCADE;
DROP TABLE IF EXISTS public.exam_departments CASCADE;

-- Step 2: Drop the exams table completely
DROP TABLE IF EXISTS public.exams CASCADE;

-- Step 3: Recreate the exam_status enum with all values
DROP TYPE IF EXISTS exam_status CASCADE;
CREATE TYPE exam_status AS ENUM ('draft', 'scheduled', 'published', 'ongoing', 'completed', 'cancelled');

-- Step 4: Create exams table from scratch
CREATE TABLE public.exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status exam_status DEFAULT 'draft' NOT NULL,
  max_students INTEGER,
  instructions TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create exam_departments table
CREATE TABLE public.exam_departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, department_id)
);

-- Step 6: Create seat_allocations table
CREATE TABLE public.seat_allocations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seat_id UUID REFERENCES public.seats(id) ON DELETE CASCADE,
  allocated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, student_id),
  UNIQUE(exam_id, seat_id)
);

-- Step 7: Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_allocations ENABLE ROW LEVEL SECURITY;

-- Step 8: Create simple, working RLS policies
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

-- Step 9: Create indexes
CREATE INDEX idx_exams_status ON public.exams(status);
CREATE INDEX idx_exams_created_by ON public.exams(created_by);
CREATE INDEX idx_exam_departments_exam_id ON public.exam_departments(exam_id);
CREATE INDEX idx_seat_allocations_exam_id ON public.seat_allocations(exam_id);

-- Step 10: Success message
SELECT 'Exams table completely rebuilt with working RLS policies!' as status;
