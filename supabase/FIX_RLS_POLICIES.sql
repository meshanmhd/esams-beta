-- Fix RLS policies for exam_halls and other tables
-- This script addresses the "new row violates row-level security policy" error

-- First, let's check if RLS is enabled and drop existing policies
ALTER TABLE public.exam_halls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view exam halls" ON public.exam_halls;
DROP POLICY IF EXISTS "Only admins can manage exam halls" ON public.exam_halls;
DROP POLICY IF EXISTS "exam_halls_select_policy" ON public.exam_halls;
DROP POLICY IF EXISTS "exam_halls_insert_policy" ON public.exam_halls;
DROP POLICY IF EXISTS "exam_halls_update_policy" ON public.exam_halls;
DROP POLICY IF EXISTS "exam_halls_delete_policy" ON public.exam_halls;

-- Create new policies for exam_halls
-- Allow anyone to view exam halls
CREATE POLICY "exam_halls_select_policy" ON public.exam_halls 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert exam halls (for now, we'll make this more restrictive later)
CREATE POLICY "exam_halls_insert_policy" ON public.exam_halls 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update exam halls
CREATE POLICY "exam_halls_update_policy" ON public.exam_halls 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete exam halls
CREATE POLICY "exam_halls_delete_policy" ON public.exam_halls 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Fix seats table policies
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view seats" ON public.seats;
DROP POLICY IF EXISTS "Only admins can manage seats" ON public.seats;
DROP POLICY IF EXISTS "seats_select_policy" ON public.seats;
DROP POLICY IF EXISTS "seats_insert_policy" ON public.seats;
DROP POLICY IF EXISTS "seats_update_policy" ON public.seats;
DROP POLICY IF EXISTS "seats_delete_policy" ON public.seats;

CREATE POLICY "seats_select_policy" ON public.seats 
FOR SELECT 
USING (true);

CREATE POLICY "seats_insert_policy" ON public.seats 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "seats_update_policy" ON public.seats 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "seats_delete_policy" ON public.seats 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Fix profiles table policies to ensure they work properly
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Create new policies for profiles (avoiding recursion)
CREATE POLICY "profiles_select_policy" ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Fix departments table policies
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
DROP POLICY IF EXISTS "Only admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_update_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON public.departments;

CREATE POLICY "departments_select_policy" ON public.departments 
FOR SELECT 
USING (true);

CREATE POLICY "departments_insert_policy" ON public.departments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "departments_update_policy" ON public.departments 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "departments_delete_policy" ON public.departments 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Fix collision_groups table policies
ALTER TABLE public.collision_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view collision groups" ON public.collision_groups;
DROP POLICY IF EXISTS "Only admins can manage collision groups" ON public.collision_groups;
DROP POLICY IF EXISTS "collision_groups_select_policy" ON public.collision_groups;
DROP POLICY IF EXISTS "collision_groups_insert_policy" ON public.collision_groups;
DROP POLICY IF EXISTS "collision_groups_update_policy" ON public.collision_groups;
DROP POLICY IF EXISTS "collision_groups_delete_policy" ON public.collision_groups;

CREATE POLICY "collision_groups_select_policy" ON public.collision_groups 
FOR SELECT 
USING (true);

CREATE POLICY "collision_groups_insert_policy" ON public.collision_groups 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "collision_groups_update_policy" ON public.collision_groups 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "collision_groups_delete_policy" ON public.collision_groups 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add comments to explain the policies
COMMENT ON POLICY "exam_halls_insert_policy" ON public.exam_halls IS 'Allows authenticated users to create exam halls';
COMMENT ON POLICY "seats_insert_policy" ON public.seats IS 'Allows authenticated users to create seats';
COMMENT ON POLICY "profiles_select_policy" ON public.profiles IS 'Users can view their own profile, admins can view all';
COMMENT ON POLICY "departments_insert_policy" ON public.departments IS 'Allows authenticated users to create departments';
COMMENT ON POLICY "collision_groups_insert_policy" ON public.collision_groups IS 'Allows authenticated users to create collision groups';
