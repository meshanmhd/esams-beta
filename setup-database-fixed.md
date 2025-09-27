# Fixed Database Setup Instructions

## Issues Fixed

### ✅ 1. Trigger Error Fixed
- **Problem**: `ERROR: 42710: trigger "on_auth_user_created" for relation "users" already exists`
- **Solution**: Added `DROP TRIGGER IF EXISTS` before creating the trigger

### ✅ 2. Function Dependency Fixed
- **Problem**: `ERROR: 42883: function public.is_admin() does not exist`
- **Solution**: Moved the `is_admin()` function to the top of the schema, before any policies that reference it

### ✅ 3. User Profile Creation Added
- **Added**: Client-side helper functions to create user profiles
- **Added**: Automatic profile creation when users sign up
- **Added**: Profile creation for existing users who don't have profiles

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click "SQL Editor" → "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute

### Option 2: Reset Database (If Option 1 doesn't work)
1. Go to Supabase Dashboard → Settings → Database
2. Click "Reset Database" (⚠️ This will delete all data)
3. Run the updated schema from `supabase/schema.sql`

## What's Now Working

### ✅ Database Schema
- **Types**: Safely dropped and recreated
- **Functions**: Created in correct order
- **Tables**: All created with proper relationships
- **Triggers**: Safely dropped and recreated
- **RLS Policies**: All working with proper function references

### ✅ User Management
- **Automatic Profile Creation**: When users sign up, profiles are automatically created
- **Profile Fetching**: Existing users get their profiles loaded
- **Fallback Creation**: If a user doesn't have a profile, one is created automatically
- **Helper Functions**: Clean, reusable functions for profile management

### ✅ Authentication Flow
1. **User Signs Up** → Profile automatically created in `profiles` table
2. **User Signs In** → Profile is fetched and loaded
3. **Missing Profile** → Automatically created if not found
4. **Role Management** → Users can be promoted to admin through the UI

## Testing the Setup

1. **Run the database schema** using one of the methods above
2. **Start your development server**: `npm run dev`
3. **Test user registration**:
   - Go to `/auth/signup`
   - Create a new account
   - Check Supabase dashboard → Table Editor → profiles
   - Verify the user profile was created
4. **Test user login**:
   - Go to `/auth/signin`
   - Sign in with the created account
   - Verify you're redirected to the dashboard

## Next Steps

1. **Create your first admin**:
   - Sign up through the app
   - Go to Supabase dashboard → Table Editor → profiles
   - Find your user and change `role` from 'student' to 'admin'
   - Now you can access the admin panel!

2. **Use the User Management**:
   - Go to Admin Dashboard → User Management
   - Add new users, edit existing ones
   - Promote users to admin role

The system is now fully functional with proper user profile management and database setup!
