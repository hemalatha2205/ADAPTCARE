import { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Calendar, Users, Clock, Cpu, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [trends, setTrends] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getDashboard().catch(() => ({ data: { data: null } })),
      analyticsService.getAppointmentTrends(days).catch(() => ({ data: { data: { trends: [] } } })),
      analyticsService.getDepartmentWorkload(days).catch(() => ({ data: { data: [] } })),
    ]).then(([dashRes, trendsRes, workRes]) => {
      setDashboard(dashRes.data?.data || null);
      setTrends(trendsRes.data?.data?.trends || []);
      setWorkload(workRes.data?.data || []);
      setLoading(false);
    });
  }, [days]);

  if (loading) return <LoadingSpinner text="Aggregating clinical analytics..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hospital Operational Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Historical booking velocity, department workload distribution, and adaptive telemetry.</p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                days === d ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Patients"
          value={dashboard?.totalPatients || 0}
          subtitle="Registered population"
          icon={Users}
          color="teal"
        />
        <StatsCard
          title="Appointments Today"
          value={dashboard?.todayAppointments || 0}
          subtitle="Daily volume"
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Mean Wait Time"
          value={`${dashboard?.avgWaitTime || 0}m`}
          subtitle="Hospital-wide"
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Engine Adaptations"
          value={dashboard?.adaptationCount || 0}
          subtitle="Automated adjustments"
          icon={Cpu}
          color="emerald"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Trends */}
        <Card title={`Appointment Booking Velocity (Last ${days} Days)`}>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#tealGrad)" name="Appointments" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Workload */}
        <Card title="Department Patient Intake Distribution">
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="departmentName" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="appointmentCount" fill="#0d9488" radius={[4, 4, 0, 0]} name="Patient Consults" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
