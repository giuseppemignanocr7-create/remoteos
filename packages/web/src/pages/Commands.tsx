import { useState } from 'react';
import { commands, devices } from '../lib/api';
import { Terminal, Play, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useEffect } from 'react';

export default function Commands() {
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [action, setAction] = useState('run_command');
  const [params, setParams] = useState('{"command": "echo hello"}');
  const [timeout, setTimeout_] = useState(30000);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    devices.list().then((d) => {
      setDeviceList(d.filter((x: any) => !x.is_revoked));
      if (d.length > 0) setSelectedDevice(d[0].id);
    }).catch(() => {});
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const parsedParams = JSON.parse(params);
      const cmd = await commands.create({
        session_id: '00000000-0000-0000-0000-000000000000',
        pc_device_id: selectedDevice,
        action,
        params: parsedParams,
        timeout_ms: timeout,
      });
      setResult(cmd);
      setHistory((h) => [cmd, ...h].slice(0, 20));

      // Poll for result
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const updated = await commands.get(cmd.id);
          setResult(updated);
          if (['success', 'error', 'cancelled', 'timeout'].includes(updated.status)) {
            clearInterval(poll);
            setHistory((h) => [updated, ...h.slice(1)]);
          }
        } catch {}
        if (attempts > 60) clearInterval(poll);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'error': case 'timeout': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-dark-400" />;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'success': return 'bg-green-500/10 text-green-400';
      case 'error': case 'timeout': return 'bg-red-500/10 text-red-400';
      case 'running': return 'bg-blue-500/10 text-blue-400';
      default: return 'bg-dark-700 text-dark-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Commands</h1>
        <p className="text-dark-400 mt-1">Execute remote commands on your devices</p>
      </div>

      <form onSubmit={handleSend} className="bg-dark-900 rounded-xl border border-dark-700 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-dark-300 mb-1">Device</label>
            <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
              {deviceList.length === 0 && <option value="">No devices</option>}
              {deviceList.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.fingerprint})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1">Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
              {['run_command', 'git_status', 'git_pull', 'git_commit', 'get_system_stats', 'get_processes', 'kill_process', 'read_file', 'read_log', 'write_file', 'list_files'].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1">Timeout (ms)</label>
            <input type="number" value={timeout} onChange={(e) => setTimeout_(+e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-dark-300 mb-1">Parameters (JSON)</label>
          <textarea value={params} onChange={(e) => setParams(e.target.value)} rows={3} className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}

        <button type="submit" disabled={loading || !selectedDevice} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Execute
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary-400" /> Command Result
            </h3>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(result.status)}`}>
              {result.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><p className="text-dark-400 text-xs">ID</p><p className="text-white font-mono text-xs truncate">{result.id}</p></div>
            <div><p className="text-dark-400 text-xs">Action</p><p className="text-white">{result.action}</p></div>
            <div><p className="text-dark-400 text-xs">Exit Code</p><p className="text-white">{result.exit_code ?? '—'}</p></div>
            <div><p className="text-dark-400 text-xs">Duration</p><p className="text-white">{result.duration_ms ? `${result.duration_ms}ms` : '—'}</p></div>
          </div>
          {result.output && (
            <pre className="bg-dark-950 border border-dark-700 rounded-lg p-4 text-sm text-green-300 font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">{result.output}</pre>
          )}
          {result._warning && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-lg px-4 py-3">{result._warning}</div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Commands</h3>
          <div className="space-y-2">
            {history.map((cmd, i) => (
              <div key={`${cmd.id}-${i}`} className="flex items-center gap-3 py-2 px-3 bg-dark-800 rounded-lg">
                {statusIcon(cmd.status)}
                <span className="text-sm text-white font-medium">{cmd.action}</span>
                <span className="text-xs text-dark-400 font-mono truncate flex-1">{cmd.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(cmd.status)}`}>{cmd.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
