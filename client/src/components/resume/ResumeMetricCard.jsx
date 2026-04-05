import { Card, CardContent } from '../ui/Card';

export default function ResumeMetricCard({ label, value, hint }) {
  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <p className="text-sm text-white/60">{label}</p>
        <p className="mt-2 text-4xl font-semibold text-white">{value}</p>
        {hint ? <p className="mt-2 text-sm text-white/55">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
