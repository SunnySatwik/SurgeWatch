import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Dashboard from './components/dashboard/Dashboard';

export default function App() {
  const [view, setView] = useState(() => {
    return localStorage.getItem('surgewatch_view') || 'landing';
  });

  useEffect(() => {
    localStorage.setItem('surgewatch_view', view);
  }, [view]);

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
