import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { analyticsService } from '../../services/analyticsService';
import { adaptiveService } from '../../services/adaptiveService';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  Users,
  Stethoscope,
  Calendar,
  Clock,
  Cpu,
  AlertTriangle,
  Play,
  TrendingUp,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const fetchDashboard = () => {
    Promise.all([
      adminService.getDashboard().catch(() => ({ data: { data: null } })),
      adaptiveService.getHistory(0, 5).catch(() => ({ data: { data: { content: [] } } })),
    ]).then(([statsRes, eventsRes]) => {
      setStats(statsRes.data?.data || null);
      setRecentEvents(eventsRes.data?.data?.content || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await adaptiveService.evaluateAllRules();
      const events = res.data?.data || [];
      toast.success(`Adaptive evaluation complete! Executed ${events.length} dynamic adjustments.`);
      fetchDashboard();
    } catch (err) {
      toast.error('Evaluation cycle failed');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to ADAPTCARE operational cluster..." />;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-teal-300 text-xs font-semibold tracking-wider uppercase">Adaptive Intelligence Active</span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Hospital Operations & Intelligence</h1>
          <p className="text-gray-300 text-xs max-w-xl mt-1">
            Self-adaptive hospital monitoring continuously optimizes queues, reallocates unavailable doctor schedules, and balances clinical capacity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={Play}
            loading={evaluating}
            onClick={handleRunEvaluation}
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-sm"
          >
            Trigger Full Adaptive Evaluation
          </Button>
          <Link to="/admin/simulation">
            <Button variant="secondary" className="font-semibold text-gray-800">
              AI Simulation
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Registered Patients"
          value={stats?.totalPatients || 0}
          subtitle="Hospital registry"
          icon={Users}
          color="teal"
        />
        <StatsCard
          title="Medical Staff / Doctors"
          value={stats?.totalDoctors || 0}
          subtitle="All departments"
          icon={Stethoscope}
          color="blue"
        />
        <StatsCard
          title="Today's Appointments"
          value={stats?.todayAppointments || 0}
          subtitle="Active consultations"
          icon={Calendar}
          color="emerald"
        />
        <StatsCard
          title="Average Patient Wait"
          value={`${stats?.avgWaitTime || 0} min`}
          subtitle="Hospital-wide median"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Active Clinic Queues"
          value={stats?.activeQueues || 0}
          subtitle="Live department sessions"
          icon={Clock}
          color="purple"
        />
        <StatsCard
          title="Emergency Cases Today"
          value={stats?.emergencyCount || 0}
          subtitle="Priority 1 intake"
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Adaptive Actions Taken"
          value={stats?.adaptationCount || 0}
          subtitle="Automated adjustments today"
          icon={Cpu}
          color="teal"
        />
      </div>

      {/* Recent Adaptive Events Feed */}
      <Card
        title="Live Adaptive Intelligence Action Feed"
        subtitle="Autonomous schedule reallocations, emergency surges, and capacity balances recorded by the engine"
        action={
          <Link to="/admin/history" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            Complete Audit Log <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {recentEvents.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">No adaptive events recorded yet today. Click "Trigger Full Adaptive Evaluation" to run an evaluation cycle.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentEvents.map((event) => (
              <div key={event.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{event.ruleName}</span>
                      <Badge variant="teal" size="xs">{event.ruleId}</Badge>
                      <Badge variant={event.status === 'SUCCESS' ? 'success' : 'warning'} size="xs">
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-700 font-medium mt-1">{event.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5 italic">Trigger: {event.triggerCondition}</p>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Executed at: {event.executedAt ? new Date(event.executedAt).toLocaleTimeString() : 'Recently'} by {event.executedBy}
                    </div>
                  </div>
                </div>

                <Link to="/admin/history">
                  <Button size="sm" variant="ghost">Audit Log</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
