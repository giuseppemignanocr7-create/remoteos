import { useEffect, useState } from 'react';
import { devices } from '../lib/api';
import { Monitor, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function Devices() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'pc', fingerprint: '', public_key: 'n/a' });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    devices.list().then(setList).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await devices.create(form);
      setShowCreate(false);
      setForm({ name: '', type: 'pc', fingerprint: '', public_key: 'n/a' });
      load();
    } catch (err: any) { setError(err.message); }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this device?')) return;
    await devices.revoke(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Devices</h1>
          <p className="text-dark-400 mt-1">Manage registered devices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Device
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-dark-900 rounded-xl border border-dark-700 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Register New Device</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-dark-300 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" placeholder="My PC" />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                <option value="pc">PC</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1">Fingerprint</label>
              <input value={form.fingerprint} onChange={(e) => setForm({ ...form, fingerprint: e.target.value })} required className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" placeholder="unique-device-id" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Device</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Fingerprint</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Last Seen</th>
              <th className="text-left px-4 py-3 text-dark-400 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-dark-500">Loading...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-dark-500">No devices registered</td></tr>
            ) : list.map((d) => (
              <tr key={d.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary-400" /> {d.name}
                </td>
                <td className="px-4 py-3 text-dark-300">{d.type}</td>
                <td className="px-4 py-3 text-dark-400 font-mono text-xs">{d.fingerprint}</td>
                <td className="px-4 py-3 text-dark-400">{d.last_seen ? new Date(d.last_seen).toLocaleString() : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${d.is_revoked ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {d.is_revoked ? 'Revoked' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!d.is_revoked && (
                    <button onClick={() => handleRevoke(d.id)} className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors" title="Revoke">
                      <Trash2 className="w-3.5 h-3.5" />
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
