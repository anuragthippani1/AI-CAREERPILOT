import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function MotionDebug() {
  const [debugInfo, setDebugInfo] = useState({
    fadeInElements: 0,
    depthElements: 0,
    interactiveElements: 0,
    buttonPressElements: 0,
  });
  const [hoverDetected, setHoverDetected] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReducedMotion = () => setReducedMotion(motionQuery.matches);
    syncReducedMotion();
    motionQuery.addEventListener('change', syncReducedMotion);

    let hoverTimer;
    const check = () => {
      setDebugInfo({
        fadeInElements: document.querySelectorAll('[class*="cp-fade-in"]').length,
        depthElements: document.querySelectorAll('.cp-card-depth').length,
        interactiveElements: document.querySelectorAll('.cp-card-interactive').length,
        buttonPressElements: document.querySelectorAll('.cp-button-press').length,
      });
      setLastScan(new Date());
    };

    let debounceTimer;
    const scheduleCheck = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(check, 250);
    };

    check();
    const timer = setTimeout(check, 500);

    const observer = new MutationObserver(scheduleCheck);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    // Add hover detection
    const handleMouseOver = (e) => {
      if (e.target.classList.contains('cp-card-depth') || 
          e.target.closest('.cp-card-depth') ||
          e.target.classList.contains('cp-card-interactive') ||
          e.target.closest('.cp-card-interactive')) {
        setHoverDetected(true);
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => setHoverDetected(false), 1000);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      motionQuery.removeEventListener('change', syncReducedMotion);
      observer.disconnect();
      clearTimeout(debounceTimer);
      clearTimeout(timer);
      clearTimeout(hoverTimer);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [location.pathname]);

  if (!import.meta.env.DEV) return null;

  const totalElements =
    debugInfo.fadeInElements +
    debugInfo.depthElements +
    debugInfo.interactiveElements +
    debugInfo.buttonPressElements;

  return (
    <div
      className="fixed bottom-4 right-4 bg-black/90 border border-white/30 rounded-lg p-3 text-xs font-mono z-50 max-w-xs shadow-2xl pointer-events-none select-none opacity-90"
      aria-hidden
      title="Dev-only motion system overlay"
    >
      <div className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
        Motion System Debug
        {hoverDetected && <span className="text-green-400 animate-pulse">⚡ HOVER</span>}
      </div>
      <div className="space-y-1 text-white/90">
        <div>
          route: <span className="text-yellow-300">{location.pathname}</span>
        </div>
        <div>
          reduced-motion:{' '}
          <span className={reducedMotion ? 'text-orange-300' : 'text-yellow-300'}>
            {reducedMotion ? 'on' : 'off'}
          </span>
        </div>
        <div>cp-fade-in*: <span className="text-yellow-300">{debugInfo.fadeInElements}</span></div>
        <div>cp-card-depth: <span className="text-yellow-300">{debugInfo.depthElements}</span></div>
        <div>cp-card-interactive: <span className="text-yellow-300">{debugInfo.interactiveElements}</span></div>
        <div>cp-button-press: <span className="text-yellow-300">{debugInfo.buttonPressElements}</span></div>
      </div>
      <div className="mt-2 pt-2 border-t border-white/30">
        {totalElements === 0 ? (
          <div className="text-red-400">⚠️ No motion classes!</div>
        ) : (
          <div className="text-green-400">✓ {totalElements} motion elements</div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-white/30 text-white/60 text-[10px]">
        Hover cards to test depth
        {lastScan && (
          <span className="block mt-1 text-white/40">
            Last scan {lastScan.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

