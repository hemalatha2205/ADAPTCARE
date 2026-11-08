import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

export default function PatientRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Patient@123', // Default initial password
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    role: 'PATIENT',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.register(formData);
      const newPatientId = res.data?.data?.userId;
      toast.success(`Patient ${formData.firstName} ${formData.lastName} registered successfully!`);
      navigate('/receptionist/book', { state: { patientId: newPatientId } });
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK') {
        toast.error('Network Error: Cannot connect to backend server at http://localhost:8083.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to register patient');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Patient Intake Registration</h1>
        <p className="text-xs text-gray-500 mt-0.5">Register walk-in or newly arriving patients into the hospital registry.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
              <input
                type="text"
                required
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
              <input
                type="text"
                required
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Contact Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Residential Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="City, State"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" loading={loading} icon={UserPlus}>
              Register Patient & Proceed to Booking
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
