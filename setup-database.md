# Database Setup Instructions

## Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Schema**
   - Copy the entire contents of `supabase/schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the schema

## Option 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Run the migration**
   ```bash
   supabase db push
   ```

## Option 3: Using psql (if you have direct database access)

1. **Connect to your database**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

2. **Run the schema file**
   ```bash
   \i supabase/schema.sql
   ```

## Verification

After running the schema, you can verify the tables were created by running this query in the SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- classrooms
- collision_group_departments
- collision_groups
- departments
- exam_attendance
- exam_departments
- exam_halls
- exam_registrations
- exams
- profiles
- seat_allocations
- seats

## Environment Variables

Make sure you have these environment variables set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Next Steps

1. Run the database schema using one of the methods above
2. Start your development server: `npm run dev`
3. Create your first admin user by signing up and then manually updating the role in the database
4. Start using the ESAMS system!

## Creating an Admin User

After setting up the database, you'll need to create an admin user:

1. Sign up through the application (this will create a student profile)
2. Go to the Supabase dashboard → Table Editor → profiles
3. Find your user and change the `role` from 'student' to 'admin'
4. Now you can access the admin panel!
