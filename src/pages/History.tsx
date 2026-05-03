import { useEffect, useState } from 'react';
import { HistoryEvent, storeService } from '../services/storeService';
import { ShoppingCart, Activity, ArrowDownLeft, ArrowUpRight, Trash2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export default function History() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
       const data = await storeService.getHistory();
       setEvents(data);
       setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-white">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-h1 text-2xl font-semibold text-white mb-2">History Log</h1>
      <p className="text-gray-400 font-body-lg mb-8">Detailed log of all actions on your gift cards and store credits.</p>

      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        {events.length === 0 ? (
           <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <CalendarClock size={48} className="mb-4 opacity-50" />
              <p>No history available yet.</p>
           </div>
        ) : (
           <div className="divide-y divide-white/5">
             {events.map(event => {
                let icon = <Activity className="text-gray-400" />;
                let colorClass = "text-gray-400";
                let actionText = "Modified";

                if (event.action === 'added') {
                   icon = <ArrowDownLeft className="text-blue-400" size={20} />;
                   colorClass = "text-blue-400";
                   actionText = "Added Card";
                } else if (event.action === 'used_partial') {
                   icon = <ArrowUpRight className="text-orange-400" size={20} />;
                   colorClass = "text-orange-400";
                   actionText = "Partial Use";
                } else if (event.action === 'used_full') {
                   icon = <ArrowUpRight className="text-green-400" size={20} />;
                   colorClass = "text-green-400";
                   actionText = "Fully Used";
                } else if (event.action === 'deleted') {
                   icon = <Trash2 className="text-red-400" size={20} />;
                   colorClass = "text-red-400";
                   actionText = "Deleted Card";
                }

                return (
                  <div key={event.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            {icon}
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                               <span className={clsx("font-semibold text-sm", colorClass)}>{actionText}</span>
                               <span className="text-gray-500 text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{event.storeName}</span>
                           </div>
                           <div className="text-gray-400 text-sm font-mono">{event.giftcardCode}</div>
                        </div>
                     </div>
                     <div className="text-right">
                         <div className="text-white font-mono font-medium">
                            {event.amount ? (
                               event.action === 'added' ? `+ R$ ${event.amount.toFixed(2).replace('.', ',')}` :
                               `- R$ ${event.amount.toFixed(2).replace('.', ',')}`
                            ) : '-'}
                         </div>
                         <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{format(new Date(event.createdAt), 'dd MMM yyyy, HH:mm')}</div>
                     </div>
                  </div>
                )
             })}
           </div>
        )}
      </div>
    </div>
  )
}
