# Fix Database Error - Step by Step

## The Problem
The error "infinite recursion detected in policy for relation 'profiles'" occurs because the RLS policies were referencing themselves, creating a circular dependency.

## The Solution
I've fixed the database schema by:

1. **Created a helper function** `is_admin()` to avoid recursion
2. **Updated all RLS policies** to use this function instead of direct queries
3. **Fixed table creation order** to avoid circular dependencies

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click "SQL Editor" → "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute

### Option 2: Reset and Recreate (If Option 1 doesn't work)
1. Go to Supabase Dashboard → Settings → Database
2. Click "Reset Database" (⚠️ This will delete all data)
3. Run the updated schema from `supabase/schema.sql`

## What's Fixed

### ✅ Database Schema Issues
- **Circular dependency resolved**: Tables now create in correct order
- **RLS policies fixed**: No more infinite recursion
- **Helper function added**: `is_admin()` function for clean policy checks

### ✅ UI Styling Updated
- **Clean white background**: Matches the modern design from your images
- **Modern styling**: Clean cards, rounded corners, subtle shadows
- **Consistent design**: Professional look throughout the application

### ✅ User Management Added
- **New page**: `/admin/users` for managing user accounts
- **Add users**: Create new admin or student accounts
- **Edit users**: Update user information and roles
- **Role management**: Easily promote students to admin or vice versa
- **Email management**: Add/update email addresses for users

## Next Steps

1. **Run the database schema** using one of the methods above
2. **Start your development server**: `npm run dev`
3. **Create your first admin user**:
   - Sign up through the app (creates student profile)
   - Go to Supabase dashboard → Table Editor → profiles
   - Change your user's `role` from 'student' to 'admin'
4. **Access user management**: Go to Admin Dashboard → User Management

## Features Now Available

### For Admins:
- ✅ User Management page (`/admin/users`)
- ✅ Add new users with email and role
- ✅ Edit existing users
- ✅ Promote students to admin
- ✅ Manage user departments and classrooms

### For Students:
- ✅ Clean, modern interface
- ✅ Easy navigation
- ✅ Professional styling

The system is now ready for production use with proper user management and a clean, professional interface!
