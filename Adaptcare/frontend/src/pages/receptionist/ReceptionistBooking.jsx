import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { departmentService } from '../../services/departmentService';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Calendar, User, AlertTriangle } from 'lucide-react';
import { formatDoctorName } from '../../utils/formatters';

export default function ReceptionistBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  const getDefaultDate = () => {
    const now = new Date();
    if (now.getHours() >= 17) {
      return new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  };

  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState('REGULAR');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/users/role/PATIENT').catch(() => ({ data: { data: [] } })),
      departmentService.getActiveDepartments().catch(() => ({ data: { data: [] } })),
    ]).then(([patRes, deptRes]) => {
      const pats = patRes.data?.data || [];
      const depts = deptRes.data?.data || [];
      setPatients(pats);
      setDepartments(depts);
      const preselectedId = location.state?.patientId;
      if (preselectedId && pats.some((p) => p.id === preselectedId)) {
        setSelectedPatient(preselectedId);
      } else if (pats.length > 0) {
        setSelectedPatient(pats[0].id);
      }
      if (depts.length > 0) setSelectedDept(depts[0].id);
      setLoading(false);
    });
  }, [location.state]);

  useEffect(() => {
    if (!selectedDept) {
      setDoctors([]);
      return;
    }
    doctorService.getDoctorsByDepartment(selectedDept)
      .then((res) => {
        const docs = res.data?.data || [];
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctor(docs[0].id);
        else setSelectedDoctor('');
      })
      .catch(() => setDoctors([]));
  }, [selectedDept]);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setSlots([]);
      return;
    }
    appointmentService.getAvailableSlots(selectedDoctor, selectedDate)
      .then((res) => setSlots(res.data?.data || []))
      .catch(() => setSlots([]));
  }, [selectedDoctor, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    if (!selectedSlot) {
      toast.error(
        appointmentType === 'EMERGENCY'
          ? 'Please select a slot or click Immediate Emergency Triage'
          : 'Please select an available consultation slot'
      );
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const currentHhMm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
      const finalSlot = selectedSlot === 'EMERGENCY_IMMEDIATE' ? currentHhMm : selectedSlot;

      await appointmentService.bookAppointment({
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        departmentId: selectedDept,
        appointmentDate: selectedDate,
        startTime: finalSlot,
        type: appointmentType,
        reason: reason,
      });

      toast.success(
        appointmentType === 'EMERGENCY'
          ? 'EMERGENCY Case Registered! Adaptive Engine triggered surge queue prioritization.'
          : 'Appointment booked successfully!'
      );
      navigate('/receptionist/queue');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading booking console..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Front Desk Appointment Booking</h1>
        <p className="text-xs text-gray-500 mt-0.5">Book scheduled or emergency appointments on behalf of walk-in or arriving patients.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Select Patient
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.email} • {p.phone || 'No phone'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Attending Physician
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDoctorName(d.firstName, d.lastName)} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Triage Intake Type
              </label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="REGULAR">Regular Consultation</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="CONSULTATION">Specialist Referral</option>
                <option value="EMERGENCY">EMERGENCY (Triggers Adaptive Surge)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Select Time Slot
            </label>
            {slots.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-2">
                <p className="font-semibold">No routine consultation slots remaining for selected doctor on {selectedDate}.</p>
                <p className="text-[11px] text-amber-700">
                  Standard clinic hours are Mon–Sat, 09:00 to 17:00. If clinic hours for today have passed, please select tomorrow or another future date.
                </p>
                {appointmentType === 'EMERGENCY' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedSlot('EMERGENCY_IMMEDIATE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        selectedSlot === 'EMERGENCY_IMMEDIATE'
                          ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400'
                          : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                      }`}
                    >
                      🚨 Immediate Emergency Triage (Priority 1 Intake)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {slots.map((s, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedSlot(s.startTime)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedSlot === s.startTime
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-teal-500'
                    }`}
                  >
                    {s.startTime?.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Clinical Symptoms / Chief Complaint
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Chest tightness, acute fracture, persistent fever..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              loading={submitting}
              variant={appointmentType === 'EMERGENCY' ? 'danger' : 'primary'}
            >
              {appointmentType === 'EMERGENCY' ? 'Book Emergency (Priority 1)' : 'Confirm Appointment Booking'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
