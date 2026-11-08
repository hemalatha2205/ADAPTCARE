import { useState } from 'react';
import { predictionService } from '../../services/predictionService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { TrendingUp, Clock, BrainCircuit, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PredictionsPage() {
  // Wait Time Prediction state
  const [wtQueue, setWtQueue] = useState(6);
  const [wtWorkload, setWtWorkload] = useState(8);
  const [wtType, setWtType] = useState('REGULAR');
  const [wtEmergency, setWtEmergency] = useState(1);
  const [wtHour, setWtHour] = useState(11);
  const [wtResult, setWtResult] = useState(null);
  const [loadingWt, setLoadingWt] = useState(false);

  // Demand Prediction state
  const [dmDept, setDmDept] = useState(1);
  const [dmHour, setDmHour] = useState(10);
  const [dmResult, setDmResult] = useState(null);
  const [loadingDm, setLoadingDm] = useState(false);

  const handlePredictWaitTime = async (e) => {
    e.preventDefault();
    setLoadingWt(true);
    try {
      const res = await predictionService.predictWaitTime({
        queueLength: Number(wtQueue),
        doctorWorkload: Number(wtWorkload),
        appointmentType: wtType,
        emergencyCount: Number(wtEmergency),
        hourOfDay: Number(wtHour),
      });
      setWtResult(res.data?.data);
      toast.success('Wait time forecast generated');
    } catch (err) {
      toast.error('Prediction request failed');
    } finally {
      setLoadingWt(false);
    }
  };

  const handlePredictDemand = async (e) => {
    e.preventDefault();
    setLoadingDm(true);
    try {
      const res = await predictionService.predictDemand({
        departmentId: Number(dmDept),
        hourOfDay: Number(dmHour),
      });
      setDmResult(res.data?.data);
      toast.success('Patient demand forecast generated');
    } catch (err) {
      toast.error('Demand prediction request failed');
    } finally {
      setLoadingDm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Machine Learning Predictive Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Trained Scikit-learn regressors running in our Python microservice predict patient wait times and upcoming departmental demand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wait Time Forecaster */}
        <Card title="Patient Wait-Time Predictor (Gradient Boosting)">
          <form onSubmit={handlePredictWaitTime} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Queue Length</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={wtQueue}
                  onChange={(e) => setWtQueue(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Doctor Workload</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={wtWorkload}
                  onChange={(e) => setWtWorkload(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Appointment Type</label>
                <select
                  value={wtType}
                  onChange={(e) => setWtType(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
                >
                  <option value="REGULAR">Regular Visit</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="CONSULTATION">Specialist Consultation</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Active Emergencies</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={wtEmergency}
                  onChange={(e) => setWtEmergency(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Hour of Day (8-18)</label>
              <input
                type="number"
                min="8"
                max="18"
                value={wtHour}
                onChange={(e) => setWtHour(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>

            <Button type="submit" loading={loadingWt} className="w-full mt-2" icon={Clock}>
              Run Wait-Time ML Inference
            </Button>
          </form>

          {wtResult && (
            <div className="mt-4 p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Predicted Delay</span>
                <Badge variant={wtResult.source === 'ML_PREDICTION' ? 'success' : 'warning'}>
                  {wtResult.source}
                </Badge>
              </div>
              <div className="text-2xl font-black text-teal-800">
                {wtResult.predictedValue} <span className="text-sm font-semibold">{wtResult.unit}</span>
              </div>
              <p className="text-[11px] text-gray-600">Model Confidence: {(wtResult.confidence * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-gray-400 italic">{wtResult.details}</p>
            </div>
          )}
        </Card>

        {/* Demand Forecaster */}
        <Card title="Department Demand Forecaster (Random Forest)">
          <form onSubmit={handlePredictDemand} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Department</label>
              <select
                value={dmDept}
                onChange={(e) => setDmDept(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
              >
                <option value="1">General Medicine</option>
                <option value="2">Cardiology</option>
                <option value="3">Orthopedics</option>
                <option value="4">Pediatrics</option>
                <option value="5">Dermatology</option>
                <option value="6">Neurology</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Target Consultation Hour (8-18)</label>
              <input
                type="number"
                min="8"
                max="18"
                value={dmHour}
                onChange={(e) => setDmHour(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-teal-500"
              />
            </div>

            <Button type="submit" loading={loadingDm} className="w-full mt-2" icon={TrendingUp}>
              Run Demand ML Inference
            </Button>
          </form>

          {dmResult && (
            <div className="mt-4 p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Projected Influx</span>
                <Badge variant={dmResult.source === 'ML_PREDICTION' ? 'success' : 'warning'}>
                  {dmResult.source}
                </Badge>
              </div>
              <div className="text-2xl font-black text-teal-800">
                {dmResult.predictedValue} <span className="text-sm font-semibold">{dmResult.unit}</span>
              </div>
              <p className="text-[11px] text-gray-600">Model Confidence: {(dmResult.confidence * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-gray-400 italic">{dmResult.details}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
