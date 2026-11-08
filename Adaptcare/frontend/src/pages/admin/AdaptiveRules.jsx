import { useState, useEffect } from 'react';
import { adaptiveService } from '../../services/adaptiveService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Sliders, Edit2, Check, Clock } from 'lucide-react';

export default function AdaptiveRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchRules = () => {
    setLoading(true);
    adaptiveService.getRules()
      .then((res) => {
        setRules(res.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (rule) => {
    try {
      await adaptiveService.updateRule(rule.id, {
        ...rule,
        enabled: !rule.enabled,
      });
      toast.success(`Rule ${rule.name} ${!rule.enabled ? 'Enabled' : 'Disabled'}`);
      fetchRules();
    } catch (err) {
      toast.error('Failed to toggle rule state');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adaptiveService.updateRule(editingRule.id, editingRule);
      toast.success('Adaptive rule configuration saved successfully');
      setEditingRule(null);
      fetchRules();
    } catch (err) {
      toast.error('Failed to save rule settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading adaptive rules..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Adaptive Intelligence Rule Directory</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Tune operational thresholds, cooldown intervals, and automated scheduling heuristics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="relative flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.enabled ? 'teal' : 'neutral'} size="xs">{rule.category}</Badge>
                    <span className="text-[10px] text-gray-400 font-mono">{rule.ruleId}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-1.5">{rule.name}</h3>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggle(rule)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{rule.description}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs bg-gray-50/70 p-3 rounded-xl">
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Threshold</span>
                  <span className="font-bold text-teal-800">{rule.thresholdValue} {rule.thresholdUnit}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Cooldown</span>
                  <span className="font-bold text-gray-800">{rule.cooldownMinutes} min</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase">Priority</span>
                  <span className="font-bold text-gray-800">Rank #{rule.priority}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-400">
                Last Triggered: {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleString() : 'Never'}
              </span>
              <Button size="sm" variant="ghost" icon={Edit2} onClick={() => setEditingRule(rule)}>
                Edit Threshold
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editingRule} onClose={() => setEditingRule(null)} title="Configure Adaptive Rule">
        {editingRule && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Rule Name
              </label>
              <input
                type="text"
                disabled
                value={editingRule.name}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Threshold Value ({editingRule.thresholdUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editingRule.thresholdValue}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, thresholdValue: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Cooldown Interval (Minutes)
                </label>
                <input
                  type="number"
                  required
                  value={editingRule.cooldownMinutes}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, cooldownMinutes: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
