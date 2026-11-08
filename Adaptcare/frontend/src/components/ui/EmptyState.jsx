import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  action,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
      <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
