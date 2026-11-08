import { useState, useEffect } from 'react';
import { queueService } from '../../services/queueService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Clock, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QueueStatus() {
  const [queueEntry, setQueueEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueue = () => {
    setRefreshing(true);
    queueService.getPatientCurrentQueue()
      .then((res) => {
        setQueueEntry(res.data?.data || null);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchQueue();
    // Poll every 15 seconds as a reliable real-time fallback
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner text="Checking live hospital queue..." />;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Queue Tracking</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time dynamic waiting times updated by the Adaptive Engine.</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={RefreshCw}
          loading={refreshing}
          onClick={fetchQueue}
        >
          Refresh
        </Button>
      </div>

      {!queueEntry ? (
        <EmptyState
          title="You are not currently in a queue"
          description="You will automatically enter the live queue when you check in on the day of your confirmed appointment."
        />
      ) : (
        <Card className="text-center p-8 space-y-6">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-teal-50 text-teal-600 mb-1">
            <Clock className="h-8 w-8" />
          </div>

          <div>
            <Badge variant="teal" size="md">Queue Entry Active</Badge>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-3">
              Position #{queueEntry.position}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Token Number: <span className="font-bold text-gray-700">{queueEntry.queueNumber}</span>
            </p>
          </div>

          {/* Wait Time Highlight */}
          <div className="bg-teal-50/70 border border-teal-200/60 rounded-2xl p-6">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              Estimated Wait Time
            </span>
            <span className="text-4xl font-extrabold text-teal-700 block mt-1">
              {queueEntry.estimatedWaitTime} <span className="text-lg font-semibold">minutes</span>
            </span>
            <p className="text-[11px] text-teal-600 mt-2">
              Dynamically calculated based on doctor pace and active emergency priorities.
            </p>
          </div>

          {/* Doctor & Dept Info */}
          <div className="border-t border-gray-100 pt-5 text-left grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block uppercase font-semibold">Consulting Doctor</span>
              <span className="font-bold text-gray-800">{queueEntry.doctorName}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase font-semibold">Department</span>
              <span className="font-bold text-gray-800">{queueEntry.departmentName}</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 text-left flex items-start gap-2 text-xs text-amber-800 border border-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Please remain in the waiting area. When your token is called, your status will update to <span className="font-bold">IN PROGRESS</span>.
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
