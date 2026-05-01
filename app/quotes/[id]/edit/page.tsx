import { getQuoteById, getSettings } from '@/lib/db';
import { notFound } from 'next/navigation';
import QuoteForm from '@/components/QuoteForm';
import Link from 'next/link';

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, settings] = await Promise.all([
    getQuoteById(Number(id)),
    getSettings(),
  ]);
  if (!quote) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/quotes/${id}`} className="text-xs text-gray-400 hover:text-gray-600">
          ← Back to quote
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Edit Quote</h1>
        <p className="text-sm text-gray-500">{quote.quote_number} — {quote.client_name}</p>
      </div>
      <QuoteForm
        initialData={quote}
        defaultSettings={{
          markup_percent: settings.markup_percent ?? '20',
          labor_rate: settings.labor_rate ?? '75',
        }}
      />
    </div>
  );
}
