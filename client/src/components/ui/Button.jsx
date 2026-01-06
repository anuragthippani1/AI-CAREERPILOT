import { cn } from '../../utils/cn';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 cp-button-press ' +
  'disabled:opacity-50 disabled:cursor-not-allowed cp-focus-ring';

const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-600/90 shadow-sm shadow-black/20',
  secondary:
    'bg-white/5 text-white hover:bg-white/8 border border-white/10 hover:border-white/15',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  danger:
    'bg-red-500/15 text-red-200 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/40',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}


