import { useState, useEffect } from 'react';
import { feedbackService } from '../../services/feedbackService';
import { appointmentService } from '../../services/appointmentService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Star, MessageSquare } from 'lucide-react';

export default function PatientFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('OVERALL');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      feedbackService.getPatientFeedback().catch(() => ({ data: { data: [] } })),
      appointmentService.getPatientAppointments().catch(() => ({ data: { data: [] } })),
    ]).then(([feedRes, appRes]) => {
      setFeedbackList(feedRes.data?.data || []);
      const completedApps = (appRes.data?.data || []).filter((a) => a.status === 'COMPLETED');
      setAppointments(completedApps);
      if (completedApps.length > 0) {
        setSelectedAppId(completedApps[0].id);
      } else {
        setSelectedAppId('');
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppId) {
      toast.error('Please select a completed appointment to review');
      return;
    }

    const selectedApp = appointments.find((a) => String(a.id) === String(selectedAppId));
    setSubmitting(true);
    try {
      await feedbackService.submitFeedback({
        appointmentId: Number(selectedAppId),
        doctorId: selectedApp?.doctorId || selectedApp?.doctor?.id,
        rating: Number(rating),
        category: category,
        comment: comment,
      });

      toast.success('Thank you! Your feedback helps our Adaptive Engine improve hospital scheduling.');
      setComment('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading patient feedback records..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Patient Feedback & Reviews</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Your reviews directly power Adaptive Engine Rule 6: Quality Trend Optimization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submit Form */}
        <Card title="Submit New Experience Review">
          {appointments.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              You do not have any recent completed consultations available for review.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Select Consultation
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
                >
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.doctorName} • {a.appointmentDate} ({a.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Feedback Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="WAITING_TIME">Waiting Time & Punctuality</option>
                  <option value="DOCTOR_CARE">Doctor Attentiveness & Care</option>
                  <option value="STAFF_BEHAVIOR">Nursing & Reception Staff</option>
                  <option value="FACILITIES">Hospital Cleanliness & Facilities</option>
                  <option value="OVERALL">Overall Hospital Experience</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Comments & Suggestions
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about your hospital visit, queue delay, or doctor interaction..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500"
                ></textarea>
              </div>

              <Button type="submit" loading={submitting} className="w-full">
                Submit Feedback
              </Button>
            </form>
          )}
        </Card>

        {/* History List */}
        <Card title="Your Feedback History">
          {feedbackList.length === 0 ? (
            <EmptyState
              title="No reviews submitted yet"
              description="Your submitted reviews will appear here."
              icon={MessageSquare}
            />
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {feedbackList.map((f) => (
                <div key={f.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{f.doctorName}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= f.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <Badge variant="teal" size="xs">{f.category?.replace('_', ' ')}</Badge>
                  {f.comment && <p className="text-xs text-gray-600 mt-1 italic">"{f.comment}"</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
