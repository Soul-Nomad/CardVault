import { useEffect, useState } from 'react';
import { HistoryEvent, storeService } from '../services/storeService';
import { ShoppingCart, Activity, ArrowDownLeft, ArrowUpRight, Trash2, CalendarClock, X } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export default function History() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
       const data = await storeService.getHistory();
       setEvents(data);
       setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event from history?')) return;
    try {
      setIsDeleting(id);
      await storeService.deleteHistoryEvent(id);
      setEvents(events.filter(e => e.id !== id));
    } catch(err) {
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your entire history? This cannot be undone.')) return;
    try {
      setLoading(true);
      await storeService.clearHistory();
      setEvents([]);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && events.length === 0) return <div className="text-white">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
         <div>
            <h1 className="font-h1 text-2xl font-semibold text-white mb-2">History Log</h1>
            <p className="text-gray-400 font-body-lg">Detailed log of all actions on your gift cards and store credits.</p>
         </div>
         {events.length > 0 && (
            <button onClick={handleClearHistory} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors font-medium text-sm flex items-center gap-2">
               <Trash2 size={16} />
               Clear History
            </button>
         )}
      </div>

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
                  <div key={event.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 transition-colors group gap-3">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex flex-wrap items-center gap-2 mb-1">
                               <span className={clsx("font-semibold text-sm", colorClass)}>{actionText}</span>
                               <span className="text-gray-500 text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 truncate max-w-[120px] sm:max-w-none">{event.storeName}</span>
                           </div>
                           <div className="text-gray-400 text-xs sm:text-sm font-mono truncate">{event.giftcardCode}</div>
                        </div>
                     </div>
                     <div className="flex sm:flex-col justify-between items-end sm:items-end w-full sm:w-auto ml-14 sm:ml-0">
                         <div className="flex items-center gap-4">
                            <div className="text-white font-mono font-medium text-sm sm:text-base">
                               {event.amount ? (
                                  event.action === 'added' ? `+ R$ ${event.amount.toFixed(2).replace('.', ',')}` :
                                  `- R$ ${event.amount.toFixed(2).replace('.', ',')}`
                               ) : '-'}
                            </div>
                            <button onClick={() => handleDelete(event.id)} disabled={isDeleting === event.id} className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all flex sm:hidden group-hover:sm:flex">
                              <X size={16} />
                            </button>
                         </div>
                         <div className="text-[10px] sm:text-xs text-gray-500 mt-1 uppercase tracking-widest">{format(new Date(event.createdAt), 'dd MMM yyyy, HH:mm')}</div>
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
