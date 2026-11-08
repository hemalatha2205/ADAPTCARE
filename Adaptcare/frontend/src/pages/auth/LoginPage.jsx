import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.firstName}!`);

      const rolePaths = {
        ADMIN: '/admin',
        DOCTOR: '/doctor',
        RECEPTIONIST: '/receptionist',
        PATIENT: '/patient',
      };
      navigate(rolePaths[user.role] || '/patient');
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK') {
        toast.error('Network Error: Cannot connect to backend server at http://localhost:8083. Verify that the backend is running and CORS allows http://localhost:5174.');
      } else if (err.response?.status === 401) {
        toast.error(err.response?.data?.message || 'Invalid email or password');
      } else if (err.response?.status === 400) {
        toast.error(err.response?.data?.message || 'Invalid request. Please check your credentials.');
      } else if (err.response?.status >= 500) {
        toast.error('Backend server error. Please try again later.');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 rounded-2xl bg-teal-600 text-white font-bold text-2xl items-center justify-center shadow-lg shadow-teal-500/25 mb-3">
          +
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">ADAPTCARE</h2>
        <p className="mt-1 text-xs text-gray-500 font-medium">Self-Adaptive Healthcare Management System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In to ADAPTCARE
            </Button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-2.5">
              Instant Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin@adaptcare.com', 'Admin@123')}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-gray-600 transition-colors font-medium text-left"
              >
                👑 Administrator
              </button>
              <button
                type="button"
                onClick={() => fillDemo('dr.sharma@adaptcare.com', 'Doc@123')}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-gray-600 transition-colors font-medium text-left"
              >
                🩺 Doctor (Sharma)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('receptionist@adaptcare.com', 'Reception@123')}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-gray-600 transition-colors font-medium text-left"
              >
                📋 Receptionist
              </button>
              <button
                type="button"
                onClick={() => fillDemo('patient@example.com', 'Patient@123')}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-gray-600 transition-colors font-medium text-left"
              >
                👤 Patient (Register)
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500">Don't have an account? </span>
            <Link to="/register" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              Register as Patient
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
