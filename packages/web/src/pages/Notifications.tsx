import { useEffect, useState } from 'react';
import { notifications } from '../lib/api';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';

export default function Notifications() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notifications.list().then(setList).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await notifications.markAllRead();
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-dark-400 mt-1">{list.filter((n) => !n.is_read).length} unread</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={markAllRead} className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg text-sm transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-dark-500 text-center py-8">Loading...</p>
        ) : list.length === 0 ? (
          <div className="bg-dark-900 rounded-xl border border-dark-700 p-8 text-center text-dark-500">
            No notifications
          </div>
        ) : list.map((n) => (
          <div key={n.id} className={`bg-dark-900 rounded-xl border p-4 flex items-start gap-3 ${n.is_read ? 'border-dark-800' : 'border-primary-600/30'}`}>
            <Bell className={`w-4 h-4 mt-0.5 ${n.is_read ? 'text-dark-500' : 'text-primary-400'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${n.is_read ? 'text-dark-400' : 'text-white'}`}>{n.title || n.message || 'Notification'}</p>
              {n.message && n.title && <p className="text-xs text-dark-500 mt-1">{n.message}</p>}
              <p className="text-xs text-dark-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            {!n.is_read && (
              <button onClick={async () => { await notifications.markRead(n.id); load(); }} className="text-xs text-primary-400 hover:text-primary-300">
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
