import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

export default function NextActionCard({ title, description, ctaLabel, to, icon: Icon }) {
  return (
    <Card highlighted className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
            {Icon ? <Icon className="w-6 h-6 text-primary-200" aria-hidden="true" /> : null}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/70">{description}</p>
            <div className="mt-4">
              <Link to={to}>
                <Button>
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

