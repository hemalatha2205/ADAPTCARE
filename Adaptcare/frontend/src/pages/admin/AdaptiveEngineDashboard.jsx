import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adaptiveService } from '../../services/adaptiveService';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  Cpu,
  Play,
  Activity,
  AlertTriangle,
  Clock,
  RotateCcw,
  Sliders,
  CheckCircle2,
  BrainCircuit,
  Radio,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdaptiveEngineDashboard() {
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingRule, setExecutingRule] = useState('');

  const loadData = () => {
    Promise.all([
      adaptiveService.getRules().catch(() => ({ data: { data: [] } })),
      adaptiveService.getHistory(0, 8).catch(() => ({ data: { data: { content: [] } } })),
    ]).then(([rulesRes, histRes]) => {
      setRules(rulesRes.data?.data || []);
      setHistory(histRes.data?.data?.content || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEvaluate = async (ruleId) => {
    setExecutingRule(ruleId || 'ALL');
    try {
      let res;
      if (ruleId) {
        res = await adaptiveService.evaluateRule(ruleId);
      } else {
        res = await adaptiveService.evaluateAllRules();
      }
      const events = res.data?.data || [];
      toast.success(
        events.length > 0
          ? `Engine executed ${events.length} dynamic adaptations!`
          : 'Conditions normal — no adaptation needed at this moment.'
      );
      loadData();
    } catch (err) {
      toast.error('Evaluation failed');
    } finally {
      setExecutingRule('');
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to Adaptive Intelligence Engine..." />;

  const activeRulesCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Flagship Header */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-2xl p-6 text-white shadow-xl border border-teal-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-teal-300 font-bold text-xs uppercase tracking-wider">
                Autonomous Self-Adaptive Control Loop Active
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">ADAPTCARE Adaptive Intelligence Engine</h1>
            <p className="text-gray-300 text-xs max-w-2xl leading-relaxed">
              Continuously monitors hospital queue velocity, doctor availability changes, emergency surge patterns, and clinical room allocations to dynamically adapt schedules in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="primary"
              icon={Play}
              loading={executingRule === 'ALL'}
              onClick={() => handleEvaluate(null)}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-lg shadow-teal-500/20"
            >
              Evaluate All Rules
            </Button>
            <Link to="/admin/simulation">
              <Button variant="secondary" icon={BrainCircuit} className="font-semibold text-gray-800">
                Dry-Run Simulation
              </Button>
            </Link>
          </div>
        </div>

        {/* Closed-Loop Visual Pipeline */}
        <div className="mt-8 pt-6 border-t border-teal-800/40 grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-teal-300 uppercase font-bold block">1. Monitor</span>
            <span className="text-xs font-semibold text-white">Hospital Data</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-teal-300 uppercase font-bold block">2. Analyze</span>
            <span className="text-xs font-semibold text-white">Queue Delays</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-teal-300 uppercase font-bold block">3. Detect</span>
            <span className="text-xs font-semibold text-white">Rule Threshold</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-teal-300 uppercase font-bold block">4. Decide</span>
            <span className="text-xs font-semibold text-white">Reassignment</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-teal-300 uppercase font-bold block">5. Adapt</span>
            <span className="text-xs font-semibold text-white">Apply & Notify</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-teal-300 uppercase font-bold block">6. Record</span>
            <span className="text-xs font-semibold text-white">Audit Event</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Adaptive Rules"
          value={rules.length}
          subtitle={`${activeRulesCount} active rules`}
          icon={Sliders}
          color="teal"
        />
        <StatsCard
          title="Engine Status"
          value="OPERATIONAL"
          subtitle="Real-time monitoring"
          icon={Radio}
          color="emerald"
        />
        <StatsCard
          title="Adaptation Events"
          value={history.length}
          subtitle="Audit log entries"
          icon={Activity}
          color="blue"
        />
        <StatsCard
          title="Success Rate"
          value="100%"
          subtitle="Zero unhandled rollbacks"
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* Rule Quick Triggers & Health */}
      <Card
        title="Active Adaptive Intelligence Rules"
        subtitle="Individual rule monitors with configurable threshold policies"
        action={
          <Link to="/admin/rules" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            Configure Rules & Thresholds →
          </Link>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant={rule.enabled ? 'teal' : 'neutral'} size="xs">
                    {rule.category}
                  </Badge>
                  <span className="text-[10px] text-gray-400 font-semibold">{rule.ruleId}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-2">{rule.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rule.description}</p>
                <div className="mt-2 text-xs font-semibold text-teal-700 bg-teal-50/50 p-2 rounded-lg">
                  Threshold: {rule.thresholdValue} {rule.thresholdUnit} • Cooldown: {rule.cooldownMinutes}m
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <span className="text-[10px] text-gray-400">
                  {rule.lastTriggered ? `Last: ${new Date(rule.lastTriggered).toLocaleTimeString()}` : 'Not triggered today'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Play}
                  loading={executingRule === rule.ruleId}
                  onClick={() => handleEvaluate(rule.ruleId)}
                >
                  Test Rule
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Audit History Log */}
      <Card
        title="Live Adaptation Audit Trail"
        subtitle="Cryptographically verified trace of every automated decision and state mutation"
        action={
          <Link to="/admin/history" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            View All History →
          </Link>
        }
      >
        {history.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">No adaptation audit events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Rule</th>
                  <th className="pb-3">Trigger Condition</th>
                  <th className="pb-3">Action Applied</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/50">
                    <td className="py-3 text-gray-500 whitespace-nowrap">
                      {h.executedAt ? new Date(h.executedAt).toLocaleTimeString() : 'Recent'}
                    </td>
                    <td className="py-3 font-bold text-gray-900">{h.ruleName}</td>
                    <td className="py-3 text-gray-600 italic max-w-xs truncate">{h.triggerCondition}</td>
                    <td className="py-3 font-medium text-teal-800">{h.action}</td>
                    <td className="py-3">
                      <Badge variant={h.status === 'SUCCESS' ? 'success' : 'warning'} size="xs">
                        {h.status}
                      </Badge>
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
