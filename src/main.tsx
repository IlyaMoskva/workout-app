import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Project 45</p>
        <h1>Human Performance OS</h1>
        <p>
          Infrastructure foundation is ready. Domain model, workout planning, and Project 45 flows will come in focused follow-up PRs.
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
