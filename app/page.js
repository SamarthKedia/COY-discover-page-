'use client';

import { useState } from 'react';
import TabBar from '@/components/TabBar.js';
import DiscoverTab from '@/components/DiscoverTab.js';

export default function App() {
  const [tab, setTab] = useState('discover');

  return (
    <div className="shell">
      <main className="screen">
        {tab === 'home' ? (
          // Intentionally blank: Coy's real Home lives in their codebase.
          <section className="home-placeholder" aria-label="Home" />
        ) : (
          <DiscoverTab />
        )}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
