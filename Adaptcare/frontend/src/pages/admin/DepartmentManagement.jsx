import { useState, useEffect } from 'react';
import { departmentService } from '../../services/departmentService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Building2, Plus, Edit2 } from 'lucide-react';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', location: '' });
  const [saving, setSaving] = useState(false);

  const fetchDepts = () => {
    setLoading(true);
    departmentService.getAllDepartments()
      .then((res) => {
        setDepartments(res.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleToggle = async (id) => {
    try {
      await departmentService.toggleActive(id);
      toast.success('Department status updated');
      fetchDepts();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await departmentService.createDepartment(formData);
      toast.success('Department created successfully!');
      setIsOpen(false);
      setFormData({ name: '', description: '', location: '' });
      fetchDepts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading hospital departments..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hospital Departments</h1>
          <p className="text-xs text-gray-500 mt-0.5">Clinical units, physical campus wings, and departmental configuration.</p>
        </div>
        <Button icon={Plus} onClick={() => setIsOpen(true)}>
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <Card key={dept.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-gray-900">{dept.name}</h3>
                <Badge variant={dept.active ? 'success' : 'neutral'} size="xs">
                  {dept.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dept.description}</p>
              <p className="text-[11px] text-teal-700 font-medium mt-2 bg-teal-50/50 p-2 rounded-lg">
                Location: {dept.location || 'Hospital Campus'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end">
              <Button
                size="sm"
                variant={dept.active ? 'ghost' : 'outline'}
                onClick={() => handleToggle(dept.id)}
              >
                {dept.active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Department">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Department Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Oncology"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Location / Wing</label>
            <input
              type="text"
              placeholder="e.g. Wing C, 4th Floor"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Primary clinical scope of practice..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
            ></textarea>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Department</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
