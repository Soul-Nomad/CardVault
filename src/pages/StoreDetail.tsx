import { useState, FormEvent, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storeService, Store, Giftcard } from '../services/storeService';
import { ShoppingCart, Copy, Trash2, Check, Filter, Plus } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function StoreDetail() {
  const { storeId } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [cards, setCards] = useState<Giftcard[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use Card Modal State
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [cardToUse, setCardToUse] = useState<Giftcard | null>(null);
  const [useType, setUseType] = useState<'full' | 'partial'>('full');
  const [useAmount, setUseAmount] = useState('');
  const [isUsing, setIsUsing] = useState(false);

  useEffect(() => {
    async function load() {
      if (!storeId) return;
      
      const s = await storeService.getStore(storeId);
      if (s) {
        setStore(s);
        const c = await storeService.getCards(storeId);
        c.sort((a, b) => {
           if (!a.expirationDate) return 1;
           if (!b.expirationDate) return -1;
           return a.expirationDate - b.expirationDate;
        });
        setCards(c);
      }
      setLoading(false);
    }
    load();
  }, [storeId]);

  const handleMarkUsed = (card: Giftcard) => {
     setCardToUse(card);
     setUseType('full');
     setUseAmount(card.value.toString());
     setUseModalOpen(true);
  };

  const confirmUseCard = async (e: FormEvent) => {
      e.preventDefault();
      if (!storeId || !store || !cardToUse) return;
      try {
         setIsUsing(true);
         const amount = parseFloat(useAmount);
         const isFull = useType === 'full' || amount >= cardToUse.value;
         
         await storeService.updateCardUsedStatus(
            storeId, 
            store.name, 
            cardToUse.id, 
            cardToUse.code, 
            isFull, 
            amount, 
            cardToUse.value
         );
         
         setCards(prev => prev.map(c => {
             if (c.id === cardToUse.id) {
                 return { ...c, used: isFull, value: isFull ? c.value - amount : c.value - amount };
             }
             return c;
         }));
         setUseModalOpen(false);
      } catch(err) {
          console.error("Failed to update status", err);
      } finally {
          setIsUsing(false);
      }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<Giftcard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (card: Giftcard) => {
     setCardToDelete(card);
     setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (!storeId || !store || !cardToDelete) return;
      try {
         setIsDeleting(true);
         await storeService.deleteCard(storeId, store.name, cardToDelete.id, cardToDelete.code);
         setCards(prev => prev.filter(c => c.id !== cardToDelete.id));
         setDeleteModalOpen(false);
      } catch(e) {
          console.error("Failed to delete", e);
      } finally {
          setIsDeleting(false);
      }
  };

  if (loading) return <div className="text-white">Loading store...</div>;
  if (!store) return <div className="text-white">Store not found</div>;

  const totalAvailable = cards.filter(c => !c.used).reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="max-w-[1200px] w-full mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600/20 rounded-xl border border-blue-600/20 flex items-center justify-center p-3">
               <ShoppingCart className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold text-white mb-2">{store.name}</h1>
              <div className="flex items-center gap-2">
                <span className="font-body-sm text-gray-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {cards.filter(c => !c.used).length} Active Cards</span>
              </div>
            </div>
        </div>
        <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Available Balance</p>
            <p className="font-display text-3xl font-bold text-blue-400">R$ {totalAvailable.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
         <div className="relative w-full sm:w-72">
             <input type="text" placeholder="Search codes..." disabled className="w-full bg-[#1a1a1a]/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 opacity-50 cursor-not-allowed" />
         </div>
         <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link to="/add" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto justify-center">
                <Plus size={18} />
                Add Card
            </Link>
         </div>
      </div>

      <div className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/5">
                      <th className="p-4 font-medium">Code</th>
                      <th className="p-4 font-medium">Value</th>
                      <th className="p-4 font-medium cursor-pointer hover:text-white">Expiry Date</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="text-sm divide-y divide-white/5">
                  {cards.map(card => {
                      const isExpired = card.expirationDate && card.expirationDate < Date.now();
                      const status = card.used ? 'used' : isExpired ? 'expired' : 'active';
                      
                      return (
                      <tr key={card.id} className={clsx("transition-colors group", 
                          status === 'used' ? 'bg-white/[0.02] opacity-50 grayscale' : 
                          status === 'expired' ? 'bg-red-500/5 opacity-80' : 'hover:bg-white/5'
                      )}>
                         <td className="p-4">
                             <div className="flex items-center gap-3">
                                <span className={clsx("font-mono", status === 'used' ? "text-gray-400 line-through" : "text-gray-300")}>{card.code}</span>
                                {status !== 'used' && (
                                   <button className="text-gray-400 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" title="Copy Code">
                                      <Copy size={16} />
                                   </button>
                                )}
                             </div>
                             {card.password && (
                                 <span className="text-[11px] text-gray-500 font-mono block mt-1">PWD: {card.password}</span>
                             )}
                         </td>
                         <td className={clsx("p-4", status === 'used' ? "text-gray-400 line-through" : "text-white")}>
                            {card.currency} {card.value.toFixed(2).replace('.', ',')}
                            {card.originalValue && card.originalValue > card.value && !card.used && (
                                <span className="block text-[10px] text-gray-500 line-through mt-0.5">was {card.currency} {card.originalValue.toFixed(2).replace('.', ',')}</span>
                            )}
                         </td>
                         <td className={clsx("p-4", isExpired && !card.used ? "text-red-400" : "text-gray-400")}>
                            {card.expirationDate ? format(new Date(card.expirationDate), 'dd/MM/yyyy') : 'Não expira'}
                         </td>
                         <td className="p-4">
                            {status === 'active' && card.value < (card.originalValue || card.value) && (
                                <span className="text-orange-400 px-2 py-1 rounded bg-orange-500/10 text-[10px] font-bold uppercase tracking-wider mr-2">
                                   Partial
                                </span>
                            )}
                            {status === 'active' && card.value >= (card.originalValue || card.value) && (
                                <span className="text-green-500 px-2 py-1 rounded bg-green-500/10 text-[10px] font-bold uppercase tracking-wider mr-2">
                                   Active
                                </span>
                            )}
                            {status === 'used' && (
                                <span className="text-gray-400 px-2 py-1 rounded bg-gray-500/10 text-[10px] font-bold uppercase tracking-wider mr-2">
                                   Used
                                </span>
                            )}
                            {status === 'expired' && (
                                <span className="text-red-400 px-2 py-1 rounded bg-red-500/10 text-[10px] font-bold uppercase tracking-wider mr-2">
                                   Expired
                                </span>
                            )}
                         </td>
                         <td className="p-4 text-right flex items-center justify-end gap-3">
                            {status === 'active' && (
                                <button onClick={() => handleMarkUsed(card)} className="text-blue-500 hover:text-blue-400 font-medium text-sm">
                                  Use Card
                                </button>
                            )}
                            <button onClick={() => handleDelete(card)} className="text-gray-500 hover:text-red-400 transition-colors p-1" title="Delete Card">
                               <Trash2 size={16} />
                            </button>
                         </td>
                      </tr>
                    )
                  })}
               </tbody>
            </table>
            {cards.length === 0 && (
                <div className="p-6 text-center text-gray-500 border-t border-white/5">
                    No gift cards added yet.
                </div>
            )}
         </div>
      </div>

      {/* Use Card Modal */}
      {useModalOpen && cardToUse && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-[420px] shadow-2xl relative">
               <h3 className="text-xl font-bold text-white mb-2">Mark Card as Used</h3>
               <p className="text-sm text-gray-400 mb-6">How much of the {cardToUse.currency} {cardToUse.value.toFixed(2)} balance was used?</p>
               
               <form onSubmit={confirmUseCard} className="flex flex-col gap-1">
                  <div className="flex gap-4 mb-4">
                     <label className="flex-1 cursor-pointer">
                        <input type="radio" name="useType" value="full" checked={useType === 'full'} onChange={() => { setUseType('full'); setUseAmount(cardToUse.value.toString()); }} className="peer sr-only" />
                        <div className="p-3 rounded-xl border border-white/10 text-center peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-blue-400 text-gray-400 transition-all hover:bg-white/5">
                           <div className="font-semibold text-sm">Full Amount</div>
                        </div>
                     </label>
                     <label className="flex-1 cursor-pointer">
                        <input type="radio" name="useType" value="partial" checked={useType === 'partial'} onChange={() => { setUseType('partial'); setUseAmount(''); }} className="peer sr-only" />
                        <div className="p-3 rounded-xl border border-white/10 text-center peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-blue-400 text-gray-400 transition-all hover:bg-white/5">
                           <div className="font-semibold text-sm">Partial Amount</div>
                        </div>
                     </label>
                  </div>

                  {useType === 'partial' && (
                     <div className="mb-4">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mb-2">Amount Used</label>
                        <div className="relative flex items-center">
                           <span className="absolute left-4 text-gray-500">R$</span>
                           <input type="number" step="0.01" min="0.01" max={cardToUse.value} required value={useAmount} onChange={e => setUseAmount(e.target.value)} placeholder="0.00" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-0 focus:border-blue-500 text-white shadow-inner transition-colors" />
                        </div>
                     </div>
                  )}

                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                     <button type="button" onClick={() => setUseModalOpen(false)} className="px-5 py-2.5 font-semibold text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm">Cancel</button>
                     <button type="submit" disabled={isUsing} className="px-5 py-2.5 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50">
                        {isUsing ? "Saving..." : "Confirm"}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Delete Card Modal */}
      {deleteModalOpen && cardToDelete && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-[420px] shadow-2xl relative">
               <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/20">
                  <Trash2 className="text-red-400" size={24} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Delete Card</h3>
               <p className="text-sm text-gray-400 mb-6">Are you sure you want to delete this {cardToDelete.currency} {cardToDelete.value.toFixed(2)} card? This action cannot be undone.</p>
               
               <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setDeleteModalOpen(false)} className="px-5 py-2.5 font-semibold text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm disabled:opacity-50" disabled={isDeleting}>Cancel</button>
                  <button type="button" onClick={confirmDelete} disabled={isDeleting} className="px-5 py-2.5 font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50">
                     {isDeleting ? "Deleting..." : "Delete Card"}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  )
}
