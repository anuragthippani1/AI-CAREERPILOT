import { cn } from '../../utils/cn';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}) {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon ? (
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-white/60" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description ? <p className="cp-muted mt-1 max-w-md mx-auto">{description}</p> : null}
      {(primaryAction || secondaryAction) ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}


