'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Building2, 
  GraduationCap, 
  Settings, 
  BarChart3,
  Shield,
  UserCheck,
  LogOut,
  Menu,
  X,
  MapPin,
  BookOpen,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    current: false
  },
  {
    name: 'Departments',
    href: '/admin/departments',
    icon: Building2,
    current: false
  },
  {
    name: 'Students',
    href: '/admin/students',
    icon: GraduationCap,
    current: false
  },
  {
    name: 'User Management',
    href: '/admin/user-management',
    icon: Users,
    current: false
  },
  {
    name: 'Conflict Groups',
    href: '/admin/collision-groups',
    icon: AlertTriangle,
    current: false
  },
  {
    name: 'All Exams',
    href: '/admin/exams',
    icon: BookOpen,
    current: false
  },
  {
    name: 'Exam Halls',
    href: '/admin/halls',
    icon: MapPin,
    current: false
  },
  {
    name: 'Admin Management',
    href: '/admin/users',
    icon: Shield,
    current: false
  },
  {
    name: 'Student Credentials',
    href: '/admin/credentials',
    icon: UserCheck,
    current: false
  },
  {
    name: 'Login Attempts',
    href: '/admin/login-attempts',
    icon: BarChart3,
    current: false
  }
]

export function AdminSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const navigation = navigationItems.map(item => ({
    ...item,
    current: pathname === item.href
  }))

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay with blur */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out h-screen flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        {/* Logo and Header - Fixed at top */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-black">ESAMS</h1>
              <p className="text-sm text-gray-600">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable area */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                  item.current
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Section - Fixed at bottom */}
        <div className="px-4 py-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gray-100 text-black">
                {profile?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">
                {profile?.full_name || 'Administrator'}
              </p>
              <p className="text-xs text-gray-600 truncate">
                Role: Administrator
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.email || 'admin@esams.com'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-lg"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700 rounded-lg"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
