import { cn } from '../../utils/cn';

const variants = {
  neutral: 'bg-white/5 text-white/70 border-white/10',
  info: 'bg-primary-500/12 text-primary-200 border-primary-400/20',
  success: 'bg-green-500/12 text-green-200 border-green-400/20',
  warning: 'bg-yellow-500/12 text-yellow-200 border-yellow-400/20',
  danger: 'bg-red-500/12 text-red-200 border-red-400/20',
};

export default function Badge({ variant = 'neutral', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}


