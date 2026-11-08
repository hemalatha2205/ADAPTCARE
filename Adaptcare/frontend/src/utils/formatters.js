/**
 * Formats a doctor's display name cleanly without duplicate "Dr. Dr." prefixes.
 * Handles inputs like "Rajesh Sharma", "Dr. Rajesh Sharma", "Dr. Rajesh", etc.
 */
export function formatDoctorName(firstName = '', lastName = '') {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();

  // Strip leading Dr. or Dr if already present in firstName
  const cleanFirst = f.replace(/^Dr\.?\s*/i, '').trim();

  // If lastName already contains Dr., strip it as well
  const cleanLast = l.replace(/^Dr\.?\s*/i, '').trim();

  const fullName = `${cleanFirst} ${cleanLast}`.trim();
  return fullName ? `Dr. ${fullName}` : 'Dr. Physician';
}
