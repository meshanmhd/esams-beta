-- CREATE EXAM ALLOCATIONS TABLE
-- This table stores the seat allocation results from exam creation

-- Step 1: Create exam_allocations table to store allocation data
CREATE TABLE IF NOT EXISTS public.exam_allocations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  hall_id UUID REFERENCES public.exam_halls(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seat_row INTEGER NOT NULL,
  seat_column INTEGER NOT NULL,
  seat_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE public.exam_allocations ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
CREATE POLICY "admin_manage_exam_allocations" ON public.exam_allocations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "students_view_own_allocation" ON public.exam_allocations FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Step 4: Create indexes for better performance
CREATE INDEX idx_exam_allocations_exam_id ON public.exam_allocations(exam_id);
CREATE INDEX idx_exam_allocations_hall_id ON public.exam_allocations(hall_id);
CREATE INDEX idx_exam_allocations_student_id ON public.exam_allocations(student_id);

-- Step 5: Success message
SELECT 'Exam allocations table created successfully!' as status;

