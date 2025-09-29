# ESAMS Database Setup Guide

## Quick Setup (5 minutes)

### Step 1: Access Supabase
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account or create a new one
3. Create a new project or select an existing one

### Step 2: Run the Database Schema
1. In your Supabase dashboard, go to the **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `COMPLETE_DATABASE_SCHEMA.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema

### Step 3: Verify Setup
1. Go to **Table Editor** in your Supabase dashboard
2. You should see these tables:
   - `departments`
   - `classrooms`
   - `exam_halls`
   - `collision_groups`
   - `profiles`
   - `exams`
   - `exam_departments`
   - `exam_allocations`

### Step 4: Create Admin User
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Create a user with email and password
4. Go to **Table Editor** → `profiles`
5. Find your user and update the `role` to `admin`

### Step 5: Test the System
1. Start your application
2. Login with the admin credentials
3. You should see the admin dashboard

## What's Included

### ✅ Complete Database Schema
- **8 tables** with proper relationships
- **Row Level Security (RLS)** for data protection
- **Performance indexes** for fast queries
- **Automatic triggers** for data consistency

### ✅ Sample Data
- **5 departments** (CSE, ECE, ME, CE, EEE)
- **7 classrooms** across departments
- **5 exam halls** with different capacities
- **3 collision groups** for scheduling

### ✅ Security Features
- **RLS policies** for admin and student access
- **Data validation** with constraints
- **Automatic profile creation** on user signup

### ✅ Performance Optimizations
- **Strategic indexes** on frequently queried columns
- **Efficient foreign key relationships**
- **Optimized query patterns**

## Troubleshooting

### Common Issues

**Issue**: "Permission denied" errors
**Solution**: Make sure you're running the SQL as the project owner

**Issue**: Tables not appearing
**Solution**: Refresh the Table Editor or check the SQL Editor for errors

**Issue**: RLS policies not working
**Solution**: Ensure you've created an admin user and updated their role

### Getting Help

If you encounter any issues:
1. Check the Supabase logs in the **Logs** section
2. Verify all SQL executed without errors
3. Ensure your user has the correct role in the `profiles` table

## Next Steps

After successful setup:
1. **Configure your environment variables** with Supabase credentials
2. **Test the authentication flow** with admin and student accounts
3. **Create your first exam** using the admin dashboard
4. **Add student users** and test seat allocation

---

**🎉 Your ESAMS database is now ready to use!**




