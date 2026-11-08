import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { departmentService } from '../../services/departmentService';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { UserCheck, Stethoscope, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState('PATIENT'); // 'PATIENT' | 'DOCTOR'
  const [departments, setDepartments] = useState([]);
  const [doctorSubmitted, setDoctorSubmitted] = useState(false);

  // Patient fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    role: 'PATIENT',
  });

  // Doctor fields
  const [doctorData, setDoctorData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    departmentId: '',
    specialization: '',
    qualification: '',
    experience: 5,
  });

  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    departmentService.getActiveDepartments()
      .then((res) => {
        const list = res.data?.data || [];
        setDepartments(list);
        if (list.length > 0) {
          setDoctorData((prev) => ({ ...prev, departmentId: list[0].id }));
        }
      })
      .catch(() => {
        // Fallback departments if backend offline
        setDepartments([
          { id: 1, name: 'General Medicine' },
          { id: 2, name: 'Cardiology' },
          { id: 3, name: 'Orthopedics' },
          { id: 4, name: 'Pediatrics' },
          { id: 5, name: 'Dermatology' },
          { id: 6, name: 'Neurology' },
        ]);
        setDoctorData((prev) => ({ ...prev, departmentId: 1 }));
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDoctorChange = (e) => {
    setDoctorData({ ...doctorData, [e.target.name]: e.target.value });
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast.success('Registration successful! Welcome to ADAPTCARE.');
      navigate('/patient');
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK') {
        toast.error('Network Error: Cannot connect to backend server at http://localhost:8083.');
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.doctorRegister({
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        email: doctorData.email,
        password: doctorData.password,
        phone: doctorData.phone,
        departmentId: Number(doctorData.departmentId),
        specialization: doctorData.specialization,
        qualification: doctorData.qualification,
        experience: Number(doctorData.experience),
      });

      setDoctorSubmitted(true);
      toast.success('Doctor registration submitted! Awaiting administrator approval.');
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK') {
        toast.error('Network Error: Cannot connect to backend server at http://localhost:8083.');
      } else {
        toast.error(err.response?.data?.message || 'Doctor registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="inline-flex h-12 w-12 rounded-2xl bg-teal-600 text-white font-bold text-2xl items-center justify-center shadow-lg shadow-teal-500/25 mb-3">
          +
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          {accountType === 'PATIENT' ? 'Create Patient Account' : 'Register as Medical Specialist'}
        </h2>
        <p className="mt-1 text-xs text-gray-500 font-medium">
          {accountType === 'PATIENT'
            ? 'Join ADAPTCARE for smart, adaptive healthcare scheduling'
            : 'Apply to join the clinical faculty of ADAPTCARE Hospital'}
        </p>

        {/* Account Type Selector */}
        {!doctorSubmitted && (
          <div className="mt-5 inline-flex p-1 rounded-xl bg-gray-200/70 border border-gray-300">
            <button
              type="button"
              onClick={() => setAccountType('PATIENT')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                accountType === 'PATIENT' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Patient Registration
            </button>
            <button
              type="button"
              onClick={() => setAccountType('DOCTOR')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                accountType === 'DOCTOR' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Doctor Self-Registration
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl sm:px-10">
          {doctorSubmitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Application Submitted!</h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                Thank you for applying to ADAPTCARE. Your account status is currently{' '}
                <span className="font-semibold text-amber-700">PENDING APPROVAL</span>.
                Our hospital administrator will verify your credentials and approve your practice profile shortly.
              </p>
              <div className="pt-2">
                <Button onClick={() => navigate('/login')} className="w-full">
                  Return to Sign In
                </Button>
              </div>
            </div>
          ) : accountType === 'PATIENT' ? (
            <form className="space-y-4" onSubmit={handlePatientSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1-555-0100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <Button type="submit" loading={loading} className="w-full mt-4">
                Complete Patient Registration
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleDoctorSubmit}>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                Doctor accounts require administrative review and verification before login privileges are enabled.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    name="firstName"
                    value={doctorData.firstName}
                    onChange={handleDoctorChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    name="lastName"
                    value={doctorData.lastName}
                    onChange={handleDoctorChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Doctor Email</label>
                <input
                  type="email"
                  required
                  name="email"
                  value={doctorData.email}
                  onChange={handleDoctorChange}
                  placeholder="doctor.name@hospital.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  name="password"
                  value={doctorData.password}
                  onChange={handleDoctorChange}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={doctorData.phone}
                    onChange={handleDoctorChange}
                    placeholder="+1-555-0200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Department</label>
                  <select
                    required
                    name="departmentId"
                    value={doctorData.departmentId}
                    onChange={handleDoctorChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    name="specialization"
                    value={doctorData.specialization}
                    onChange={handleDoctorChange}
                    placeholder="e.g. Interventional Cardiology"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    value={doctorData.qualification}
                    onChange={handleDoctorChange}
                    placeholder="e.g. MBBS, MD, DM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  name="experience"
                  value={doctorData.experience}
                  onChange={handleDoctorChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <Button type="submit" loading={loading} className="w-full mt-4">
                Submit Doctor Registration
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500">Already registered? </span>
            <Link to="/login" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
