-- REBUILD EXAMS TABLE FROM SCRATCH
-- This completely rebuilds the exams table and RLS policies to fix all issues

-- Step 1: Drop existing exams table and related tables (in correct order)
DROP TABLE IF EXISTS public.seat_allocations CASCADE;
DROP TABLE IF EXISTS public.exam_departments CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;

-- Step 2: Recreate exam_status enum with all values
DROP TYPE IF EXISTS exam_status CASCADE;
CREATE TYPE exam_status AS ENUM ('draft', 'scheduled', 'published', 'ongoing', 'completed', 'cancelled');

-- Step 3: Create exams table from scratch
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

-- Step 4: Create exam_departments table
CREATE TABLE public.exam_departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, department_id)
);

-- Step 5: Create seat_allocations table
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

-- Step 6: Enable RLS on all tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_allocations ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for exams table
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

-- Step 8: Create RLS policies for exam_departments table
CREATE POLICY "Admins can manage exam departments" ON public.exam_departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view exam departments" ON public.exam_departments FOR SELECT USING (true);

-- Step 9: Create RLS policies for seat_allocations table
CREATE POLICY "Admins can manage seat allocations" ON public.seat_allocations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Students can view their own allocations" ON public.seat_allocations FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Step 10: Create indexes for better performance
CREATE INDEX idx_exams_status ON public.exams(status);
CREATE INDEX idx_exams_created_by ON public.exams(created_by);
CREATE INDEX idx_exam_departments_exam_id ON public.exam_departments(exam_id);
CREATE INDEX idx_exam_departments_department_id ON public.exam_departments(department_id);
CREATE INDEX idx_seat_allocations_exam_id ON public.seat_allocations(exam_id);
CREATE INDEX idx_seat_allocations_student_id ON public.seat_allocations(student_id);

-- Step 11: Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 12: Verify the setup
SELECT 'Exams table rebuilt successfully' as status;
