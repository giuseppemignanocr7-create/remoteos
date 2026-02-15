import { useEffect, useState } from 'react';
import { sessions } from '../lib/api';
import { ScrollText, RefreshCw, StopCircle } from 'lucide-react';

export default function Sessions() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    sessions.list().then(setList).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleEnd = async (id: string) => {
    await sessions.end(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sessions</h1>
          <p className="text-dark-400 mt-1">Active and past sessions</p>
        </div>
        <button onClick={load} className="p-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left px-4 py-3 text-dark-400 font-medium">ID</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Created</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Ended</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-500">Loading...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-500">No sessions</td></tr>
            ) : list.map((s) => (
              <tr key={s.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                <td className="px-4 py-3 text-white font-mono text-xs flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-primary-400" /> {s.id.slice(0, 8)}...
                </td>
                <td className="px-4 py-3 text-dark-300">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${s.is_active ? 'bg-green-500/10 text-green-400' : 'bg-dark-700 text-dark-400'}`}>
                    {s.is_active ? 'Active' : 'Ended'}
                  </span>
                </td>
                <td className="px-4 py-3 text-dark-400">{s.ended_at ? new Date(s.ended_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3">
                  {s.is_active && (
                    <button onClick={() => handleEnd(s.id)} className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors" title="End session">
                      <StopCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
