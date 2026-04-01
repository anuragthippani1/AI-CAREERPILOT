import { cn } from '../../utils/cn';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function ProgressRing({
  value,
  size = 64,
  stroke = 8,
  className,
  label,
  sublabel,
}) {
  const pct = clamp(Number.isFinite(value) ? value : 0, 0, 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="block">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(56,189,248,0.85)"
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-sm font-semibold text-white">{Math.round(pct)}%</div>
        </div>
      </div>

      {label ? (
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{label}</div>
          {sublabel ? <div className="text-xs text-white/60">{sublabel}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

