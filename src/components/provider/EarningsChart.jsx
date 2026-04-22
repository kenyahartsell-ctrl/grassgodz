import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function EarningsChart({ payments }) {
  const monthlyData = payments.reduce((acc, p) => {
    if (p.status !== 'captured') return acc;
    const month = new Date(p.created_date).toLocaleString('default', { month: 'short' });
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.earnings += p.payout_amount || 0;
    } else {
      acc.push({ month, earnings: p.payout_amount || 0 });
    }
    return acc;
  }, []);

  return (
    <Card className="p-5 border border-border">
      <h3 className="font-heading font-semibold mb-4">Earnings Overview</h3>
      {monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Earnings']} />
            <Bar dataKey="earnings" fill="hsl(152, 55%, 36%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-12">No earnings data yet</p>
      )}
    </Card>
  );
}