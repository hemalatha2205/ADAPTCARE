import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { queueService } from '../../services/queueService';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Calendar, Users, Stethoscope, AlertTriangle, UserPlus, Clock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceptionistDashboard() {
  const [todayApps, setTodayApps] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState(null);

  const fetchData = () => {
    Promise.all([
      appointmentService.getTodayAppointments().catch(() => ({ data: { data: [] } })),
      doctorService.getActiveDoctors().catch(() => ({ data: { data: [] } })),
    ]).then(([appsRes, docRes]) => {
      setTodayApps(appsRes.data?.data || []);
      setDoctors(docRes.data?.data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (appointmentId) => {
    setCheckingInId(appointmentId);
    try {
      await queueService.checkIn(appointmentId);
      toast.success('Patient checked in and assigned live queue number!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check in patient');
    } finally {
      setCheckingInId(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading front desk operations..." />;

  const emergencies = todayApps.filter((a) => a.type === 'EMERGENCY');
  const waitingCount = todayApps.filter((a) => a.status === 'CONFIRMED' || a.status === 'SCHEDULED').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-teal-200 text-xs font-semibold tracking-wider uppercase">Front Desk Operations</span>
          <h1 className="text-2xl font-bold mt-1">Receptionist Desk</h1>
          <p className="text-teal-100 text-xs max-w-xl mt-1">
            Register arriving patients, book walk-in appointments, prioritize emergency intake, and monitor live clinic queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/receptionist/register-patient">
            <Button variant="secondary" icon={UserPlus} className="text-teal-900 font-semibold shadow-sm">
              New Patient
            </Button>
          </Link>
          <Link to="/receptionist/book">
            <Button variant="primary" icon={Calendar} className="bg-teal-600 hover:bg-teal-700">
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Appointments"
          value={todayApps.length}
          subtitle="All departments"
          icon={Calendar}
          color="teal"
        />
        <StatsCard
          title="Waiting Patients"
          value={waitingCount}
          subtitle="Pending consultation"
          icon={Users}
          color="amber"
        />
        <StatsCard
          title="Active Doctors On-Duty"
          value={doctors.length}
          subtitle="Consulting today"
          icon={Stethoscope}
          color="emerald"
        />
        <StatsCard
          title="Emergency Cases"
          value={emergencies.length}
          subtitle="High priority"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Today's Intake Table */}
      <Card
        title="Today's Patient Schedule"
        subtitle="Manage arriving and waiting patients"
        action={
          <Link to="/receptionist/queue">
            <Button size="sm" variant="outline" icon={Clock}>
              Department Queues
            </Button>
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Patient</th>
                <th className="pb-3">Doctor</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Time</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todayApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50">
                  <td className="py-3 font-semibold text-gray-900">{app.patientName}</td>
                  <td className="py-3 text-gray-700">{app.doctorName}</td>
                  <td className="py-3 text-gray-500">{app.departmentName}</td>
                  <td className="py-3 font-medium text-gray-800">{app.startTime}</td>
                  <td className="py-3">
                    <Badge variant={app.type === 'EMERGENCY' ? 'danger' : 'teal'}>{app.type}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={app.status === 'COMPLETED' ? 'success' : app.status === 'IN_PROGRESS' ? 'info' : 'warning'}>{app.status}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    {(app.status === 'CONFIRMED' || app.status === 'SCHEDULED') && (
                      <Button
                        size="xs"
                        variant="primary"
                        icon={UserCheck}
                        disabled={checkingInId === app.id}
                        onClick={() => handleCheckIn(app.id)}
                      >
                        {checkingInId === app.id ? 'Checking In...' : 'Check In'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
