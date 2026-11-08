import { useState, useEffect } from 'react';
import { departmentService } from '../../services/departmentService';
import { queueService } from '../../services/queueService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Clock, Play, CheckCircle2, RefreshCw, Users, AlertTriangle } from 'lucide-react';

export default function QueueManagement() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    departmentService.getActiveDepartments()
      .then((res) => {
        const depts = res.data?.data || [];
        setDepartments(depts);
        if (depts.length > 0) {
          setSelectedDept(depts[0].id);
          fetchQueue(depts[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchQueue = (deptId) => {
    queueService.getQueueByDepartment(deptId)
      .then((res) => {
        setQueue(res.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    setLoading(true);
    fetchQueue(deptId);
  };

  const handleStatusChange = async (queueId, status) => {
    try {
      await queueService.updateQueueStatus(queueId, status);
      toast.success(`Queue token updated to ${status}`);
      fetchQueue(selectedDept);
    } catch (err) {
      toast.error('Failed to update token status');
    }
  };

  if (loading && departments.length === 0) return <LoadingSpinner text="Loading department queues..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hospital Department Queue Monitor</h1>
          <p className="text-xs text-gray-500 mt-0.5">Live token sequencing, estimated delays, and triage priority overrides.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => handleDeptChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-teal-500"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name} Department</option>
            ))}
          </select>
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => fetchQueue(selectedDept)}>
            Refresh
          </Button>
        </div>
      </div>

      <Card title={`Live Queue for Department (${queue.length} Active Tokens)`}>
        {queue.length === 0 ? (
          <EmptyState
            title="Department queue is clear"
            description="No active patients waiting in line for this department today."
            icon={Users}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Pos</th>
                  <th className="pb-3">Token</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Physician</th>
                  <th className="pb-3">Wait Time</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {queue.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-bold text-gray-900">#{entry.position}</td>
                    <td className="py-3 font-semibold text-teal-700">Token {entry.queueNumber}</td>
                    <td className="py-3 font-medium text-gray-900">{entry.patientName}</td>
                    <td className="py-3 text-gray-600">{entry.doctorName}</td>
                    <td className="py-3 font-semibold text-amber-700">{entry.estimatedWaitTime} min</td>
                    <td className="py-3">
                      {entry.priority === 1 ? (
                        <Badge variant="danger" size="xs">Emergency (1)</Badge>
                      ) : (
                        <Badge variant="neutral" size="xs">Standard ({entry.priority})</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <Badge variant={entry.status === 'IN_PROGRESS' ? 'warning' : 'teal'}>
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      {entry.status === 'WAITING' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Play}
                          onClick={() => handleStatusChange(entry.id, 'IN_PROGRESS')}
                        >
                          Admit
                        </Button>
                      )}
                      {entry.status === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={CheckCircle2}
                          className="text-emerald-600"
                          onClick={() => handleStatusChange(entry.id, 'COMPLETED')}
                        >
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
