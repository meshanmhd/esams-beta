-- =====================================================
-- ESAMS - Complete Database Schema
-- Exam Seat Allocation Management System
-- =====================================================
-- This file creates the complete database schema from scratch
-- Run this in your Supabase SQL Editor to set up the entire system
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'student');

-- Exam status
CREATE TYPE exam_status AS ENUM ('draft', 'scheduled', 'published', 'unpublished', 'completed');

-- Seating types
CREATE TYPE seating_type AS ENUM ('single', 'double');

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- Departments table
CREATE TABLE public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classrooms table
CREATE TABLE public.classrooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, department_id)
);

-- Exam halls table
CREATE TABLE public.exam_halls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    building VARCHAR(100),
    floor VARCHAR(50),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    rows INTEGER NOT NULL CHECK (rows > 0),
    columns INTEGER NOT NULL CHECK (columns > 0),
    seating_type seating_type NOT NULL DEFAULT 'single',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collision groups table
CREATE TABLE public.collision_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collision group departments junction table
CREATE TABLE public.collision_group_departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collision_group_id UUID REFERENCES public.collision_groups(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collision_group_id, department_id)
);

-- =====================================================
-- 3. USER MANAGEMENT
-- =====================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    student_id VARCHAR(20) UNIQUE,
    roll_number VARCHAR(20) UNIQUE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT student_id_required_for_students CHECK (
        (role = 'student' AND student_id IS NOT NULL AND roll_number IS NOT NULL) OR
        (role = 'admin')
    )
);

-- =====================================================
-- 4. EXAM MANAGEMENT
-- =====================================================

-- Exams table
CREATE TABLE public.exams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    status exam_status NOT NULL DEFAULT 'draft',
    instructions TEXT,
    collision_group_id UUID REFERENCES public.collision_groups(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_exam_times CHECK (end_time > start_time),
    CONSTRAINT valid_exam_date CHECK (exam_date >= CURRENT_DATE)
);

-- Exam departments junction table
CREATE TABLE public.exam_departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, department_id)
);

-- =====================================================
-- 5. SEAT ALLOCATION
-- =====================================================

-- Exam allocations table
CREATE TABLE public.exam_allocations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    hall_id UUID REFERENCES public.exam_halls(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    seat_row INTEGER NOT NULL CHECK (seat_row > 0),
    seat_column INTEGER NOT NULL CHECK (seat_column > 0),
    seat_number VARCHAR(20) NOT NULL,
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id),
    UNIQUE(exam_id, hall_id, seat_row, seat_column)
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_department ON public.profiles(department_id);
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX idx_profiles_roll_number ON public.profiles(roll_number);

