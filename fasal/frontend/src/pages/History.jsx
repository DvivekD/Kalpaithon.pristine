import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '../lib/api';

export default function History() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/history').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-text-secondary">Loading history...</div>;

  const summary = data?.summary;
  const history = data?.history || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your season history</h1>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total seasons', value: summary.total_seasons },
            { label: 'Best profit season', value: summary.best_profit_season || '—' },
            { label: 'Most grown', value: summary.most_grown_crop || '—' },
            { label: 'Avg margin', value: `${summary.avg_profit_margin}%` },
          ].map((s, i) => (
            <div key={i} className="bg-bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-text-secondary uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* History table */}
      {history.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-lg font-medium">No seasons recorded yet</p>
          <p className="text-sm">Complete your first season to see history here</p>
        </div>
      ) : (
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-primary border-b border-border text-text-secondary text-left">
                  <th className="p-4 font-medium">Season</th>
                  <th className="p-4 font-medium">Crop</th>
                  <th className="p-4 font-medium">Input Cost</th>
                  <th className="p-4 font-medium">Gross Revenue</th>
                  <th className="p-4 font-medium">Net Profit</th>
                  <th className="p-4 font-medium">Mandi</th>
                  <th className="p-4 font-medium">Sell Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-border hover:bg-bg-primary/50 transition">
                    <td className="p-4 font-medium">{h.season}</td>
                    <td className="p-4">{h.crop}</td>
                    <td className="p-4 text-text-secondary">₹{h.input_cost?.toLocaleString()}</td>
                    <td className="p-4">₹{h.gross_revenue?.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1 font-semibold ${h.net_profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {h.net_profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        ₹{Math.abs(h.net_profit)?.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary">{h.mandi_used}</td>
                    <td className="p-4 text-text-secondary">{h.sell_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
