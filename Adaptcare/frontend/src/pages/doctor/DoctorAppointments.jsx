import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Calendar, Play, CheckCircle2 } from 'lucide-react';

export default function DoctorAppointments() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'TODAY', 'TOMORROW', 'CUSTOM'
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    doctorService.getDoctorByUserId(user.userId || user.id)
      .then((res) => {
        const id = res.data?.data?.id;
        setDoctorId(id);
        if (id) {
          fetchAppointments(id, null); // Default load all upcoming
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [user]);

  const fetchAppointments = (dId, date) => {
    setLoading(true);
    appointmentService.getDoctorAppointments(dId, date)
      .then((res) => {
        setAppointments(res.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const selectFilter = (tab) => {
    setActiveTab(tab);
    if (!doctorId) return;
    if (tab === 'ALL') {
      fetchAppointments(doctorId, null);
    } else if (tab === 'TODAY') {
      setSelectedDate(todayStr);
      fetchAppointments(doctorId, todayStr);
    } else if (tab === 'TOMORROW') {
      setSelectedDate(tomorrowStr);
      fetchAppointments(doctorId, tomorrowStr);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setActiveTab('CUSTOM');
    if (doctorId) fetchAppointments(doctorId, newDate);
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await appointmentService.updateStatus(appId, newStatus);
      toast.success(`Appointment status updated to ${newStatus}`);
      const dateToFetch = activeTab === 'ALL' ? null : selectedDate;
      fetchAppointments(doctorId, dateToFetch);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner text="Loading doctor appointment calendar..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assigned Patient Appointments</h1>
          <p className="text-xs text-gray-500 mt-0.5">Filter appointments by day, view upcoming consultations, and update clinical encounter statuses.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
            <button
              onClick={() => selectFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'ALL' ? 'bg-white text-teal-700 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Upcoming
            </button>
            <button
              onClick={() => selectFilter('TODAY')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'TODAY' ? 'bg-white text-teal-700 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => selectFilter('TOMORROW')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'TOMORROW' ? 'bg-white text-teal-700 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tomorrow (Oct 30)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          title={activeTab === 'ALL' ? 'No appointments found' : `No appointments on ${selectedDate}`}
          description="There are no patients scheduled for consultation in this view."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((app) => (
            <Card key={app.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{app.patientName}</h3>
                    <Badge variant={app.type === 'EMERGENCY' ? 'danger' : 'teal'}>{app.type}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{app.patientEmail}</p>
                </div>
                <Badge
                  variant={
                    app.status === 'COMPLETED'
                      ? 'success'
                      : app.status === 'IN_PROGRESS'
                      ? 'warning'
                      : app.status === 'CONFIRMED'
                      ? 'teal'
                      : 'neutral'
                  }
                >
                  {app.status}
                </Badge>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Date</span>
                  <span className="font-semibold text-gray-800">{app.appointmentDate}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Time</span>
                  <span className="font-semibold text-gray-800">{app.startTime}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Token</span>
                  <span className="font-semibold text-teal-700">#{app.queueNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Priority</span>
                  <span className="font-semibold text-gray-800">{app.priority}</span>
                </div>
              </div>

              {app.reason && (
                <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg">
                  <span className="font-semibold text-gray-700">Chief Complaint:</span> {app.reason}
                </div>
              )}

              {app.notes && (
                <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <span className="font-semibold">Notice:</span> {app.notes}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                {app.status === 'CONFIRMED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Play}
                    onClick={() => handleStatusChange(app.id, 'IN_PROGRESS')}
                  >
                    Start Visit
                  </Button>
                )}
                {app.status === 'IN_PROGRESS' && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={CheckCircle2}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                  >
                    Complete Visit
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
