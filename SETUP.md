# ESAMS Setup Guide

This guide will walk you through setting up the ESAMS (Exam Seat Allocation Management System) project from scratch.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier available)
- Git (for version control)

## Step 1: Project Setup

The project is already initialized with all necessary dependencies. If you need to install dependencies:

```bash
npm install
```

## Step 2: Supabase Configuration

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `esams-beta`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
5. Click "Create new project"

### 2.2 Get Your Supabase Credentials

1. Go to your project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service role key (keep this secret!)

### 2.3 Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Never commit the `.env.local` file to version control!

## Step 3: Database Setup

### 3.1 Run the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click "New Query"
4. Copy the entire contents of `supabase/schema.sql`
5. Paste it into the SQL editor
6. Click "Run" to execute the script

This will create:
- All necessary tables (profiles, exam_halls, seats, exams, etc.)
- Row Level Security (RLS) policies
- Database functions and triggers
- Indexes for performance

### 3.2 Verify Database Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `profiles`
   - `exam_halls`
   - `seats`
   - `exams`
   - `exam_registrations`
   - `seat_allocations`
   - `exam_attendance`

## Step 4: Create Your First Admin User

### 4.1 Sign Up as a Regular User

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000)
3. Click "Sign Up"
4. Create an account with your email and password
5. Complete the signup process

### 4.2 Promote to Admin

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Users**
3. Find your user account and note the **User UID**
4. Go to **Table Editor** → **profiles**
5. Find your profile record
6. Edit the `role` field and change it from `'student'` to `'admin'`
7. Save the changes

## Step 5: Test the Application

### 5.1 Start the Development Server

```bash
npm run dev
```

### 5.2 Test Authentication

1. Go to [http://localhost:3000](http://localhost:3000)
2. Sign in with your admin account
3. You should see the admin dashboard with options to:
   - Manage Exams
   - Seat Allocation
   - Student Management
   - Exam Halls
   - Reports

### 5.3 Create Test Data

1. **Create an Exam Hall**:
   - Go to "Manage Halls" (you'll need to implement this page)
   - Add a hall with capacity information

2. **Create an Exam**:
   - Go to "Manage Exams"
   - Click "Create Exam"
   - Fill in exam details

3. **Add Students**:
   - Create additional user accounts for testing
   - These will automatically be created as students

## Step 6: MCP Server Setup (Optional)

The MCP (Model Context Protocol) server allows AI tools to interact with your ESAMS data.

### 6.1 Set Up MCP Server

```bash
cd mcp-server
npm install
```

### 6.2 Configure MCP Server Environment

Create `mcp-server/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 6.3 Build and Run MCP Server

```bash
npm run build
npm start
```

## Step 7: Testing

### 7.1 Run Tests

```bash
npm test
```

### 7.2 Run Tests with Coverage

```bash
npm run test:coverage
```

## Step 8: Deployment

### 8.1 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your production URL)
5. Deploy!

### 8.2 Update Supabase Settings

1. Go to your Supabase project settings
2. Update **Authentication** → **URL Configuration**:
   - Site URL: Your production URL
   - Redirect URLs: Add your production URL + `/auth/callback`

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**:
   - Check your environment variables
   - Ensure you're using the correct Supabase URL and keys

2. **Database connection issues**:
   - Verify your Supabase project is active
   - Check if the database schema was applied correctly

3. **Authentication not working**:
   - Ensure RLS policies are enabled
   - Check if the `handle_new_user` function is working

4. **Build errors**:
   - Run `npm install` to ensure all dependencies are installed
   - Check for TypeScript errors with `npm run build`

### Getting Help

1. Check the browser console for errors
2. Check the Supabase logs in your dashboard
3. Review the application logs in your terminal
4. Open an issue in the repository

## Next Steps

After setup, you can:

1. **Customize the UI**: Modify components in `src/components/`
2. **Add Features**: Implement additional functionality in `src/app/`
3. **Extend Database**: Add new tables or modify existing ones
4. **Integrate AI**: Use the MCP server with AI tools
5. **Add Tests**: Write comprehensive tests for your features

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to version control
2. **RLS Policies**: Review and test all Row Level Security policies
3. **API Keys**: Use service role key only on the server side
4. **Authentication**: Regularly review user permissions and roles
5. **Database**: Regularly backup your Supabase database

## Support

For additional help:
- Check the [README.md](./README.md) for project overview
- Review the [Supabase documentation](https://supabase.com/docs)
- Check the [Next.js documentation](https://nextjs.org/docs)
- Open an issue in the repository
