import QuoteForm from '@/components/QuoteForm';
import { getSettings } from '@/lib/db';

export default async function NewQuotePage() {
  const settings = getSettings();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Quote</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below to generate a quote.</p>
      </div>
      <QuoteForm
        defaultSettings={{
          markup_percent: settings.markup_percent ?? '20',
          labor_rate: settings.labor_rate ?? '75',
        }}
      />
    </div>
  );
}
