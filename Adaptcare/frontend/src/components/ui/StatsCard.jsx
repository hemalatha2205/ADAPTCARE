export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'teal' }) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-lg ${colorMap[color] || colorMap.teal}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
