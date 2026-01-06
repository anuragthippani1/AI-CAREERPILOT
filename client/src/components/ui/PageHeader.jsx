import { cn } from '../../utils/cn';

export default function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="cp-h1">{title}</h1>
        {description ? <p className="cp-muted mt-1">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </div>
  );
}


