import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';
import { useToast } from '../../contexts/ToastContext';

const variants = {
  success: {
    ring: 'border-emerald-400/20 bg-emerald-400/10',
    icon: CheckCircle2,
    iconCls: 'text-emerald-200',
  },
  error: {
    ring: 'border-red-500/25 bg-red-500/10',
    icon: AlertCircle,
    iconCls: 'text-red-200',
  },
  info: {
    ring: 'border-white/10 bg-white/5',
    icon: Info,
    iconCls: 'text-white/70',
  },
};

export default function Toasts() {
  const { toasts, remove } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] w-[360px] max-w-[calc(100vw-2rem)] space-y-3">
      {toasts.map((t) => {
        const v = variants[t.variant] || variants.info;
        const Icon = v.icon;
        return (
          <div
            key={t.id}
            className={cn(
              'rounded-xl border shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur',
              'p-4',
              v.ring
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className={cn('mt-0.5', v.iconCls)}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                {t.title ? <div className="text-sm font-semibold text-white">{t.title}</div> : null}
                {t.message ? <div className="text-sm text-white/75 mt-1">{t.message}</div> : null}
              </div>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 rounded-lg"
                aria-label="Dismiss notification"
                onClick={() => remove(t.id)}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

