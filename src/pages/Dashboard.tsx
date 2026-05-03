import { useEffect, useState } from 'react';
import { storeService, Store, Giftcard } from '../services/storeService';
import { ShoppingCart, Gamepad2, Computer, Monitor, ArrowRight, Wallet, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface StoreSummary extends Store {
  totalAvailable: number;
  closestExpiration: number | null;
  activeCardsCount: number;
}

interface ExpiringCard {
  storeName: string;
  storeId: string;
  cardCode: string;
  value: number;
  currency: string;
  expirationDate: number;
}

export default function Dashboard() {
  const [summaries, setSummaries] = useState<StoreSummary[]>([]);
  const [expiringCards, setExpiringCards] = useState<ExpiringCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const stores = await storeService.getStores();
      const summariesData: StoreSummary[] = [];
      const expiring: ExpiringCard[] = [];
      
      const now = Date.now();
      const thirtyDaysFromNow = addDays(new Date(), 30).getTime();
      
      for (const store of stores) {
        const cards = await storeService.getCards(store.id);
        const activeCards = cards.filter(c => !c.used);
        
        const total = activeCards.reduce((acc, curr) => acc + curr.value, 0);
        
        let closestExp: number | null = null;
        activeCards.forEach(c => {
           if (c.expirationDate) {
              if (closestExp === null || c.expirationDate < closestExp) {
                  closestExp = c.expirationDate;
              }
              if (isAfter(new Date(c.expirationDate), new Date(now)) && isBefore(new Date(c.expirationDate), new Date(thirtyDaysFromNow))) {
                  expiring.push({
                      storeName: store.name,
                      storeId: store.id,
                      cardCode: c.code,
                      value: c.value,
                      currency: c.currency,
                      expirationDate: c.expirationDate
                  });
              }
           }
        });

        summariesData.push({
          ...store,
          totalAvailable: total,
          closestExpiration: closestExp,
          activeCardsCount: activeCards.length
        });
      }

      expiring.sort((a,b) => a.expirationDate - b.expirationDate);
      setExpiringCards(expiring);
      setSummaries(summariesData);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalVaultBalance = summaries.reduce((acc, curr) => acc + curr.totalAvailable, 0);

  if (loading) {
    return <div className="text-white">Loading vault...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {expiringCards.length > 0 && (
         <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-3 text-orange-400 font-semibold">
               <AlertTriangle size={20} />
               <span>Expiring Soon</span>
            </div>
            <div className="flex flex-col gap-2">
               {expiringCards.map((ec, i) => (
                  <Link key={i} to={`/store/${ec.storeId}`} className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/40 transition-colors border border-white/5">
                     <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">{ec.storeName}</span>
                        <span className="text-xs font-mono text-gray-400">{ec.cardCode}</span>
                     </div>
                     <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-300 font-mono">{ec.currency} {ec.value.toFixed(2)}</span>
                        <span className="text-orange-400 text-xs">Expires {format(new Date(ec.expirationDate), 'dd MMM yyyy')}</span>
                     </div>
                  </Link>
               ))}
            </div>
         </div>
      )}

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-h1 text-2xl font-semibold text-white mb-2">Overview</h1>
          <p className="font-body-lg text-gray-400">Manage and monitor your digital assets across all stores.</p>
        </div>

        <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex items-center justify-between min-w-[300px] relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-semibold tracking-wider">Total Available Balance</p>
              <div className="flex items-baseline gap-1">
                <span className="font-h2 text-gray-400 text-xl">R$</span>
                <span className="font-display text-4xl font-bold text-blue-400">{totalVaultBalance.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center border border-white/10">
               <Wallet className="text-white" />
            </div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-h2 text-xl font-semibold text-white">Store Summaries</h2>
          <Link to="/stores" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {summaries.length === 0 ? (
          <div className="text-center py-20 bg-[#1a1a1a]/60 backdrop-blur-md border border-white/10 rounded-2xl">
             <p className="text-gray-400 mb-4">No stores or gift cards found.</p>
             <Link to="/add" className="bg-blue-600 text-white shadow-lg shadow-blue-600/20 px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                Add your first Gift Card
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map(store => (
              <Link key={store.id} to={`/stores/${store.id}`} className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col justify-between min-h-[180px] hover:border-blue-500/50 transition-colors relative overflow-hidden cursor-pointer group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-600/20">
                        <ShoppingCart className="text-blue-400 w-5 h-5" />
                      </div>
                      <span className="text-xl font-bold text-white">{store.name}</span>
                    </div>
                    {store.activeCardsCount > 0 && (
                      <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20 font-medium uppercase">Active</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="font-code text-gray-400 text-sm">R$</span>
                      <span className="text-2xl font-mono text-blue-400">{store.totalAvailable.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {store.closestExpiration ? (
                         <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                            <span className="text-[11px] text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                Expires
                            </span>
                            <span className="text-xs font-medium text-gray-300">{format(new Date(store.closestExpiration), 'MMM dd, yyyy')}</span>
                         </div>
                    ) : (
                         <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                            <span className="text-[11px] text-gray-500 uppercase tracking-widest opacity-50 flex items-center gap-1.5">
                                No upcoming expirations
                            </span>
                         </div>
                    )}
                  </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
