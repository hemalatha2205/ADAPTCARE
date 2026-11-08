import { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    notificationService.getNotifications()
      .then((res) => {
        const data = res.data?.data;
        const list = Array.isArray(data) ? data : (data?.content || []);
        setNotifications(list);
        setLoading(false);
      })
      .catch(() => {
        setNotifications([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  if (loading) return <LoadingSpinner text="Loading notifications..." />;

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications & Alerts</h1>
          <p className="text-xs text-gray-500 mt-0.5">Stay informed about appointment schedules, delays, and adaptive engine updates.</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" icon={CheckCheck} onClick={handleMarkAllAsRead}>
            Mark All Read
          </Button>
        )}
      </div>

      {safeNotifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="You will see automated alerts here when your appointments or queue estimates change."
          icon={Bell}
        />
      ) : (
        <div className="space-y-3">
          {safeNotifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 transition-all cursor-pointer ${
                !n.read ? 'border-teal-300 bg-teal-50/20 shadow-xs' : 'bg-white opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      !n.read ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                      </h4>
                      <Badge variant={!n.read ? 'teal' : 'neutral'} size="xs">
                        {n.type?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-2">
                      <Clock className="h-3 w-3" />
                      <span>{n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}</span>
                    </div>
                  </div>
                </div>

                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(n.id)}>
                    Mark Read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
