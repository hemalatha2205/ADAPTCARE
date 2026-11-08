import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doctorService } from '../../services/doctorService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Sliders, Check, AlertTriangle } from 'lucide-react';

export default function DoctorAvailability() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    doctorService.getDoctorByUserId(user.userId || user.id)
      .then((res) => {
        const doc = res.data?.data;
        setDoctor(doc);
        setDoctorId(doc?.id);
        if (doc?.id) {
          return doctorService.getDoctorAvailability(doc.id);
        }
        return Promise.resolve({ data: { data: [] } });
      })
      .then((availRes) => {
        setAvailabilities(availRes.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const handleToggleDay = (index) => {
    const updated = [...availabilities];
    updated[index].available = !updated[index].available;
    setAvailabilities(updated);
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...availabilities];
    updated[index][field] = value;
    setAvailabilities(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await doctorService.setDoctorAvailability(doctorId, availabilities);
      toast.success('Consultation hours saved successfully!');
    } catch (err) {
      toast.error('Failed to save availability schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDoctorActive = async () => {
    try {
      const res = await doctorService.toggleActive(doctorId);
      setDoctor(res.data?.data);
      if (!res.data?.data?.active) {
        toast('Doctor marked unavailable. Adaptive Engine Rule 2 triggered for automatic peer reassignments.', {
          icon: '⚠️',
        });
      } else {
        toast.success('Doctor schedule resumed and marked active.');
      }
    } catch (err) {
      toast.error('Failed to update availability status');
    }
  };

  if (loading) return <LoadingSpinner text="Loading availability schedule..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage Practice Availability</h1>
          <p className="text-xs text-gray-500 mt-0.5">Define your active consultation hours and trigger adaptive absence policies.</p>
        </div>
        <Button
          size="sm"
          variant={doctor?.active ? 'danger' : 'primary'}
          onClick={handleToggleDoctorActive}
        >
          {doctor?.active ? 'Mark Self Unavailable (Triggers Rule 2)' : 'Resume Active Practice'}
        </Button>
      </div>

      {!doctor?.active && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 text-xs">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <span>
            You are currently marked as <span className="font-bold">UNAVAILABLE</span>. Future appointments have been automatically evaluated by the Adaptive Intelligence Engine and reassigned to peer physicians.
          </span>
        </div>
      )}

      <Card title="Weekly Consultation Schedule">
        <div className="space-y-3">
          {availabilities.map((avail, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                avail.available ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={avail.available}
                  onChange={() => handleToggleDay(idx)}
                  className="h-4 w-4 text-teal-600 rounded-md border-gray-300 focus:ring-teal-500"
                />
                <span className="text-sm font-bold text-gray-800 w-28 capitalize">
                  {avail.dayOfWeek?.toLowerCase()}
                </span>
                <Badge variant={avail.available ? 'teal' : 'neutral'} size="xs">
                  {avail.available ? 'Available' : 'Day Off'}
                </Badge>
              </div>

              {avail.available && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="time"
                    value={avail.startTime?.slice(0, 5) || '09:00'}
                    onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={avail.endTime?.slice(0, 5) || '17:00'}
                    onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="pt-3 flex justify-end">
            <Button onClick={handleSave} loading={saving}>
              Save Schedule Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
