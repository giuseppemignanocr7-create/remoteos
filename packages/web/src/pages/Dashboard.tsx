import { useEffect, useState } from 'react';
import { health, devices, sessions, notifications } from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  Activity,
  Monitor,
  ScrollText,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
} from 'lucide-react';

interface ServerHealth {
  status: string;
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    health.check().then(setServerHealth).catch(() => setError('Server unreachable'));
    devices.list().then(setDeviceList).catch(() => {});
    sessions.list().then(setSessionList).catch(() => {});
    notifications.list().then(setNotifList).catch(() => {});
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const stats = [
    {
      label: 'Server Status',
      value: serverHealth?.status === 'ok' ? 'Online' : 'Offline',
      icon: serverHealth?.status === 'ok' ? CheckCircle2 : XCircle,
      color: serverHealth?.status === 'ok' ? 'text-green-400' : 'text-red-400',
      bg: serverHealth?.status === 'ok' ? 'bg-green-400/10' : 'bg-red-400/10',
    },
    {
      label: 'Uptime',
      value: serverHealth ? formatUptime(serverHealth.uptime) : '—',
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Devices',
      value: deviceList.length.toString(),
      icon: Monitor,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Active Sessions',
      value: sessionList.filter((s) => s.is_active).length.toString(),
      icon: ScrollText,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Unread Notifications',
      value: notifList.filter((n) => !n.is_read).length.toString(),
      icon: Bell,
      color: 'text-pink-400',
      bg: 'bg-pink-400/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 mt-1">Welcome back, {user?.full_name}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-dark-900 rounded-xl border border-dark-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <span className="text-sm text-dark-400">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Server info */}
      {serverHealth && (
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary-400" />
            Server Info
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-dark-400">Service</p>
              <p className="text-sm text-white font-medium">{serverHealth.service}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400">Version</p>
              <p className="text-sm text-white font-medium">{serverHealth.version}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400">Uptime</p>
              <p className="text-sm text-white font-medium">{formatUptime(serverHealth.uptime)}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400">Last Check</p>
              <p className="text-sm text-white font-medium">{new Date(serverHealth.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent devices */}
      {deviceList.length > 0 && (
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary-400" />
            Your Devices
          </h2>
          <div className="space-y-3">
            {deviceList.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className={`w-4 h-4 ${d.is_revoked ? 'text-red-400' : 'text-green-400'}`} />
                  <div>
                    <p className="text-sm text-white font-medium">{d.name}</p>
                    <p className="text-xs text-dark-400">{d.fingerprint}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${d.is_revoked ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                  {d.is_revoked ? 'Revoked' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
