export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-3"></div>
      <p className="text-sm text-gray-500 font-medium">{text}</p>
    </div>
  );
}
