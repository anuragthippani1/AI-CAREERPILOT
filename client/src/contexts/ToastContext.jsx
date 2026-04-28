import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ title, message, variant = 'info', durationMs = 3800 }) => {
      const id = uid();
      const toast = { id, title, message, variant };
      setToasts((prev) => [toast, ...prev].slice(0, 4));

      const timer = window.setTimeout(() => remove(id), durationMs);
      timersRef.current.set(id, timer);
      return id;
    },
    [remove]
  );

  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider>');
  }
  return ctx;
}

