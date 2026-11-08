import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import PatientAppointments from './pages/patient/PatientAppointments';
import QueueStatus from './pages/patient/QueueStatus';
import PatientNotifications from './pages/patient/PatientNotifications';
import PatientFeedback from './pages/patient/PatientFeedback';
import PatientProfile from './pages/patient/PatientProfile';
import HospitalDirectory from './pages/patient/HospitalDirectory';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorQueue from './pages/doctor/DoctorQueue';
import DoctorAvailability from './pages/doctor/DoctorAvailability';

// Receptionist pages
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import PatientRegistration from './pages/receptionist/PatientRegistration';
import ReceptionistBooking from './pages/receptionist/ReceptionistBooking';
import QueueManagement from './pages/receptionist/QueueManagement';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdaptiveEngineDashboard from './pages/admin/AdaptiveEngineDashboard';
import AdaptiveRules from './pages/admin/AdaptiveRules';
import AdaptationHistory from './pages/admin/AdaptationHistory';
import SimulationPage from './pages/admin/SimulationPage';
import PredictionsPage from './pages/admin/PredictionsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import DoctorManagement from './pages/admin/DoctorManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import ResourceManagement from './pages/admin/ResourceManagement';
import UserManagement from './pages/admin/UserManagement';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: '12px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '10px 14px',
            },
          }}
        />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute roles={['PATIENT', 'ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientDashboard />} />
            <Route path="book" element={<BookAppointment />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="queue" element={<QueueStatus />} />
            <Route path="notifications" element={<PatientNotifications />} />
            <Route path="feedback" element={<PatientFeedback />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route path="directory" element={<HospitalDirectory />} />
          </Route>

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="queue" element={<DoctorQueue />} />
            <Route path="availability" element={<DoctorAvailability />} />
          </Route>

          {/* Receptionist Routes */}
          <Route
            path="/receptionist"
            element={
              <ProtectedRoute roles={['RECEPTIONIST', 'ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ReceptionistDashboard />} />
            <Route path="register-patient" element={<PatientRegistration />} />
            <Route path="book" element={<ReceptionistBooking />} />
            <Route path="queue" element={<QueueManagement />} />
          </Route>

          {/* Administrator & Adaptive Engine Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="adaptive" element={<AdaptiveEngineDashboard />} />
            <Route path="rules" element={<AdaptiveRules />} />
            <Route path="history" element={<AdaptationHistory />} />
            <Route path="simulation" element={<SimulationPage />} />
            <Route path="predictions" element={<PredictionsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="doctors" element={<DoctorManagement />} />
            <Route path="departments" element={<DepartmentManagement />} />
            <Route path="resources" element={<ResourceManagement />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          {/* Catch-all redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
