const STATUS_STYLES = {
  // Job statuses
  requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  quoted: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  scheduled: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  // Provider statuses
  pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  paused: 'bg-gray-100 text-gray-700 border-gray-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  // Payment statuses
  authorized: 'bg-blue-100 text-blue-800 border-blue-200',
  captured: 'bg-green-100 text-green-800 border-green-200',
  refunded: 'bg-purple-100 text-purple-800 border-purple-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  // Quote statuses
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABELS = {
  requested: 'Requested',
  quoted: 'Quoted',
  accepted: 'Accepted',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending_approval: 'Pending Approval',
  active: 'Active',
  paused: 'Paused',
  suspended: 'Suspended',
  authorized: 'Authorized',
  captured: 'Captured',
  refunded: 'Refunded',
  failed: 'Failed',
  pending: 'Pending',
  declined: 'Declined',
  expired: 'Expired',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
}