import { useEffect, useState } from 'react';
import { macros } from '../lib/api';
import { Workflow, RefreshCw, Play } from 'lucide-react';

export default function Macros() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    macros.list().then(setList).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Macros</h1>
          <p className="text-dark-400 mt-1">Automation workflows</p>
        </div>
        <button onClick={load} className="p-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Steps</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-dark-500">Loading...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-dark-500">No macros defined</td></tr>
            ) : list.map((m) => (
              <tr key={m.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-primary-400" /> {m.name}
                </td>
                <td className="px-4 py-3 text-dark-300">{m.definition?.steps?.length ?? 0} steps</td>
                <td className="px-4 py-3 text-dark-400">{new Date(m.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button className="p-1.5 text-dark-500 hover:text-green-400 hover:bg-dark-700 rounded-lg transition-colors" title="Execute">
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
