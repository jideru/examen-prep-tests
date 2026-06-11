import { useEffect, useMemo, useState } from 'react';
import { loadTests } from './lib/tests.js';
import Overview from './pages/Overview.jsx';
import TestView from './pages/TestView.jsx';

// Eenvoudige hash-routing: #/ is het overzicht, #/test/<id> is een toets.
// Zo blijf je na een refresh op dezelfde pagina staan.
function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const match = hash.match(/^#\/test\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const tests = useMemo(() => loadTests(), []);
  const activeTestId = useRoute();
  const activeTest = tests.find((test) => test.id === activeTestId);

  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden="true">✦</span>
          Examen Prep
        </a>
      </header>
      <main>
        {activeTest ? (
          <TestView key={activeTest.id} test={activeTest} />
        ) : (
          <Overview tests={tests} />
        )}
      </main>
    </div>
  );
}
