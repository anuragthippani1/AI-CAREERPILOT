import { Card, CardContent } from '../ui/Card';

export default function DashboardStatsCard({
  title,
  value,
  icon: Icon,
  hint,
  right,
  className,
}) {
  return (
    <Card className={className} depth>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-white/70">{title}</div>
            <div className="mt-1 text-2xl font-semibold text-white truncate">{value}</div>
            {hint ? <div className="mt-2 text-xs text-white/55">{hint}</div> : null}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {right}
            {Icon ? (
              <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary-200" aria-hidden="true" />
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

