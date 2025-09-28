-- DISABLE RLS FOR ALL TABLES TEMPORARILY
-- This script disables Row Level Security for all tables in the database
-- Use this for debugging purposes only

-- Disable RLS on all main tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_halls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collision_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_allocations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on any other tables that might exist
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT schemaname||'.'||tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            'profiles', 'departments', 'classrooms', 'exam_halls', 
            'exams', 'exam_departments', 'exam_allocations', 
            'collision_groups', 'seat_allocations'
        )
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE ' || table_name || ' DISABLE ROW LEVEL SECURITY;';
            RAISE NOTICE 'Disabled RLS for table: %', table_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not disable RLS for table %: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Success message
SELECT 'RLS disabled for all tables successfully!' as status;
