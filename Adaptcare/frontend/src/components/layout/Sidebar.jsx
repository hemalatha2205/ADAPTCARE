import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Bell,
  MessageSquare,
  User,
  Users,
  Stethoscope,
  Building2,
  Box,
  Cpu,
  History,
  TrendingUp,
  BrainCircuit,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = {
    PATIENT: [
      { name: 'Dashboard', path: '/patient', icon: LayoutDashboard },
      { name: 'Hospital Directory', path: '/patient/directory', icon: Building2 },
      { name: 'Book Appointment', path: '/patient/book', icon: Calendar },
      { name: 'My Appointments', path: '/patient/appointments', icon: Clock },
      { name: 'Live Queue', path: '/patient/queue', icon: CheckCircle2 },
      { name: 'Notifications', path: '/patient/notifications', icon: Bell },
      { name: 'Feedback', path: '/patient/feedback', icon: MessageSquare },
      { name: 'My Profile', path: '/patient/profile', icon: User },
    ],
    DOCTOR: [
      { name: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
      { name: 'Today Schedule', path: '/doctor/appointments', icon: Calendar },
      { name: 'Live Queue', path: '/doctor/queue', icon: Clock },
      { name: 'My Availability', path: '/doctor/availability', icon: Sliders },
    ],
    RECEPTIONIST: [
      { name: 'Dashboard', path: '/receptionist', icon: LayoutDashboard },
      { name: 'Register Patient', path: '/receptionist/register-patient', icon: User },
      { name: 'Book Appointment', path: '/receptionist/book', icon: Calendar },
      { name: 'Queue Management', path: '/receptionist/queue', icon: Clock },
    ],
    ADMIN: [
      { name: 'Operations Overview', path: '/admin', icon: LayoutDashboard },
      { name: 'Adaptive Engine', path: '/admin/adaptive', icon: Cpu },
      { name: 'Adaptive Rules', path: '/admin/rules', icon: Sliders },
      { name: 'Adaptation History', path: '/admin/history', icon: History },
      { name: 'AI Simulation', path: '/admin/simulation', icon: BrainCircuit },
      { name: 'ML Predictions', path: '/admin/predictions', icon: TrendingUp },
      { name: 'Analytics & Trends', path: '/admin/analytics', icon: TrendingUp },
      { name: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
      { name: 'Departments', path: '/admin/departments', icon: Building2 },
      { name: 'Resources', path: '/admin/resources', icon: Box },
      { name: 'User Management', path: '/admin/users', icon: Users },
    ],
  };

  const links = navItems[role] || [];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-teal-500/20">
          +
        </div>
        <div>
          <span className="font-bold text-gray-900 tracking-tight text-base block leading-none">ADAPTCARE</span>
          <span className="text-[10px] text-teal-600 font-semibold tracking-wider uppercase block mt-1">Self-Adaptive Health</span>
        </div>
      </div>

      {/* Role Indicator */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
        <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Current Workspace</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-semibold text-gray-700 capitalize">{role.toLowerCase()} Portal</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {links.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/patient' || item.path === '/doctor' || item.path === '/receptionist' || item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-100 text-xs text-gray-400">
        <p className="font-medium text-gray-600">ADAPTCARE v1.0</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Adaptive Engine Active</p>
      </div>
    </aside>
  );
}
