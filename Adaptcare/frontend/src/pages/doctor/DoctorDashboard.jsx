import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Calendar, Users, Clock, CheckCircle2, Sliders, ChevronRight } from 'lucide-react';
import { formatDoctorName } from '../../utils/formatters';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [todayApps, setTodayApps] = useState([]);
  const [upcomingApps, setUpcomingApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    doctorService.getDoctorByUserId(user.userId || user.id)
      .then((docRes) => {
        const doc = docRes.data?.data;
        setDoctorProfile(doc);

        if (doc) {
          const today = new Date().toISOString().split('T')[0];
          return Promise.all([
            doctorService.getDoctorDashboard(doc.id).catch(() => ({ data: { data: null } })),
            appointmentService.getDoctorAppointments(doc.id, today).catch(() => ({ data: { data: [] } })),
            appointmentService.getDoctorAppointments(doc.id).catch(() => ({ data: { data: [] } })),
          ]);
        }
        return Promise.resolve([null, null, null]);
      })
      .then(([dashRes, appsRes, allAppsRes]) => {
        if (dashRes) setDashboardStats(dashRes.data?.data);
        if (appsRes) setTodayApps(appsRes.data?.data || []);
        if (allAppsRes) {
          const today = new Date().toISOString().split('T')[0];
          const future = (allAppsRes.data?.data || []).filter((a) => a.appointmentDate > today && a.status !== 'CANCELLED');
          setUpcomingApps(future);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner text="Loading physician operations dashboard..." />;

  const waitingPatients = todayApps.filter((a) => a.status === 'CONFIRMED' || a.status === 'SCHEDULED');
  const inProgressPatient = todayApps.find((a) => a.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-teal-200 text-xs font-semibold tracking-wider uppercase">Physician Portal</span>
          <h1 className="text-2xl font-bold mt-1">{formatDoctorName(user?.firstName, user?.lastName)}</h1>
          <p className="text-teal-100 text-xs max-w-xl mt-1">
            {doctorProfile?.specialization} • Department of {doctorProfile?.departmentName || 'Medicine'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/doctor/queue">
            <Button variant="secondary" icon={Clock} className="text-teal-900 font-semibold shadow-sm">
              Open Live Queue
            </Button>
          </Link>
          <Link to="/doctor/availability">
            <Button variant="ghost" icon={Sliders} className="text-white hover:bg-white/10">
              Availability
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Total Patients"
          value={todayApps.length}
          subtitle="Scheduled slots"
          icon={Calendar}
          color="teal"
        />
        <StatsCard
          title="Currently Waiting"
          value={waitingPatients.length}
          subtitle="In clinical queue"
          icon={Users}
          color="amber"
        />
        <StatsCard
          title="In Consultation"
          value={inProgressPatient ? '1 Active' : 'None'}
          subtitle={inProgressPatient ? inProgressPatient.patientName : 'Room free'}
          icon={Clock}
          color="blue"
        />
        <StatsCard
          title="Completed Consults"
          value={todayApps.filter((a) => a.status === 'COMPLETED').length}
          subtitle="Done today"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Today's Schedule Overview */}
      <Card
        title="Today's Consultation Schedule"
        subtitle="Manage patient appointments and consultation progression"
        action={
          <Link to="/doctor/appointments" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            View Full Schedule <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {todayApps.length === 0 ? (
          <EmptyState
            title="No appointments scheduled today"
            description="You have no patient consultations on today's calendar."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {todayApps.slice(0, 5).map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                    {app.startTime?.slice(0, 5)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{app.patientName}</p>
                      <Badge variant={app.type === 'EMERGENCY' ? 'danger' : 'teal'}>{app.type}</Badge>
                      <Badge variant={app.status === 'COMPLETED' ? 'success' : app.status === 'IN_PROGRESS' ? 'warning' : 'neutral'}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Queue Token #{app.queueNumber || '-'} • Priority: {app.priority}
                      {app.reason && ` • "${app.reason}"`}
                    </p>
                  </div>
                </div>

                <Link to="/doctor/queue">
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Scheduled Consultations (e.g. Tomorrow / Next Days) */}
      <Card
        title="Upcoming Scheduled Consultations"
        subtitle="Future appointments booked by patients across upcoming clinical dates"
        action={
          <Link to="/doctor/appointments" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            Open Appointments Calendar <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {upcomingApps.length === 0 ? (
          <EmptyState
            title="No upcoming future appointments"
            description="Patients who book future consultations with you will appear here."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingApps.slice(0, 5).map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-16 rounded-xl bg-teal-50 text-teal-800 flex flex-col items-center justify-center font-bold text-[11px] leading-tight">
                    <span>{app.appointmentDate?.slice(5)}</span>
                    <span className="text-teal-600 text-[10px]">{app.startTime?.slice(0, 5)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{app.patientName}</p>
                      <Badge variant={app.type === 'EMERGENCY' ? 'danger' : 'teal'}>{app.type}</Badge>
                      <Badge variant="neutral">{app.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Date: {app.appointmentDate} • Start Time: {app.startTime}
                      {app.reason && ` • "${app.reason}"`}
                    </p>
                  </div>
                </div>

                <Link to="/doctor/appointments">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
