'use client';
import { useEffect, useState } from 'react';

interface CalEvent {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string | null;
  event_type: string;
  assigned_crew: string;
  job_title?: string;
  client_name?: string;
}

const EVENT_COLORS: Record<string, string> = {
  work:        'bg-amber-900/60 border-amber-600 text-amber-200',
  inspection:  'bg-blue-900/60 border-blue-600 text-blue-200',
  meeting:     'bg-purple-900/60 border-purple-600 text-purple-200',
  delivery:    'bg-emerald-900/60 border-emerald-600 text-emerald-200',
  other:       'bg-slate-700 border-slate-600 text-slate-200',
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '', description: '', start_time: '', end_time: '',
    event_type: 'work', assigned_crew: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/calendar').then(r => r.json()).then(setEvents).finally(() => setLoading(false));
  }, []);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      const ev = await res.json();
      setEvents(prev => [...prev, ev].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setForm({ title: '', description: '', start_time: '', end_time: '', event_type: 'work', assigned_crew: '' });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function deleteEvent(id: number) {
    if (!confirm('Delete this event?')) return;
    await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60";

  const upcoming = events.filter(e => new Date(e.start_time) >= new Date(Date.now() - 86400000));
  const past = events.filter(e => new Date(e.start_time) < new Date(Date.now() - 86400000));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Calendar</h1>
          <p className="text-slate-400 text-sm">{upcoming.length} upcoming events</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addEvent} className="bg-slate-800 border border-amber-500/30 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-slate-400 text-xs mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Start *</label>
              <input required type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">End</label>
              <input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Type</label>
              <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} className={inputClass}>
                {['work','inspection','meeting','delivery','other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Crew</label>
              <input value={form.assigned_crew} onChange={e => setForm(f => ({ ...f, assigned_crew: e.target.value }))} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-400 text-xs mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputClass} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            {saving ? 'Adding...' : 'Add Event'}
          </button>
        </form>
      )}

      {loading ? <div className="text-slate-400 animate-pulse">Loading...</div> : (
        <>
          <div className="space-y-2">
            {upcoming.length === 0 ? (
              <div className="text-slate-500 text-center py-12">No upcoming events</div>
            ) : upcoming.map(ev => (
              <div key={ev.id} className={`flex items-start justify-between border rounded-xl px-4 py-3 ${EVENT_COLORS[ev.event_type] || EVENT_COLORS.other}`}>
                <div>
                  <div className="font-medium text-sm">{ev.title}</div>
                  <div className="text-xs opacity-75 mt-0.5">
                    {new Date(ev.start_time).toLocaleString()} {ev.end_time ? `→ ${new Date(ev.end_time).toLocaleString()}` : ''}
                  </div>
                  {ev.assigned_crew && <div className="text-xs opacity-60 mt-0.5">Crew: {ev.assigned_crew}</div>}
                  {ev.job_title && <div className="text-xs opacity-60">Job: {ev.job_title}</div>}
                  {ev.description && <div className="text-xs opacity-60 mt-1">{ev.description}</div>}
                </div>
                <button onClick={() => deleteEvent(ev.id)} className="text-xs opacity-50 hover:opacity-100 ml-4 transition-opacity">✕</button>
              </div>
            ))}
          </div>
          {past.length > 0 && (
            <details>
              <summary className="text-slate-500 text-sm cursor-pointer hover:text-slate-300">Past events ({past.length})</summary>
              <div className="space-y-2 mt-2">
                {past.map(ev => (
                  <div key={ev.id} className="flex items-start justify-between border border-slate-700 bg-slate-800/50 rounded-xl px-4 py-3 opacity-60">
                    <div>
                      <div className="text-slate-300 text-sm">{ev.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{new Date(ev.start_time).toLocaleString()}</div>
                    </div>
                    <button onClick={() => deleteEvent(ev.id)} className="text-slate-600 hover:text-slate-400 text-xs ml-4">✕</button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
