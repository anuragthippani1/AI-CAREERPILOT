import { cn } from '../../utils/cn';

export function Card({ className, interactive = false, highlighted = false, depth = false, ...props }) {
  const base =
    'glass-card rounded-xl border border-white/10 ' +
    (interactive ? 'cp-card-interactive hover:border-white/15' : '') +
    (depth ? 'cp-card-depth' : '') +
    (highlighted ? 'ring-1 ring-primary-400/25' : '');

  return <div className={cn(base, className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('px-6 pt-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn('cp-h2', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('cp-muted mt-1', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('px-6 pb-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('px-6 pb-6 pt-4 cp-divider', className)} {...props} />;
}


