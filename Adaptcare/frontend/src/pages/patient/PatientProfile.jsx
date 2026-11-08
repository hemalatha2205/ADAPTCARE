import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { User, Phone, MapPin, Calendar } from 'lucide-react';

export default function PatientProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/profile')
      .then((res) => {
        setProfile(res.data?.data || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/users/profile', profile);
      setProfile(res.data?.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading patient profile..." />;
  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Personal Profile</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your patient contact details and clinical demographic information.</p>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="h-16 w-16 rounded-full bg-teal-100 text-teal-800 font-bold text-xl flex items-center justify-center">
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
              <p className="text-xs text-gray-400">{profile.email} • {profile.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Registered Email (Read-Only)</label>
            <input
              type="email"
              disabled
              value={profile.email || ''}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-xs text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Contact Phone</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={profile.dateOfBirth || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={profile.address || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" loading={saving}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
