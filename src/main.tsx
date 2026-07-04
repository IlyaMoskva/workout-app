import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Project45</p>
        <h1>Human Performance OS</h1>
        <p>
          Project45 is the local-first training system for structured workout planning, exercise knowledge, and personal performance routines.
        </p>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
