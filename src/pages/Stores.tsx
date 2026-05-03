import { useEffect, useState } from 'react';
import { storeService, Store } from '../services/storeService';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await storeService.getStores();
      setStores(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-white">Loading stores...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="font-h1 text-2xl font-semibold text-white mb-8">All Stores</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {stores.map(store => (
            <Link key={store.id} to={`/stores/${store.id}`} className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-500/50 transition-colors gap-4 group">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-600/20">
                    <ShoppingCart className="text-blue-400 w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white">{store.name}</h2>
            </Link>
         ))}
      </div>
    </div>
  );
}
