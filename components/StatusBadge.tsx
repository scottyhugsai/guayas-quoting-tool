import { STATUS_LABELS, STATUS_COLORS } from '@/lib/calculations';

type Status = 'draft' | 'sent' | 'accepted' | 'rejected';

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
