import { useEffect, useState } from 'react';

export default function MotionDebug() {
  const [debugInfo, setDebugInfo] = useState({
    fadeInElements: 0,
    depthElements: 0,
    interactiveElements: 0,
    buttonPressElements: 0,
  });
  const [hoverDetected, setHoverDetected] = useState(false);

  useEffect(() => {
    // Check DOM for motion classes
    const check = () => {
      setDebugInfo({
        fadeInElements: document.querySelectorAll('[class*="cp-fade-in"]').length,
        depthElements: document.querySelectorAll('.cp-card-depth').length,
        interactiveElements: document.querySelectorAll('.cp-card-interactive').length,
        buttonPressElements: document.querySelectorAll('.cp-button-press').length,
      });
    };

    // Check immediately and after a delay (for animations)
    check();
    const timer = setTimeout(check, 500);

    // Add hover detection
    const handleMouseOver = (e) => {
      if (e.target.classList.contains('cp-card-depth') || 
          e.target.closest('.cp-card-depth') ||
          e.target.classList.contains('cp-card-interactive') ||
          e.target.closest('.cp-card-interactive')) {
        setHoverDetected(true);
        setTimeout(() => setHoverDetected(false), 1000);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 border border-white/30 rounded-lg p-3 text-xs font-mono z-50 max-w-xs shadow-2xl">
      <div className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
        Motion System Debug
        {hoverDetected && <span className="text-green-400 animate-pulse">⚡ HOVER</span>}
      </div>
      <div className="space-y-1 text-white/90">
        <div>cp-fade-in*: <span className="text-yellow-300">{debugInfo.fadeInElements}</span></div>
        <div>cp-card-depth: <span className="text-yellow-300">{debugInfo.depthElements}</span></div>
        <div>cp-card-interactive: <span className="text-yellow-300">{debugInfo.interactiveElements}</span></div>
        <div>cp-button-press: <span className="text-yellow-300">{debugInfo.buttonPressElements}</span></div>
      </div>
      <div className="mt-2 pt-2 border-t border-white/30">
        {debugInfo.fadeInElements === 0 ? (
          <div className="text-red-400">⚠️ No motion classes!</div>
        ) : (
          <div className="text-green-400">✓ {debugInfo.fadeInElements + debugInfo.depthElements + debugInfo.interactiveElements + debugInfo.buttonPressElements} elements</div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-white/30 text-white/60 text-[10px]">
        Hover cards to test depth
      </div>
    </div>
  );
}

