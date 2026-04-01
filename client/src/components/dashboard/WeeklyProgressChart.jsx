import { ResponsiveContainer, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent } from '../ui/Card';

function formatDayLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function TooltipContent({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border border-white/10 bg-[#070A12]/95 px-3 py-2 text-xs text-white shadow-lg">
      <div className="text-white/70">{formatDayLabel(label)}</div>
      <div className="mt-1">
        <span className="font-semibold text-white">{value}</span> completed
      </div>
    </div>
  );
}

export default function WeeklyProgressChart({ title = 'Weekly progress', data }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="text-xs text-white/60 mt-1">Roadmap tasks completed over the last 7 days</div>
          </div>
        </div>

        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 10, left: -10, bottom: 6 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayLabel}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.10)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="completed" fill="rgba(56,189,248,0.75)" radius={[8, 8, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

