import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Users, ChevronLeft, ChevronRight, Check, X, UserPlus } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'PATIENT',
    gender: 'MALE',
    address: '',
  });

  const fetchUsers = (p = 0, role = null) => {
    setLoading(true);
    adminService.getUsers(p, 10, role || null)
      .then((res) => {
        const data = res.data?.data;
        setUsers(data?.content || []);
        setPage(data?.page || 0);
        setTotalPages(data?.totalPages || 1);
        setTotalElements(data?.totalElements || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(0, roleFilter);
  }, [roleFilter]);

  const handleToggle = async (u) => {
    const action = u.active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user account "${u.firstName} ${u.lastName}" (${u.email})?`)) {
      return;
    }
    try {
      await adminService.toggleUserActive(u.id);
      toast.success(`User account ${u.active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers(page, roleFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please complete all required fields');
      return;
    }
    setSaving(true);
    try {
      await adminService.createUser(newUser);
      toast.success(`Account for ${newUser.firstName} ${newUser.lastName} created successfully!`);
      setIsAddOpen(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        role: 'PATIENT',
        gender: 'MALE',
        address: '',
      });
      fetchUsers(0, roleFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hospital User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage accounts, assign roles, and toggle access permissions ({totalElements} users).</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-teal-500"
          >
            <option value="">All User Roles</option>
            <option value="PATIENT">Patients</option>
            <option value="DOCTOR">Doctors</option>
            <option value="RECEPTIONIST">Receptionists</option>
            <option value="ADMIN">Administrators</option>
          </select>

          <Button icon={UserPlus} onClick={() => setIsAddOpen(true)}>
            Create User
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner text="Loading user directory..." />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="py-3 text-gray-600">{u.email}</td>
                      <td className="py-3 text-gray-500">{u.phone || 'N/A'}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            u.role === 'ADMIN'
                              ? 'teal'
                              : u.role === 'DOCTOR'
                              ? 'info'
                              : u.role === 'RECEPTIONIST'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="xs"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant={u.active ? 'success' : 'danger'} size="xs">
                          {u.active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant={u.active ? 'ghost' : 'outline'}
                          onClick={() => handleToggle(u)}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
              <span>Page {page + 1} of {totalPages || 1}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={ChevronLeft}
                  disabled={page <= 0}
                  onClick={() => fetchUsers(page - 1, roleFilter)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={ChevronRight}
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchUsers(page + 1, roleFilter)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Hospital User">
        <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">First Name *</label>
              <input
                type="text"
                required
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="user@adaptcare.com"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="At least 6 chars"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Assigned Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
              >
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Contact Phone</label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="+1-555-0100"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Gender</label>
              <select
                value={newUser.gender}
                onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
