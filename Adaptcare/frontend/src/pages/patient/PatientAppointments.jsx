import { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Calendar, Clock, X, Eye } from 'lucide-react';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAppointments = () => {
    setLoading(true);
    appointmentService.getPatientAppointments()
      .then((res) => {
        setAppointments(res.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await appointmentService.cancelAppointment(id);
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = appointments.filter((a) => {
    if (filter === 'UPCOMING') return a.status === 'CONFIRMED' || a.status === 'SCHEDULED';
    if (filter === 'COMPLETED') return a.status === 'COMPLETED';
    if (filter === 'CANCELLED') return a.status === 'CANCELLED';
    return true;
  });

  if (loading) return <LoadingSpinner text="Loading appointment history..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track, review, or cancel your hospital consultations.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start">
          {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === tab ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description={`You have no ${filter !== 'ALL' ? filter.toLowerCase() : ''} appointments recorded.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((app) => (
            <Card key={app.id} className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{app.doctorName}</h3>
                    <Badge variant={app.type === 'EMERGENCY' ? 'danger' : 'teal'}>{app.type}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{app.departmentName}</p>
                </div>
                <Badge
                  variant={
                    app.status === 'COMPLETED'
                      ? 'success'
                      : app.status === 'CANCELLED'
                      ? 'danger'
                      : app.status === 'CONFIRMED'
                      ? 'teal'
                      : 'warning'
                  }
                >
                  {app.status}
                </Badge>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Date & Time</span>
                  <span className="font-semibold text-gray-800">{app.appointmentDate} at {app.startTime}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Estimated Wait</span>
                  <span className="font-semibold text-teal-700">{app.estimatedWaitTime || 0} min</span>
                </div>
              </div>

              {app.reason && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                  <span className="font-semibold text-gray-700">Reason:</span> {app.reason}
                </div>
              )}

              {app.notes && (
                <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <span className="font-semibold">Adaptive Notice:</span> {app.notes}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button size="sm" variant="ghost" icon={Eye} onClick={() => setSelectedApp(app)}>
                  View Details
                </Button>
                {(app.status === 'CONFIRMED' || app.status === 'SCHEDULED') && (
                  <Button
                    size="sm"
                    variant="danger"
                    icon={X}
                    loading={cancellingId === app.id}
                    onClick={() => handleCancel(app.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Appointment Details">
        {selectedApp && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl">
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Physician</span>
                <span className="font-bold text-gray-900">{selectedApp.doctorName}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Department</span>
                <span className="font-bold text-gray-900">{selectedApp.departmentName}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Date & Time</span>
                <span className="font-bold text-gray-900">{selectedApp.appointmentDate} at {selectedApp.startTime}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Status</span>
                <Badge variant="teal">{selectedApp.status}</Badge>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Queue Number</span>
                <span className="font-bold text-teal-700">{selectedApp.queueNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Wait Time Estimate</span>
                <span className="font-bold text-teal-700">{selectedApp.estimatedWaitTime || 0} minutes</span>
              </div>
            </div>

            {selectedApp.reason && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Reason for Visit</h4>
                <p className="text-xs text-gray-600 bg-white p-3 border border-gray-200 rounded-lg">{selectedApp.reason}</p>
              </div>
            )}

            {selectedApp.notes && (
              <div>
                <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Adaptive Engine System Notes</h4>
                <p className="text-xs text-amber-900 bg-amber-50 p-3 border border-amber-200 rounded-lg">{selectedApp.notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
