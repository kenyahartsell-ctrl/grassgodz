import React from 'react';
import { Card } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminRevenueChart({ payments }) {
  const weeklyData = payments
    .filter(p => p.status === 'captured')
    .reduce((acc, p) => {
      const week = format(new Date(p.created_date));
      const existing = acc.find(w => w.week === week);
      if (existing) {
        existing.revenue += p.platform_fee || 0;
        existing.gmv += p.amount || 0;
      } else {
        acc.push({ week, revenue: p.platform_fee || 0, gmv: p.amount || 0 });
      }
      return acc;
    }, []);

  return (
    <Card className="p-5 border border-border">
      <h3 className="font-heading font-semibold mb-4">Revenue & GMV</h3>
      {weeklyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(200, 65%, 45%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(200, 65%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 55%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(152, 55%, 36%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
            <Area type="monotone" dataKey="gmv" stroke="hsl(200, 65%, 45%)" fill="url(#gmvGrad)" strokeWidth={2} name="GMV" />
            <Area type="monotone" dataKey="revenue" stroke="hsl(152, 55%, 36%)" fill="url(#revGrad)" strokeWidth={2} name="Platform Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-12">No payment data yet</p>
      )}
    </Card>
  );
}

function format(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}