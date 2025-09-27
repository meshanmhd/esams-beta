-- CLEAN DATABASE SCHEMA - BUILD FROM SCRATCH
-- This script creates a clean database schema with auto-generated UUIDs
-- Run this script in your Supabase SQL editor

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Drop all existing tables (in correct order to avoid foreign key constraints)
DROP TABLE IF EXISTS public.exam_attendance CASCADE;
DROP TABLE IF EXISTS public.seat_allocations CASCADE;
DROP TABLE IF EXISTS public.exam_registrations CASCADE;
DROP TABLE IF EXISTS public.exam_departments CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.seats CASCADE;
DROP TABLE IF EXISTS public.exam_halls CASCADE;
DROP TABLE IF EXISTS public.collision_group_departments CASCADE;
DROP TABLE IF EXISTS public.collision_groups CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.classrooms CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- Step 3: Drop all existing functions and triggers
-- Drop trigger first, then function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop other functions
DROP FUNCTION IF EXISTS public.hash_password(TEXT);
DROP FUNCTION IF EXISTS public.verify_student_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.generate_student_id();
DROP FUNCTION IF EXISTS public.create_student_simple(TEXT, TEXT, TEXT, TEXT, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_student_ultimate(TEXT);
DROP FUNCTION IF EXISTS public.create_student_ultimate(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.is_admin();

-- Step 4: Drop all existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS exam_status CASCADE;
DROP TYPE IF EXISTS seat_status CASCADE;

-- Step 5: Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'student');
CREATE TYPE exam_status AS ENUM ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE seat_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance');

-- Step 6: Create departments table
CREATE TABLE public.departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 7: Create classrooms table
CREATE TABLE public.classrooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: Create profiles table (with all required columns)
CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  student_id TEXT UNIQUE, -- Student ID like STU-XXXXX
  roll_number TEXT UNIQUE, -- Student roll number
  phone TEXT,
  department_id UUID REFERENCES public.departments(id),
  classroom_id UUID REFERENCES public.classrooms(id),
  password_hash TEXT, -- For student login
  is_active BOOLEAN DEFAULT true,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For admin login
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 9: Create collision groups table
CREATE TABLE public.collision_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 10: Create collision group departments table
CREATE TABLE public.collision_group_departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collision_group_id UUID REFERENCES public.collision_groups(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collision_group_id, department_id)
);

-- Step 11: Create exam halls table
CREATE TABLE public.exam_halls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  building TEXT,
  floor TEXT,
  capacity INTEGER NOT NULL,
  rows INTEGER NOT NULL DEFAULT 10,
  columns INTEGER NOT NULL DEFAULT 8,
  block TEXT,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 12: Create seats table
CREATE TABLE public.seats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hall_id UUID REFERENCES public.exam_halls(id) ON DELETE CASCADE NOT NULL,
  seat_number TEXT NOT NULL,
  row_number INTEGER,
  column_number INTEGER,
  status seat_status DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hall_id, seat_number)
);

-- Step 13: Create exams table
CREATE TABLE public.exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  hall_id UUID REFERENCES public.exam_halls(id) NOT NULL,
  status exam_status DEFAULT 'draft',
  max_students INTEGER,
  instructions TEXT,
  collision_group_id UUID REFERENCES public.collision_groups(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 14: Create exam departments table
CREATE TABLE public.exam_departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, department_id)
);

-- Step 15: Create exam registrations table
CREATE TABLE public.exam_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'registered',
  UNIQUE(exam_id, student_id)
);

-- Step 16: Create seat allocations table
CREATE TABLE public.seat_allocations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seat_id UUID REFERENCES public.seats(id) NOT NULL,
  allocated_at TIMESTAMPTZ DEFAULT NOW(),
  allocated_by UUID REFERENCES public.profiles(id) NOT NULL,
  UNIQUE(exam_id, student_id),
  UNIQUE(exam_id, seat_id)
);

-- Step 17: Create exam attendance table
CREATE TABLE public.exam_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seat_allocation_id UUID REFERENCES public.seat_allocations(id) NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  status TEXT DEFAULT 'absent',
  notes TEXT,
  UNIQUE(exam_id, student_id)
);

