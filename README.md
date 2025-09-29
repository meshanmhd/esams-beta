# ESAMS - Exam Seat Allocation Management System

A comprehensive system for managing exam seat allocations, student registrations, and real-time attendance tracking built with Next.js, Supabase, and shadcn/ui.

## Features

### 🔹 Frontend
- **React with TypeScript** - Modern, component-based, responsive UI
- **Next.js App Router** - Better routing, built-in API routes, SSR/ISR for performance
- **shadcn/ui + TailwindCSS** - Professional minimal design system with prebuilt accessible components
- **React Query (TanStack Query)** - Data fetching, caching, and smooth loading (no flickers)

### 🔹 Backend
- **Supabase** - Postgres database, authentication, and real-time features
- **Row Level Security (RLS)** - Secure data access with role-based permissions
- **Real-time subscriptions** - Live updates for seat allocations and attendance

### 🔹 Authentication & Authorization
- **Supabase Auth** - Secure user authentication
- **Role-based access** - Admin and Student roles with different permissions
- **Protected routes** - Automatic redirects based on authentication status

### 🔹 Core Functionality
- **Exam Management** - Create, schedule, and manage exams
- **Seat Allocation** - Automated seat assignment with conflict resolution
- **Student Registration** - Self-registration for exams
- **Attendance Tracking** - Real-time check-in/check-out system
- **Reports** - Generate attendance and allocation reports
- **PDF Generation** - Export seat allocation sheets

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query (TanStack Query)
- **UI Components**: shadcn/ui, Radix UI, Lucide React
- **PDF Generation**: pdf-lib
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd esams-beta
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up the Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script to create all tables, indexes, and RLS policies

### 5. Create an Admin User

After setting up the database, you'll need to create an admin user:

1. Sign up through the application as a regular user
2. Go to your Supabase dashboard > Authentication > Users
3. Find your user and note the UUID
4. Go to Table Editor > profiles
5. Update the `role` field from 'student' to 'admin' for your user

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard pages
│   ├── student/           # Student portal pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts (Auth, etc.)
├── lib/                  # Utility functions and configurations
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks

supabase/
└── schema.sql            # Database schema and setup
```

## Database Schema

The system uses the following main entities:

- **profiles** - User profiles (extends Supabase auth.users)
- **exam_halls** - Exam venues with capacity information
- **seats** - Individual seats within exam halls
- **exams** - Exam schedules and details
- **exam_registrations** - Student registrations for exams
- **seat_allocations** - Seat assignments for students
- **exam_attendance** - Attendance tracking and check-in/out

## Key Features

### Admin Features
- Create and manage exam halls
- Schedule exams with date, time, and venue
- Allocate seats to registered students
- View attendance reports
- Manage student profiles
- Export seat allocation sheets as PDF

### Student Features
- Register for available exams
- View assigned seats and exam details
- Check in/out for exams
- Update profile information

### Security
- Row Level Security (RLS) policies
- Role-based access control
- Secure authentication with Supabase Auth
- Protected API routes

## Deployment

### Vercel (Recommended)

This project is fully optimized for Vercel deployment. Follow these steps:

1. **Push your code to GitHub**
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js configuration

3. **Set Environment Variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
   NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
   NEXT_TELEMETRY_DISABLED=1
   ```

4. **Deploy!** - Vercel will automatically build and deploy your application

### Configuration Files

- `vercel.json` - Vercel deployment configuration
- `next.config.ts` - Next.js configuration optimized for Vercel
- `VERCEL_DEPLOYMENT.md` - Detailed deployment guide

### Features

- ✅ **Automatic deployments** on every push
- ✅ **Preview deployments** for pull requests  
- ✅ **Global CDN** for fast loading
- ✅ **Image optimization** built-in
- ✅ **Edge functions** support
- ✅ **Automatic HTTPS**
- ✅ **Security headers** configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.