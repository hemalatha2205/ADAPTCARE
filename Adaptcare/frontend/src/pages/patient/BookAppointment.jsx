import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentService } from '../../services/departmentService';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { Calendar, Clock, Check, User, AlertTriangle } from 'lucide-react';
import { formatDoctorName } from '../../utils/formatters';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Default tomorrow
  );
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState('REGULAR');
  const [reason, setReason] = useState('');

  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load departments on mount
  useEffect(() => {
    departmentService.getActiveDepartments()
      .then((res) => {
        setDepartments(res.data?.data || []);
        setLoadingDepts(false);
      })
      .catch(() => setLoadingDepts(false));
  }, []);

  // When department changes, load doctors
  useEffect(() => {
    if (!selectedDept) {
      setDoctors([]);
      setSelectedDoctor('');
      return;
    }
    setLoadingDoctors(true);
    doctorService.getDoctorsByDepartment(selectedDept)
      .then((res) => {
        setDoctors(res.data?.data || []);
        setLoadingDoctors(false);
        if (res.data?.data?.length > 0) {
          setSelectedDoctor(res.data.data[0].id);
        } else {
          setSelectedDoctor('');
        }
      })
      .catch(() => setLoadingDoctors(false));
  }, [selectedDept]);

  // When doctor or date changes, load available slots
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setAvailableSlots([]);
      setSelectedSlot('');
      return;
    }
    setLoadingSlots(true);
    appointmentService.getAvailableSlots(selectedDoctor, selectedDate)
      .then((res) => {
        setAvailableSlots(res.data?.data || []);
        setSelectedSlot('');
        setLoadingSlots(false);
      })
      .catch(() => {
        setAvailableSlots([]);
        setLoadingSlots(false);
      });
  }, [selectedDoctor, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select an available time slot');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentService.bookAppointment({
        doctorId: selectedDoctor,
        departmentId: selectedDept,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        type: appointmentType,
        reason: reason,
      });

      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  if (loadingDepts) return <LoadingSpinner text="Loading booking form..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Choose a clinical department, consulting physician, and confirmed time slot.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Department Selection */}
        <Card title="1. Select Clinical Department">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {departments.map((dept) => (
              <button
                type="button"
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedDept === dept.id
                    ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{dept.location || 'Hospital Campus'}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Step 2: Doctor Selection */}
        {selectedDept && (
          <Card title="2. Select Consulting Physician">
            {loadingDoctors ? (
              <LoadingSpinner text="Finding available doctors..." />
            ) : doctors.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No active doctors found in this department.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((doc) => (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedDoctor === doc.id
                        ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                        Dr
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{formatDoctorName(doc.firstName, doc.lastName)}</p>
                        <p className="text-xs text-teal-700 font-medium">{doc.specialization}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{doc.experience} yrs exp • {doc.qualification}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Step 3: Date & Slot Selection */}
        {selectedDoctor && (
          <Card title="3. Choose Date & Time Slot">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Available Slots for {selectedDate}
                </label>
                {loadingSlots ? (
                  <LoadingSpinner text="Checking doctor schedule..." />
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-xs text-gray-500 font-medium">No available slots on this date. Please pick another date or doctor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableSlots.map((slot, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedSlot(slot.startTime)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selectedSlot === slot.startTime
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-500 hover:text-teal-700'
                        }`}
                      >
                        {slot.startTime?.slice(0, 5)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Visit Details */}
        {selectedSlot && (
          <Card title="4. Visit Information & Reason">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Appointment Type
                  </label>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="REGULAR">Regular Consultation</option>
                    <option value="FOLLOW_UP">Follow-up Visit</option>
                    <option value="CONSULTATION">Specialist Consultation</option>
                    <option value="EMERGENCY">Emergency / Urgent Care</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <div className="pt-2">
                    {appointmentType === 'EMERGENCY' ? (
                      <Badge variant="danger" className="text-xs">High (Priority 1 - Auto Surge)</Badge>
                    ) : (
                      <Badge variant="teal" className="text-xs">Standard (Priority 3)</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Reason for Visit / Symptoms
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your symptoms or reason for this clinical consultation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                ></textarea>
              </div>

              <div className="pt-2">
                <Button type="submit" loading={submitting} className="w-full">
                  Confirm & Book Appointment
                </Button>
              </div>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
}
