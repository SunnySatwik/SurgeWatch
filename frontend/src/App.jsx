/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Landing from './components/Landing';
import Dashboard from './components/dashboard/Dashboard';

export default function App() {
  const [view, setView] = useState('landing');

  return (
    <div className="antialiased font-sans transition-colors duration-500">
      {view === 'landing' ? (
        <Landing onLaunch={() => setView('dashboard')} />
      ) : (
        <Dashboard onBack={() => setView('landing')} />
      )}
    </div>
  );
}
