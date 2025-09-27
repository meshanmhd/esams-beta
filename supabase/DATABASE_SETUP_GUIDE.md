# Database Setup Guide for ESAMS

This guide explains how to set up the Supabase database for the ESAMS (Exam Seat Allocation Management System) with all the new features.

## 🚀 Quick Setup (New Database)

If you're setting up a completely new database, run this file in your Supabase SQL editor:

```sql
-- Run this file in Supabase SQL Editor
supabase/complete-database-setup.sql
```

This will create all tables, relationships, policies, and sample data.

## 🔄 Migration (Existing Database)

If you already have an existing ESAMS database, run this migration file instead:

```sql
-- Run this file in Supabase SQL Editor
supabase/migration-add-new-features.sql
```

## 📋 What's Added/Changed

### New Tables:
- `exams` - Store exam information
- `exam_departments` - Multi-select departments for exams
- `exam_halls_junction` - Multi-select halls for exams
- `exam_collision_groups` - Collision groups for exams
- `seats` - Individual seat information for halls
- `seat_allocations` - Student seat assignments
- `exam_registrations` - Student exam registrations
- `attendance` - Exam attendance tracking

### New Columns:
- `profiles.password_hash` - For student authentication
- `classrooms.teacher` - Teacher name for classrooms
- `exam_halls.rows`, `columns`, `layout_type` - Hall layout information
- Audit fields (`created_by`, `updated_by`) for all tables

### New Functions:
- `hash_password()` - Hash student passwords
- `verify_student_password()` - Verify student login
- `update_updated_at_column()` - Auto-update timestamps

### New Features:
- **Student Authentication**: Password-based login for students
- **Multi-Select**: Departments and halls can be selected for exams
- **Seat Allocation**: Advanced algorithm with collision group constraints
- **Visual Layouts**: Interactive seat arrangement visualization
- **Real-time Stats**: Capacity utilization and allocation metrics

## 🔧 Manual Setup Steps

### 1. Run the SQL File
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of either:
   - `complete-database-setup.sql` (new database)
   - `migration-add-new-features.sql` (existing database)
4. Click "Run" to execute

### 2. Verify Setup
After running the SQL, you should see:
- All tables created successfully
- RLS policies enabled
- Sample data inserted
- Functions created

### 3. Test the Functions
You can test the password functions:

```sql
-- Test password hashing
SELECT hash_password('test123');

-- Test student verification (after creating a student with password)
SELECT verify_student_password('student@example.com', 'test123');
```

## 🎯 Key Features Enabled

### For Administrators:
- ✅ Create exams with multi-select departments and halls
- ✅ Run automatic seat allocation with collision constraints
- ✅ View interactive seat layouts
- ✅ Manage students with password authentication
- ✅ Monitor utilization and allocation metrics

### For Students:
- ✅ Simple email/password login
- ✅ View exam schedules and seat assignments
- ✅ Access profile management

### System Features:
- ✅ Collision group constraints prevent same department seating
- ✅ Multi-hall allocation distributes students optimally
- ✅ Real-time validation and error handling
- ✅ Professional UI with responsive design

## 🔍 Troubleshooting

### Common Issues:

1. **"Function does not exist" errors**
   - Make sure you ran the complete SQL file
   - Check that all functions were created successfully

2. **RLS policy errors**
   - Verify that RLS is enabled on all tables
   - Check that policies were created correctly

3. **Foreign key constraint errors**
   - Ensure all referenced tables exist
   - Check that foreign key relationships are correct

4. **Seat generation issues**
   - Verify that exam halls have `rows` and `columns` values
   - Check that seats were generated correctly

### Verification Queries:

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('hash_password', 'verify_student_password');

-- Check seat generation
SELECT h.name, COUNT(s.id) as seat_count 
FROM exam_halls h 
LEFT JOIN seats s ON h.id = s.hall_id 
GROUP BY h.id, h.name;
```

## 🎉 Ready to Use!

Once the database setup is complete, your ESAMS application will have all the advanced features:

- **Professional Exam Creation** with multi-select options
- **Intelligent Seat Allocation** with collision group constraints
- **Interactive Layout Visualization** with real-time stats
- **Student Authentication** with password management
- **Complete Database Integration** with proper relationships

The system is now ready for production use in educational institutions!
