import { useEffect, useState } from 'react';
import { audit } from '../lib/api';
import { Shield, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function Audit() {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    audit.timeline().then(setTimeline).catch(() => {}).finally(() => setLoading(false));
    audit.verify().then(setVerification).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-dark-400 mt-1">Tamper-proof activity trail</p>
        </div>
        <button onClick={load} className="p-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Verification status */}
      {verification && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${verification.valid !== false ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
          {verification.valid !== false ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <div>
            <p className={`text-sm font-medium ${verification.valid !== false ? 'text-green-400' : 'text-red-400'}`}>
              {verification.valid !== false ? 'Hash chain integrity verified' : 'Hash chain integrity BROKEN'}
            </p>
            <p className="text-xs text-dark-400 mt-0.5">
              {verification.total_entries ?? timeline.length} entries checked
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Timestamp</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Action</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Entity</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Hash</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-dark-500">Loading...</td></tr>
            ) : timeline.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-dark-500">No audit entries</td></tr>
            ) : timeline.map((e) => (
              <tr key={e.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                <td className="px-4 py-3 text-dark-300 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-primary-400" />
                  {new Date(e.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-white">{e.action}</td>
                <td className="px-4 py-3 text-dark-400">{e.entity_type} {e.entity_id?.slice(0, 8)}</td>
                <td className="px-4 py-3 text-dark-500 font-mono text-xs">{e.hash?.slice(0, 16)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