-- Step 18: Create indexes for better performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX idx_profiles_classroom_id ON public.profiles(classroom_id);
CREATE INDEX idx_seats_hall_id ON public.seats(hall_id);
CREATE INDEX idx_seats_status ON public.seats(status);
CREATE INDEX idx_exams_date ON public.exams(exam_date);
CREATE INDEX idx_exams_status ON public.exams(status);
CREATE INDEX idx_exam_registrations_exam_id ON public.exam_registrations(exam_id);
CREATE INDEX idx_exam_registrations_student_id ON public.exam_registrations(student_id);
CREATE INDEX idx_seat_allocations_exam_id ON public.seat_allocations(exam_id);
CREATE INDEX idx_seat_allocations_student_id ON public.seat_allocations(student_id);
CREATE INDEX idx_exam_attendance_exam_id ON public.exam_attendance(exam_id);

-- Step 19: Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collision_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collision_group_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attendance ENABLE ROW LEVEL SECURITY;

-- Step 20: Create RLS policies
-- Departments policies
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Only admins can manage departments" ON public.departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Classrooms policies
CREATE POLICY "Anyone can view classrooms" ON public.classrooms FOR SELECT USING (true);
CREATE POLICY "Only admins can manage classrooms" ON public.classrooms FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Collision groups policies
CREATE POLICY "Anyone can view collision groups" ON public.collision_groups FOR SELECT USING (true);
CREATE POLICY "Only admins can manage collision groups" ON public.collision_groups FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Collision group departments policies
CREATE POLICY "Anyone can view collision group departments" ON public.collision_group_departments FOR SELECT USING (true);
CREATE POLICY "Only admins can manage collision group departments" ON public.collision_group_departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Exam halls policies
CREATE POLICY "Anyone can view exam halls" ON public.exam_halls FOR SELECT USING (true);
CREATE POLICY "Only admins can manage exam halls" ON public.exam_halls FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seats policies
CREATE POLICY "Anyone can view seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Only admins can manage seats" ON public.seats FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Exams policies
CREATE POLICY "Anyone can view published exams" ON public.exams FOR SELECT USING (status IN ('scheduled', 'ongoing', 'completed'));
CREATE POLICY "Students can view their registered exams" ON public.exams FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.exam_registrations 
    WHERE exam_id = exams.id AND student_id = auth.uid()
  )
);
CREATE POLICY "Only admins can manage exams" ON public.exams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Exam departments policies
CREATE POLICY "Anyone can view exam departments" ON public.exam_departments FOR SELECT USING (true);
CREATE POLICY "Only admins can manage exam departments" ON public.exam_departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Exam registrations policies
CREATE POLICY "Students can view their own registrations" ON public.exam_registrations FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can register for exams" ON public.exam_registrations FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins can manage all registrations" ON public.exam_registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seat allocations policies
CREATE POLICY "Students can view their own seat allocations" ON public.seat_allocations FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Only admins can manage seat allocations" ON public.seat_allocations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Exam attendance policies
CREATE POLICY "Students can view their own attendance" ON public.exam_attendance FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Only admins can manage attendance" ON public.exam_attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Step 21: Create helper functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 22: Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collision_groups_updated_at BEFORE UPDATE ON public.collision_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_halls_updated_at BEFORE UPDATE ON public.exam_halls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON public.seats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 23: Insert sample data
INSERT INTO public.departments (name, code, description) VALUES
('Computer Science', 'CS', 'Computer Science and Engineering'),
('Information Technology', 'IT', 'Information Technology'),
('Electronics and Communication', 'ECE', 'Electronics and Communication Engineering');

INSERT INTO public.classrooms (name, teacher, department_id) VALUES
('CS-101', 'Dr. John Smith', (SELECT id FROM public.departments WHERE code = 'CS')),
('CS-102', 'Dr. Jane Doe', (SELECT id FROM public.departments WHERE code = 'CS')),
('IT-201', 'Dr. Mike Johnson', (SELECT id FROM public.departments WHERE code = 'IT')),
('ECE-301', 'Dr. Sarah Wilson', (SELECT id FROM public.departments WHERE code = 'ECE'));

-- Step 24: Verify the setup
SELECT 'CLEAN DATABASE SCHEMA CREATED SUCCESSFULLY!' as status;

-- Step 25: Show table structure
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
