'use client';

const TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z" />
    ),
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: (
      <>
        <rect x="5" y="4" width="11" height="15" rx="2" transform="rotate(-8 10.5 11.5)" />
        <rect x="9" y="5" width="11" height="15" rx="2" transform="rotate(6 14.5 12.5)" />
      </>
    ),
  },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab ${active === t.id ? 'is-active' : ''}`}
          aria-current={active === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
            {t.icon}
          </svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
