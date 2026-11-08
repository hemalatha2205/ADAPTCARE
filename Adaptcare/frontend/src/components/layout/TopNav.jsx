import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { sseService } from '../../services/sseService';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TopNav() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread count
    notificationService.getUnreadCount()
      .then((res) => {
        if (res.data?.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.data.unreadCount);
        }
      })
      .catch(() => {});

    // Subscribe to SSE for live notifications
    const token = localStorage.getItem('token');
    const sse = sseService.subscribe(token, (eventType, data) => {
      if (eventType === 'NOTIFICATION') {
        setUnreadCount((prev) => prev + 1);
        toast(data.title + ': ' + data.message, { icon: '🔔' });
      }
    });

    return () => {
      if (sse) sse.close();
    };
  }, [user]);

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-800">
          Welcome back, <span className="text-teal-700">{user.firstName} {user.lastName}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications badge */}
        <div className="relative">
          <div className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
            <Bell className="h-4 w-4" />
          </div>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        {/* User initials pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 font-semibold text-xs flex items-center justify-center">
            {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 leading-none">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-gray-400 capitalize mt-0.5">{user.role?.toLowerCase()}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
