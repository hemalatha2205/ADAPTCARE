import { useState, useEffect } from 'react';
import { resourceService } from '../../services/resourceService';
import { departmentService } from '../../services/departmentService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Box, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'ROOM',
    departmentId: '',
    location: '',
    description: '',
  });

  const fetchResources = () => {
    setLoading(true);
    Promise.all([
      resourceService.getAllResources().catch(() => ({ data: { data: [] } })),
      departmentService.getActiveDepartments().catch(() => ({ data: { data: [] } })),
    ]).then(([resRes, deptRes]) => {
      setResources(resRes.data?.data || []);
      const depts = deptRes.data?.data || [];
      setDepartments(depts);
      if (depts.length > 0) setFormData((prev) => ({ ...prev, departmentId: depts[0].id }));
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await resourceService.updateStatus(id, status);
      if (status === 'UNAVAILABLE') {
        toast('Resource marked unavailable. Adaptive Engine Rule 5 executed to allocate suitable substitute.', { icon: '⚠️' });
      } else {
        toast.success(`Resource status updated to ${status}`);
      }
      fetchResources();
    } catch (err) {
      toast.error('Failed to update resource status');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await resourceService.createResource(formData);
      toast.success('Clinical resource registered successfully!');
      setIsOpen(false);
      fetchResources();
    } catch (err) {
      toast.error('Failed to create resource');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading hospital resource allocations..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hospital Clinical Resources</h1>
          <p className="text-xs text-gray-500 mt-0.5">Examination rooms, critical recovery beds, and shared diagnostic machinery.</p>
        </div>
        <Button icon={Plus} onClick={() => setIsOpen(true)}>
          Register Resource
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Resource Name</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="py-3 font-bold text-gray-900">{r.name}</td>
                  <td className="py-3 font-semibold text-teal-700">{r.type}</td>
                  <td className="py-3 text-gray-600">{r.departmentName || 'General'}</td>
                  <td className="py-3 text-gray-500">{r.location}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        r.status === 'AVAILABLE'
                          ? 'success'
                          : r.status === 'OCCUPIED'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    {r.status === 'AVAILABLE' ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleStatusUpdate(r.id, 'UNAVAILABLE')}
                      >
                        Set Outage (Rule 5)
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(r.id, 'AVAILABLE')}
                      >
                        Set Available
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register Resource">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Resource Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ultrasound Diagnostic Bay 3"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
              >
                <option value="ROOM">Consultation / Surgery Room</option>
                <option value="BED">Examination / Triage Bed</option>
                <option value="EQUIPMENT">Diagnostic Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Physical Location</label>
            <input
              type="text"
              placeholder="e.g. Room 204, Wing B"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Register Resource</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
