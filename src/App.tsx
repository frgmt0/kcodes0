import { lazy, Suspense, useEffect, useState } from 'react';
import './index.css';
import Chooser from './pages/Chooser';

const Concept1 = lazy(() => import('./pages/Concept1'));
const Concept2 = lazy(() => import('./pages/Concept2'));
const Concept3 = lazy(() => import('./pages/Concept3'));

function useRoute() {
  const [path, setPath] = useState<string>(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const ROUTES = new Set(['/', '/1', '/2', '/3']);
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      if (a.target && a.target !== '_self') return;
      if (!ROUTES.has(href)) return;
      e.preventDefault();
      if (href !== window.location.pathname) {
        window.history.pushState({}, '', href);
        setPath(href);
        window.scrollTo(0, 0);
      }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return path;
}

function Loading() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0b0b0c',
      display: 'grid', placeItems: 'center',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.4)',
    }}>
      loading…
    </div>
  );
}

export default function App() {
  const path = useRoute();
  if (path === '/') return <Chooser />;
  return (
    <Suspense fallback={<Loading />}>
      {path === '/1' && <Concept1 />}
      {path === '/2' && <Concept2 />}
      {path === '/3' && <Concept3 />}
      {path !== '/1' && path !== '/2' && path !== '/3' && <Chooser />}
    </Suspense>
  );
}
