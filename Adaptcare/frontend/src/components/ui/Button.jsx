export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-teal-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400',
    outline: 'border border-teal-600 text-teal-600 hover:bg-teal-50 focus:ring-teal-500',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {children}
    </button>
  );
}
