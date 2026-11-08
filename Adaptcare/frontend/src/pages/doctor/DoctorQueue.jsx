import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doctorService } from '../../services/doctorService';
import { queueService } from '../../services/queueService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Users, Play, CheckCircle2, SkipForward, RefreshCw } from 'lucide-react';

export default function DoctorQueue() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    doctorService.getDoctorByUserId(user.userId || user.id)
      .then((res) => {
        const id = res.data?.data?.id;
        setDoctorId(id);
        if (id) fetchQueue(id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const fetchQueue = (dId) => {
    queueService.getQueueByDoctor(dId)
      .then((res) => {
        setQueue(res.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleStatusUpdate = async (queueId, status) => {
    setActionLoading(true);
    try {
      await queueService.updateQueueStatus(queueId, status);
      toast.success(`Patient marked as ${status}`);
      fetchQueue(doctorId);
    } catch (err) {
      toast.error('Failed to update patient queue status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!doctorId) {
      toast.error('Doctor profile not loaded yet');
      return;
    }
    try {
      await queueService.recalculateQueue(doctorId);
      toast.success('Queue wait times recalculated by Adaptive Engine');
      fetchQueue(doctorId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to recalculate queue');
    }
  };

  if (loading) return <LoadingSpinner text="Loading clinical queue..." />;

  const activePatient = queue.find((q) => q.status === 'IN_PROGRESS');
  const waitingPatients = queue.filter((q) => q.status === 'WAITING');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Consultation Queue</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage patient flow, call waiting tokens, and complete consultations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={RefreshCw} onClick={handleRecalculate}>
            Recalculate Queue
          </Button>
        </div>
      </div>

      {/* Active Consultation Spotlight */}
      {activePatient ? (
        <div className="bg-amber-500/10 border-2 border-amber-400 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-sm">
              #{activePatient.queueNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">CURRENT CONSULTATION</span>
                <Badge variant="warning">IN PROGRESS</Badge>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">{activePatient.patientName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Priority: {activePatient.priority} (1=Emergency) • Started at {activePatient.startedAt ? new Date(activePatient.startedAt).toLocaleTimeString() : 'Just now'}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            icon={CheckCircle2}
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={actionLoading}
            onClick={() => handleStatusUpdate(activePatient.id, 'COMPLETED')}
          >
            Finish Consultation
          </Button>
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-xs font-semibold text-gray-500">Consultation room is currently free.</p>
          {waitingPatients.length > 0 && (
            <p className="text-xs text-teal-700 mt-1">
              Next in line: <span className="font-bold">{waitingPatients[0].patientName} (Token #{waitingPatients[0].queueNumber})</span>
            </p>
          )}
        </div>
      )}

      {/* Waiting Queue List */}
      <Card title={`Patients Waiting (${waitingPatients.length})`}>
        {waitingPatients.length === 0 ? (
          <EmptyState
            title="Queue is empty"
            description="There are no more patients waiting in line for this session."
            icon={Users}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {waitingPatients.map((entry) => (
              <div key={entry.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 font-bold text-sm flex items-center justify-center">
                    #{entry.position}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{entry.patientName}</p>
                      <span className="text-xs text-gray-400">Token #{entry.queueNumber}</span>
                      {entry.priority === 1 && <Badge variant="danger" size="xs">Emergency</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Estimated Wait: <span className="font-semibold text-teal-700">{entry.estimatedWaitTime} min</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Play}
                    disabled={actionLoading || !!activePatient}
                    onClick={() => handleStatusUpdate(entry.id, 'IN_PROGRESS')}
                  >
                    Call Patient
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={SkipForward}
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate(entry.id, 'SKIPPED')}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
