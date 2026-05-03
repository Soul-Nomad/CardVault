import { useState, FormEvent, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storeService, Store, Giftcard } from '../services/storeService';
import { ShoppingCart, Copy, Trash2, Check, Filter, Plus, ExternalLink, X } from 'lucide-react';
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

  // Edit Link Modal State
  const [editLinkOpen, setEditLinkOpen] = useState(false);
  const [storeLinkInput, setStoreLinkInput] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = () => {
    pressTimerRef.current = setTimeout(() => {
        setStoreLinkInput(store?.link || '');
        setEditLinkOpen(true);
    }, 500); // 500ms hold
  };

  const cancelPress = () => {
    if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
    }
  };

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

  const handleSaveLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!storeId || !store) return;
    try {
        setIsSavingLink(true);
        await storeService.updateStore(storeId, { link: storeLinkInput });
        setStore({ ...store, link: storeLinkInput });
        setEditLinkOpen(false);
    } catch(err) {
        console.error("Failed to save link", err);
    } finally {
        setIsSavingLink(false);
    }
  };

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
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                 <h1 className="font-display text-4xl font-bold text-white max-w-full break-all">{store.name}</h1>
                 {store.link ? (
                    <div className="relative group/link flex items-center">
                       <a href={store.link} target="_blank" rel="noopener noreferrer" 
                          onPointerDown={startPress}
                          onPointerUp={cancelPress}
                          onPointerLeave={cancelPress}
                          onContextMenu={(e) => {
                             // allow default context menu on links, long press will open our modal
                             // if user holds, our modal will overlay 
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition-colors select-none">
                          <ExternalLink size={20} />
                       </a>
                       <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible md:group-hover/link:opacity-100 md:group-hover/link:visible transition-all z-50">
                           <button onClick={() => { setStoreLinkInput(store.link || ''); setEditLinkOpen(true); }} className="bg-black/90 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-white shadow-xl flex items-center gap-2 whitespace-nowrap hover:bg-black transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>
                              Edit Link
                           </button>
                       </div>
                    </div>
                 ) : (
                    <button onClick={() => { setStoreLinkInput(''); setEditLinkOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors text-sm font-medium">
                       <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>
                       <span>Add Link</span>
                    </button>
                 )}
              </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {cards.map(card => {
            const isExpired = card.expirationDate && card.expirationDate < Date.now();
            const status = card.used ? 'used' : isExpired ? 'expired' : 'active';
            
            return (
               <div key={card.id} className={clsx(
                  "relative p-5 rounded-2xl border transition-all duration-200 group flex flex-col gap-4",
                  status === 'used' ? 'bg-[#1a1a1a]/20 border-white/5 opacity-60 grayscale' : 
                  status === 'expired' ? 'bg-red-500/5 border-red-500/10 opacity-80' : 
                  'bg-[#1a1a1a]/60 border-white/10 hover:bg-[#1a1a1a]/80 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 backdrop-blur-sm'
               )}>
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 flex gap-2">
                     {status === 'active' && card.value < (card.originalValue || card.value) && (
                         <span className="text-orange-400 px-2.5 py-1 rounded-full bg-orange-500/10 text-[10px] font-bold uppercase tracking-wider">
                            Partial
                         </span>
                     )}
                     {status === 'active' && card.value >= (card.originalValue || card.value) && (
                         <span className="text-green-500 px-2.5 py-1 rounded-full bg-green-500/10 text-[10px] font-bold uppercase tracking-wider">
                            Active
                         </span>
                     )}
                     {status === 'used' && (
                         <span className="text-gray-400 px-2.5 py-1 rounded-full bg-gray-500/10 text-[10px] font-bold uppercase tracking-wider">
                            Used
                         </span>
                     )}
                     {status === 'expired' && (
                         <span className="text-red-400 px-2.5 py-1 rounded-full bg-red-500/10 text-[10px] font-bold uppercase tracking-wider">
                            Expired
                         </span>
                     )}
                  </div>

                  {/* Card Values */}
                  <div className="mt-2">
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Balance</p>
                     <p className={clsx("font-display text-3xl font-bold tracking-tight", status === 'used' ? "text-gray-400 line-through" : "text-white")}>
                        <span className="text-xl text-gray-500 font-medium mr-1">{card.currency}</span>
                        {card.value.toFixed(2).replace('.', ',')}
                     </p>
                     {card.originalValue && card.originalValue > card.value && !card.used && (
                         <p className="text-xs text-gray-400 mt-1">
                            was {card.currency} {card.originalValue.toFixed(2).replace('.', ',')}
                         </p>
                     )}
                  </div>

                  {/* Card Code */}
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5 relative group/code mt-auto">
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Gift Card Code</p>
                     <div className="flex justify-between items-center">
                        <span className={clsx("font-mono text-sm tracking-widest", status === 'used' ? "text-gray-500 line-through" : "text-blue-100")}>
                           {card.code}
                        </span>
                        {status !== 'used' && (
                           <button className="text-gray-400 hover:text-white transition-colors p-2 -mr-2 -my-2 rounded-lg" title="Copy Code">
                              <Copy size={16} />
                           </button>
                        )}
                     </div>
                     {card.password && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                           <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">PIN / Password</span>
                           <span className="text-xs font-mono text-gray-400">{card.password}</span>
                        </div>
                     )}
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                     <div className="text-xs">
                        <span className="text-gray-500 block mb-0.5">Expires</span>
                        <span className={clsx("font-medium", isExpired && !card.used ? "text-red-400" : "text-gray-300")}>
                           {card.expirationDate ? format(new Date(card.expirationDate), 'dd MMM yyyy') : 'No expiry'}
                        </span>
                     </div>
                     <div className="flex items-center gap-2">
                        {status === 'active' && (
                            <button onClick={() => handleMarkUsed(card)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 font-semibold text-[13px] px-3 py-1.5 rounded-lg transition-colors">
                              Use Card
                            </button>
                        )}
                        <button onClick={() => handleDelete(card)} className="text-gray-500/50 hover:text-red-400 hover:bg-red-500/10 transition-colors p-1.5 rounded-lg" title="Delete Card">
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
               </div>
            )
         })}
      </div>
      
      {cards.length === 0 && (
         <div className="p-8 text-center bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/10 rounded-2xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
               <ShoppingCart className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 font-medium">No gift cards added to this store yet.</p>
         </div>
      )}

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

      {/* Edit Link Modal */}
      {editLinkOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-[420px] shadow-2xl relative">
               <h3 className="text-xl font-bold text-white mb-2">Edit Store Link</h3>
               <p className="text-sm text-gray-400 mb-6">Add a link to the store's website or app to access it quickly.</p>
               
               <form onSubmit={handleSaveLink} className="flex flex-col gap-1">
                  <div className="mb-4">
                     <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mb-2">Store URL</label>
                     <div className="relative flex items-center">
                        <input type="url" value={storeLinkInput} onChange={e => setStoreLinkInput(e.target.value)} placeholder="https://" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:ring-0 focus:border-blue-500 text-white shadow-inner transition-colors" />
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                     <button type="button" onClick={() => setEditLinkOpen(false)} className="px-5 py-2.5 font-semibold text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm">Cancel</button>
                     <button type="submit" disabled={isSavingLink} className="px-5 py-2.5 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50">
                        {isSavingLink ? "Saving..." : "Save Link"}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  )
}

