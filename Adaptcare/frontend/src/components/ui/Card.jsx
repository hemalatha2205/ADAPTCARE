export default function Card({ children, title, subtitle, action, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
