-- DEBUG PROFILES TABLE
-- Run this script to debug the profiles table and fix RLS issues

-- Step 1: Check if profiles table exists and has data
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Step 2: Show all profiles (this might be blocked by RLS)
SELECT id, email, full_name, role, is_active, auth_user_id FROM public.profiles;

-- Step 3: Check RLS policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 4: Temporarily disable RLS for debugging (run this if needed)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 5: Check if your admin user exists
SELECT * FROM public.profiles WHERE email = 'your-admin-email@example.com';

-- Step 6: If you need to create an admin user manually
-- Replace 'your-admin-email@example.com' with your actual email
INSERT INTO public.profiles (
  email,
  full_name,
  role,
  is_active,
  auth_user_id,
  created_at,
  updated_at
) VALUES (
  'your-admin-email@example.com',
  'Admin User',
  'admin',
  true,
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_active = true;

-- Step 7: Re-enable RLS after debugging (if you disabled it)
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Update RLS policies to allow profile lookup by email
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;

CREATE POLICY "profiles_read_policy" ON public.profiles
  FOR SELECT USING (
    -- Allow users to read their own profile
    (auth.uid() IS NOT NULL AND auth_user_id = auth.uid())
    OR 
    -- Allow reading student profiles (for login)
    (role = 'student' AND auth_user_id IS NULL AND is_active = true)
    OR
    -- Allow reading admin profiles (for login)
    (role = 'admin' AND is_active = true)
  );

-- Step 9: Test the query that the app uses
SELECT * FROM public.profiles WHERE email = 'your-admin-email@example.com';