-- Exams indexes
CREATE INDEX idx_exams_status ON public.exams(status);
CREATE INDEX idx_exams_date ON public.exams(exam_date);
CREATE INDEX idx_exams_scheduled_at ON public.exams(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_exams_created_by ON public.exams(created_by);

-- Exam allocations indexes
CREATE INDEX idx_exam_allocations_exam ON public.exam_allocations(exam_id);
CREATE INDEX idx_exam_allocations_student ON public.exam_allocations(student_id);
CREATE INDEX idx_exam_allocations_hall ON public.exam_allocations(hall_id);

-- Exam departments indexes
CREATE INDEX idx_exam_departments_exam ON public.exam_departments(exam_id);
CREATE INDEX idx_exam_departments_department ON public.exam_departments(department_id);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collision_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collision_group_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_allocations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Departments policies
CREATE POLICY "Everyone can view departments" ON public.departments
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage departments" ON public.departments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Classrooms policies
CREATE POLICY "Everyone can view classrooms" ON public.classrooms
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage classrooms" ON public.classrooms
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Exam halls policies
CREATE POLICY "Everyone can view exam halls" ON public.exam_halls
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage exam halls" ON public.exam_halls
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Collision groups policies
CREATE POLICY "Admins can manage collision groups" ON public.collision_groups
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Everyone can view collision groups" ON public.collision_groups
    FOR SELECT USING (true);

-- Collision group departments policies
CREATE POLICY "Admins can manage collision group departments" ON public.collision_group_departments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Exams policies
CREATE POLICY "Admins can manage all exams" ON public.exams
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Students can view published exams for their department" ON public.exams
    FOR SELECT USING (
        status = 'published' AND EXISTS (
            SELECT 1 FROM public.exam_departments
            WHERE exam_id = exams.id AND department_id IN (
                SELECT department_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Students can view scheduled exams for their department" ON public.exams
    FOR SELECT USING (
        status = 'scheduled' AND EXISTS (
            SELECT 1 FROM public.exam_departments
            WHERE exam_id = exams.id AND department_id IN (
                SELECT department_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Exam departments policies
CREATE POLICY "Admins can manage exam departments" ON public.exam_departments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Students can view exam departments for their department" ON public.exam_departments
    FOR SELECT USING (
        department_id IN (
            SELECT department_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Exam allocations policies
CREATE POLICY "Admins can manage exam allocations" ON public.exam_allocations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Students can view their own exam allocations" ON public.exam_allocations
    FOR SELECT USING (student_id = auth.uid());

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'student');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_halls_updated_at BEFORE UPDATE ON public.exam_halls
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collision_groups_updated_at BEFORE UPDATE ON public.collision_groups
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-publish scheduled exams (placeholder for cron job)
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_exams()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function is called when an exam is scheduled
    -- In a production environment, you would integrate this with a cron job
    -- or a serverless function to check and publish scheduled exams
    RAISE NOTICE 'Exam % scheduled to be published at %', NEW.id, NEW.scheduled_at;
    RETURN NEW;
END;
$$;

-- Trigger for scheduled exams
DROP TRIGGER IF EXISTS trg_auto_publish_scheduled_exams ON public.exams;
CREATE TRIGGER trg_auto_publish_scheduled_exams
    AFTER INSERT OR UPDATE OF status, scheduled_at ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.auto_publish_scheduled_exams();

-- =====================================================
-- 10. SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample departments
INSERT INTO public.departments (name, code, description) VALUES
('Computer Science and Engineering', 'CSE', 'Computer Science and Engineering Department'),
('Electronics and Communication Engineering', 'ECE', 'Electronics and Communication Engineering Department'),
('Mechanical Engineering', 'ME', 'Mechanical Engineering Department'),
('Civil Engineering', 'CE', 'Civil Engineering Department'),
('Electrical and Electronics Engineering', 'EEE', 'Electrical and Electronics Engineering Department');

-- Insert sample classrooms
INSERT INTO public.classrooms (name, department_id) VALUES
('CSE A', (SELECT id FROM public.departments WHERE code = 'CSE')),
('CSE B', (SELECT id FROM public.departments WHERE code = 'CSE')),
('ECE A', (SELECT id FROM public.departments WHERE code = 'ECE')),
('ECE B', (SELECT id FROM public.departments WHERE code = 'ECE')),
('ME A', (SELECT id FROM public.departments WHERE code = 'ME')),
('CE A', (SELECT id FROM public.departments WHERE code = 'CE')),
('EEE A', (SELECT id FROM public.departments WHERE code = 'EEE'));

-- Insert sample exam halls
INSERT INTO public.exam_halls (name, building, floor, capacity, rows, columns, seating_type, description) VALUES
('Hall 1', 'Main Building', 'Ground Floor', 50, 5, 10, 'single', 'Main examination hall with single seating'),
('Hall 2', 'Main Building', 'First Floor', 100, 10, 10, 'double', 'Large hall with double seating arrangement'),
('Hall 3', 'Block A', 'Second Floor', 75, 5, 15, 'single', 'Medium hall with single seating'),
('Hall 4', 'Block B', 'Ground Floor', 60, 6, 10, 'double', 'Hall with double seating for group exams'),
('Hall 5', 'Main Building', 'Third Floor', 40, 4, 10, 'single', 'Small hall for special exams');

-- Insert sample collision groups
INSERT INTO public.collision_groups (name, description) VALUES
('Group A', 'First group of departments for collision-free scheduling'),
('Group B', 'Second group of departments for collision-free scheduling'),
('Group C', 'Third group of departments for collision-free scheduling');

-- Insert collision group departments
INSERT INTO public.collision_group_departments (collision_group_id, department_id) VALUES
((SELECT id FROM public.collision_groups WHERE name = 'Group A'), (SELECT id FROM public.departments WHERE code = 'CSE')),
((SELECT id FROM public.collision_groups WHERE name = 'Group A'), (SELECT id FROM public.departments WHERE code = 'ECE')),
((SELECT id FROM public.collision_groups WHERE name = 'Group B'), (SELECT id FROM public.departments WHERE code = 'ME')),
((SELECT id FROM public.collision_groups WHERE name = 'Group B'), (SELECT id FROM public.departments WHERE code = 'CE')),
((SELECT id FROM public.collision_groups WHERE name = 'Group C'), (SELECT id FROM public.departments WHERE code = 'EEE'));

-- =====================================================
-- 11. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- 12. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.departments IS 'Academic departments in the institution';
COMMENT ON TABLE public.classrooms IS 'Classrooms within departments';
COMMENT ON TABLE public.exam_halls IS 'Examination halls with seating arrangements';
COMMENT ON TABLE public.collision_groups IS 'Groups of departments that cannot have exams at the same time';
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.exams IS 'Examination records with scheduling information';
COMMENT ON TABLE public.exam_departments IS 'Many-to-many relationship between exams and departments';
COMMENT ON TABLE public.exam_allocations IS 'Seat allocations for students in specific exams';

COMMENT ON COLUMN public.exams.status IS 'Current status of the exam: draft, scheduled, published, unpublished, completed';
COMMENT ON COLUMN public.exams.scheduled_at IS 'Timestamp when the exam should be automatically published';
COMMENT ON COLUMN public.exam_allocations.seat_number IS 'Human-readable seat identifier (e.g., A1, B2, etc.)';

-- =====================================================
-- COMPLETE DATABASE SCHEMA SETUP FINISHED
-- =====================================================
-- 
-- This schema includes:
-- ✅ All necessary tables with proper relationships
-- ✅ Comprehensive RLS policies for security
-- ✅ Performance indexes for fast queries
-- ✅ Automatic triggers for data consistency
-- ✅ Sample data for testing
-- ✅ Proper constraints and validations
-- ✅ Complete documentation
--
-- To use this schema:
-- 1. Copy this entire file
-- 2. Paste it into your Supabase SQL Editor
-- 3. Run it to create the complete database
-- 4. The system will be ready for use immediately
-- =====================================================


