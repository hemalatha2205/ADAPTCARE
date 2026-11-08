import { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import { departmentService } from '../../services/departmentService';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Stethoscope, Plus, Edit2, AlertCircle } from 'lucide-react';
import { formatDoctorName } from '../../utils/formatters';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ROSTER'); // 'ROSTER' | 'PENDING'
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [formData, setFormData] = useState({
    userId: '',
    departmentId: '',
    specialization: '',
    qualification: '',
    experience: 5,
    consultationDuration: 30,
    maxDailyAppointments: 20,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      doctorService.getAllDoctors().catch(() => ({ data: { data: [] } })),
      doctorService.getPendingDoctors().catch(() => ({ data: { data: [] } })),
      departmentService.getActiveDepartments().catch(() => ({ data: { data: [] } })),
      api.get('/users/role/DOCTOR').catch(() => ({ data: { data: [] } })),
    ]).then(([docRes, pendRes, deptRes, userRes]) => {
      setDoctors(docRes.data?.data || []);
      setPendingDoctors(pendRes.data?.data || []);
      const depts = deptRes.data?.data || [];
      setDepartments(depts);
      setUsers(userRes.data?.data || []);
      if (depts.length > 0) setFormData((prev) => ({ ...prev, departmentId: depts[0].id }));
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await doctorService.approveDoctor(id);
      toast.success('Doctor account approved and baseline weekly schedule activated!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve doctor');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await doctorService.rejectDoctor(id);
      toast.success('Doctor registration application rejected');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject doctor');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await doctorService.toggleActive(id);
      const doc = res.data?.data;
      if (!doc?.active) {
        toast('Doctor marked unavailable. Adaptive Engine Rule 2 executed to reassign future appointments.', { icon: '⚠️' });
      } else {
        toast.success('Doctor marked active.');
      }
      fetchData();
    } catch (err) {
      toast.error('Failed to update doctor status');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorService.createDoctor(formData);
      toast.success('Doctor profile created successfully!');
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading doctors directory..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Physicians & Medical Staff</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage physician credentials, active practice state, and clinical departments.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('ROSTER')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'ROSTER' ? 'bg-white text-teal-700 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Roster ({doctors.length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                activeTab === 'PENDING' ? 'bg-white text-teal-700 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Approvals
              {pendingDoctors.length > 0 && (
                <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                  {pendingDoctors.length}
                </span>
              )}
            </button>
          </div>
          <Button icon={Plus} onClick={() => setIsAddOpen(true)}>
            Add Doctor Profile
          </Button>
        </div>
      </div>

      {activeTab === 'ROSTER' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Specialization</th>
                  <th className="pb-3">Experience</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doctors.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-bold text-gray-900">
                      {formatDoctorName(d.firstName, d.lastName)}
                      <span className="text-[10px] text-gray-400 block font-normal">{d.email}</span>
                    </td>
                    <td className="py-3 text-gray-700">{d.departmentName || 'General'}</td>
                    <td className="py-3 text-teal-800 font-medium">{d.specialization}</td>
                    <td className="py-3 text-gray-600">{d.experience} years</td>
                    <td className="py-3 text-gray-600">{d.consultationDuration} min</td>
                    <td className="py-3">
                      <Badge variant={d.active ? 'success' : 'danger'}>
                        {d.active ? 'Active' : 'Unavailable'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant={d.active ? 'danger' : 'outline'}
                        onClick={() => handleToggle(d.id)}
                      >
                        {d.active ? 'Set Unavailable' : 'Set Active'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          {pendingDoctors.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No doctor registrations pending approval at this time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Doctor</th>
                    <th className="pb-3">Email & Phone</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Specialization</th>
                    <th className="pb-3">Qualification</th>
                    <th className="pb-3">Experience</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingDoctors.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">
                        {formatDoctorName(d.firstName, d.lastName)}
                      </td>
                      <td className="py-3 text-gray-600">
                        {d.email}
                        {d.phone && <span className="block text-[10px] text-gray-400">{d.phone}</span>}
                      </td>
                      <td className="py-3 text-gray-700 font-medium">{d.departmentName || 'General'}</td>
                      <td className="py-3 text-teal-800 font-medium">{d.specialization}</td>
                      <td className="py-3 text-gray-600">{d.qualification || 'MBBS'}</td>
                      <td className="py-3 text-gray-600">{d.experience || 0} years</td>
                      <td className="py-3 text-right space-x-2">
                        <Button
                          size="xs"
                          variant="primary"
                          disabled={processingId === d.id}
                          onClick={() => handleApprove(d.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          variant="danger"
                          disabled={processingId === d.id}
                          onClick={() => handleReject(d.id)}
                        >
                          Reject
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Physician Profile">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Select User Account</label>
            <select
              required
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
            >
              <option value="">-- Choose User --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
              ))}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Specialization</label>
              <input
                type="text"
                required
                placeholder="e.g. Cardiology"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Qualification</label>
              <input
                type="text"
                placeholder="e.g. MD, FACC"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Years Exp</label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Slot Mins</label>
              <input
                type="number"
                value={formData.consultationDuration}
                onChange={(e) => setFormData({ ...formData, consultationDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Max Daily</label>
              <input
                type="number"
                value={formData.maxDailyAppointments}
                onChange={(e) => setFormData({ ...formData, maxDailyAppointments: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Profile</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
