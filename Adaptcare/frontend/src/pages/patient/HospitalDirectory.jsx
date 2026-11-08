import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { departmentService } from '../../services/departmentService';
import { doctorService } from '../../services/doctorService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Building2, Stethoscope, Calendar, Search, MapPin, Clock, Award, ShieldCheck } from 'lucide-react';
import { formatDoctorName } from '../../utils/formatters';

const DEPARTMENT_METADATA = {
  'General Medicine': {
    wing: 'West Wing, Ground & 1st Floor',
    description: 'Comprehensive primary medical evaluations, preventive diagnostics, and chronic disease management.',
    iconColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  'Cardiology': {
    wing: 'Heart & Vascular Pavilion, 3rd Floor',
    description: 'Specialized diagnostic cardiology, ECG, echocardiography, hemodynamic monitoring, and acute cardiac care.',
    iconColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  'Orthopedics': {
    wing: 'Surgical & Musculoskeletal Center, 2nd Floor',
    description: 'Joint replacement, trauma care, sports medicine, spinal alignment, and post-operative mobility rehabilitation.',
    iconColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'Pediatrics': {
    wing: 'Children’s Health Pavilion, 1st Floor East',
    description: 'Compassionate pediatric wellness, neonatal monitoring, immunization, and adolescent medicine.',
    iconColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  'Dermatology': {
    wing: 'East Wing Clinical Annex, 4th Floor',
    description: 'Clinical dermatology, skin pathology, allergen testing, and advanced phototherapy treatments.',
    iconColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  'Neurology': {
    wing: 'Neuroscience Center of Excellence, 5th Floor',
    description: 'Neurological assessments, neuro-diagnostic imaging, stroke rehabilitation, and epilepsy monitoring.',
    iconColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

export default function HospitalDirectory() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');

  useEffect(() => {
    Promise.all([
      departmentService.getActiveDepartments().catch(() => ({ data: { data: [] } })),
      doctorService.getActiveDoctors().catch(() => ({ data: { data: [] } })),
    ])
      .then(([deptRes, docRes]) => {
        setDepartments(deptRes.data?.data || []);
        setDoctors(docRes.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading hospital directory and physician directory..." />;

  const filteredDepartments = departments.filter((dept) => {
    if (selectedDeptId !== 'ALL' && String(dept.id) !== String(selectedDeptId)) {
      return false;
    }
    return true;
  });

  const getDepartmentDoctors = (deptId) => {
    return doctors.filter((doc) => {
      const matchesDept = Number(doc.departmentId) === Number(deptId);
      if (!matchesDept) return false;
      if (!searchTerm) return true;
      const fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.toLowerCase();
      const spec = (doc.specialization || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return fullName.includes(term) || spec.includes(term);
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-teal-200 text-xs font-semibold tracking-wider uppercase">Hospital Directory</span>
          <h1 className="text-2xl font-bold mt-1">Clinical Departments & Attending Physicians</h1>
          <p className="text-teal-100 text-xs max-w-xl mt-1">
            Browse our 6 accredited medical departments, view certified medical staff, and reserve consultations with adaptive real-time queue estimation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/patient/book">
            <Button variant="secondary" icon={Calendar} className="text-teal-900 font-semibold shadow-sm">
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDeptId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedDeptId === 'ALL'
                ? 'bg-teal-700 text-white font-semibold shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Departments ({departments.length})
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                String(selectedDeptId) === String(dept.id)
                  ? 'bg-teal-700 text-white font-semibold shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search physician or specialty..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500 bg-white"
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="space-y-6">
        {filteredDepartments.map((dept) => {
          const deptDocs = getDepartmentDoctors(dept.id);
          const meta = DEPARTMENT_METADATA[dept.name] || {
            wing: 'Main Hospital Pavilion',
            description: dept.description || 'Specialized clinical care and patient consultation.',
            iconColor: 'bg-teal-50 text-teal-700 border-teal-200',
          };

          return (
            <Card key={dept.id} className="overflow-hidden border border-gray-200 shadow-xs">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${meta.iconColor}`}>
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">{dept.name}</h2>
                      <Badge variant="teal" size="xs">
                        {deptDocs.length} {deptDocs.length === 1 ? 'Doctor' : 'Doctors'} Available
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 max-w-2xl">{meta.description}</p>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1.5 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span>{meta.wing}</span>
                    </div>
                  </div>
                </div>

                <Link to={`/patient/book`}>
                  <Button size="sm" variant="outline" icon={Calendar}>
                    Book in {dept.name}
                  </Button>
                </Link>
              </div>

              {/* Doctors List in Department */}
              <div className="p-5">
                {deptDocs.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs italic">
                    No matching physicians found in this department.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {deptDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/10 transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-teal-100/70 text-teal-800 flex items-center justify-center shrink-0 font-bold text-sm">
                              {doc.firstName?.[0] || 'D'}{doc.lastName?.[0] || 'R'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold text-gray-900">
                                  {formatDoctorName(doc.firstName, doc.lastName)}
                                </h3>
                                <ShieldCheck className="h-4 w-4 text-teal-600" title="Board Certified" />
                              </div>
                              <p className="text-xs font-semibold text-teal-700">{doc.specialization}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {doc.qualification || 'MBBS, MD'} • {doc.experience || 5}+ Years Clinical Experience
                              </p>
                            </div>
                          </div>

                          <Badge variant={doc.active ? 'success' : 'danger'} size="xs">
                            {doc.active ? 'On Duty' : 'Away'}
                          </Badge>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>Slot: {doc.consultationDuration || 30} mins</span>
                          </div>

                          <Link to={`/patient/book`}>
                            <Button size="xs" variant="primary">
                              Book Slot
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
