import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { queueService } from '../../services/queueService';
import { notificationService } from '../../services/notificationService';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Calendar, Clock, Bell, Plus, CheckCircle, ChevronRight, Building2 } from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [queueEntry, setQueueEntry] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appointmentService.getPatientAppointments().catch(() => ({ data: { data: [] } })),
      queueService.getPatientCurrentQueue().catch(() => ({ data: { data: null } })),
      notificationService.getUnreadCount().catch(() => ({ data: { data: { unreadCount: 0 } } })),
    ]).then(([appsRes, queueRes, notifRes]) => {
      setAppointments(appsRes.data?.data || []);
      setQueueEntry(queueRes.data?.data || null);
      setUnreadCount(notifRes.data?.data?.unreadCount || 0);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner text="Loading patient dashboard..." />;

  const upcoming = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-teal-200 text-xs font-semibold tracking-wider uppercase">Patient Portal</span>
          <h1 className="text-2xl font-bold mt-1">Hello, {user?.firstName} {user?.lastName}</h1>
          <p className="text-teal-100 text-xs max-w-xl mt-1">
            Real-time self-adaptive healthcare scheduling keeps wait times minimal and automatically responds to hospital conditions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/patient/directory">
            <Button variant="ghost" icon={Building2} className="text-white hover:bg-white/10">
              Hospital Directory
            </Button>
          </Link>
          <Link to="/patient/book">
            <Button variant="secondary" icon={Plus} className="text-teal-900 font-semibold shadow-sm">
              Book New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Upcoming Appointments"
          value={upcoming.length}
          subtitle="Scheduled visits"
          icon={Calendar}
          color="teal"
        />
        <StatsCard
          title="Active Queue Status"
          value={queueEntry ? `#${queueEntry.position}` : 'None'}
          subtitle={queueEntry ? `Queue No: ${queueEntry.queueNumber}` : 'Not in queue'}
          icon={Clock}
          color={queueEntry ? 'amber' : 'blue'}
        />
        <StatsCard
          title="Estimated Wait"
          value={queueEntry ? `${queueEntry.estimatedWaitTime} min` : '0 min'}
          subtitle="Real-time estimate"
          icon={CheckCircle}
          color="emerald"
        />
        <StatsCard
          title="Unread Alerts"
          value={unreadCount}
          subtitle="System & updates"
          icon={Bell}
          color="purple"
        />
      </div>

      {/* Live Queue Banner if in queue */}
      {queueEntry && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500 text-white font-bold text-xl flex items-center justify-center">
              #{queueEntry.position}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">You are in Live Queue</span>
                <Badge variant="warning">{queueEntry.status}</Badge>
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {queueEntry.doctorName} • {queueEntry.departmentName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Queue Number: <span className="font-bold text-gray-700">{queueEntry.queueNumber}</span> | Estimated Wait Time: <span className="font-bold text-teal-700">{queueEntry.estimatedWaitTime} minutes</span>
              </p>
            </div>
          </div>
          <Link to="/patient/queue">
            <Button size="sm" variant="outline">
              View Queue Details
            </Button>
          </Link>
        </div>
      )}

      {/* Upcoming Appointments List */}
      <Card
        title="Your Upcoming Appointments"
        subtitle="Manage scheduled visits with hospital doctors"
        action={
          <Link to="/patient/appointments" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            View All History <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming appointments"
            description="You don't have any appointments scheduled at the moment."
            action={
              <Link to="/patient/book">
                <Button size="sm" icon={Plus}>Book Your First Visit</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.slice(0, 4).map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                    {app.appointmentDate?.split('-')[2]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{app.doctorName}</p>
                      <Badge variant={app.type === 'EMERGENCY' ? 'danger' : 'teal'}>{app.type}</Badge>
                      <Badge variant={app.status === 'CONFIRMED' ? 'success' : 'neutral'}>{app.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {app.departmentName} • {app.appointmentDate} at {app.startTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/patient/appointments">
                    <Button size="sm" variant="ghost">Details</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
