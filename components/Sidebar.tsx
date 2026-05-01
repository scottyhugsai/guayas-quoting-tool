'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '▦' },
  { href: '/pipeline', label: 'Pipeline', icon: '◈' },
  { href: '/clients', label: 'Clients', icon: '👤' },
  { href: '/jobs', label: 'Jobs', icon: '🔨' },
  { href: '/quotes', label: 'Quotes', icon: '📋' },
  { href: '/proposals', label: 'Proposals', icon: '📑' },
  { href: '/invoices', label: 'Invoices', icon: '💰' },
  { href: '/insurance', label: 'Insurance', icon: '🛡' },
  { href: '/calendar', label: 'Calendar', icon: '📅' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = NAV.map(({ href, label, icon }) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
      >
        <span className="text-base w-5 text-center">{icon}</span>
        {label}
      </Link>
    );
  });

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div>
          <div className="text-amber-400 font-bold text-sm">GUAYAS</div>
          <div className="text-slate-500 text-xs">Roofing & Construction</div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-slate-400 hover:text-slate-200 p-1"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <nav className="relative z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 gap-1 overflow-y-auto">
            <div className="mb-4">
              <div className="text-amber-400 font-bold">GUAYAS</div>
              <div className="text-slate-500 text-xs">Roofing & Construction</div>
            </div>
            {links}
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-56 min-h-screen bg-slate-900 border-r border-slate-800 p-4 gap-1 shrink-0">
        <div className="mb-6 px-2">
          <div className="text-amber-400 font-bold text-lg tracking-wide">GUAYAS</div>
          <div className="text-slate-500 text-xs">Roofing & Construction</div>
        </div>
        {links}
      </nav>
    </>
  );
}
