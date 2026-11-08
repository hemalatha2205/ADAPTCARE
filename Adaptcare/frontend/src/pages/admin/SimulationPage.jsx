import { useState } from 'react';
import { adaptiveService } from '../../services/adaptiveService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { BrainCircuit, Play, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SimulationPage() {
  const [selectedRule, setSelectedRule] = useState('RULE_EMERGENCY_SURGE');
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const simulationRules = [
    { id: 'RULE_EMERGENCY_SURGE', name: 'Emergency Surge Influx (Rule 1)', desc: 'Test mass-casualty triage and dynamic priority re-sequencing.' },
    { id: 'RULE_DOCTOR_UNAVAILABILITY', name: 'Physician Sudden Absence (Rule 2)', desc: 'Test peer doctor availability matching and appointment re-routing.' },
    { id: 'RULE_EXCESSIVE_WAIT_TIME', name: 'Wait-Time Backlog (Rule 3)', desc: 'Test threshold overflow detection and queue redistribution.' },
    { id: 'RULE_DEMAND_SURGE', name: 'Demand Surge Forecast (Rule 4)', desc: 'Test weekly velocity surge calculations and extra slot recommendations.' },
    { id: 'RULE_RESOURCE_SHORTAGE', name: 'Equipment Outage (Rule 5)', desc: 'Test clinical room substitution and double-allocation prevention.' },
    { id: 'RULE_FEEDBACK_ANALYSIS', name: 'Quality Friction Trend (Rule 6)', desc: 'Test 14-day patient sentiment aggregation and clinical quality alerts.' },
  ];

  const handleSimulate = async () => {
    setLoading(true);
    setSimResult(null);
    try {
      const res = await adaptiveService.simulateRule(selectedRule);
      setSimResult(res.data?.data);
      toast.success('Simulation executed in dry-run sandbox mode');
    } catch (err) {
      toast.error('Simulation execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Adaptive Intelligence Simulation Sandbox</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Execute dry-run simulations to inspect what adjustments the engine WOULD make without modifying actual patient records.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-blue-900 text-xs">
        <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" />
        <span>
          <span className="font-bold">Sandbox Isolation:</span> Simulations run in a non-destructive dry-run mode. Live patient bookings, queues, and clinical calendars remain untouched.
        </span>
      </div>

      <Card title="1. Select Adaptive Scenario to Simulate">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {simulationRules.map((rule) => (
            <button
              key={rule.id}
              type="button"
              onClick={() => setSelectedRule(rule.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedRule === rule.id
                  ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-xs font-bold text-gray-900 block">{rule.name}</span>
              <span className="text-[11px] text-gray-500 mt-1 block line-clamp-2">{rule.desc}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <Button icon={Play} loading={loading} onClick={handleSimulate}>
            Run Dry-Run Simulation
          </Button>
        </div>
      </Card>

      {/* Simulation Output */}
      {simResult && (
        <Card title="2. Projected Simulation Analysis">
          <div className="space-y-4 text-xs">
            <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Scenario Executed</span>
                <span className="font-bold text-gray-900 text-sm">{simResult.ruleId}</span>
              </div>
              <Badge variant="teal" size="md">DRY-RUN VERIFIED</Badge>
            </div>

            {simResult.reason && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Clinical Trigger Reason</span>
                  <p className="mt-1 text-gray-800 font-medium">{simResult.reason}</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Operational Constraints</span>
                  <p className="mt-1 text-gray-800 font-medium">{simResult.constraints}</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Expected Outcome</span>
                  <p className="mt-1 text-teal-800 font-semibold">{simResult.expectedOutcome}</p>
                </div>
              </div>
            )}

            {simResult.projectedActions && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Projected Autonomous Adjustments (Non-Mutating)
                </h4>
                <div className="space-y-2">
                  {simResult.projectedActions.map((action, i) => (
                    <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-800 font-medium">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Mutations executed: {simResult.mutationsExecuted ?? 0} (Live state untouched)</span>
              <span>Simulation telemetry validated at: {new Date(simResult.simulatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
