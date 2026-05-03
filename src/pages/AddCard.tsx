import { useState, useEffect, FormEvent } from 'react';
import { storeService, Store } from '../services/storeService';
import { useNavigate } from 'react-router-dom';
import { Lock, Store as StoreIcon } from 'lucide-react';
import clsx from 'clsx';

export default function AddCard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [value, setValue] = useState('');
  const [expiry, setExpiry] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await storeService.getStores();
      setStores(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      let targetStoreId = selectedStoreId;

      let targetStoreName = "";

      if (selectedStoreId === 'new') {
         if (!newStoreName.trim()) throw new Error("Store name required");
         targetStoreName = newStoreName.trim();
         targetStoreId = await storeService.createStore(targetStoreName);
      } else {
         const s = stores.find(s => s.id === selectedStoreId);
         if (s) targetStoreName = s.name;
      }

      if (!targetStoreId) throw new Error("No store selected");

      await storeService.createCard(targetStoreId, targetStoreName, {
         code,
         password: pin || undefined,
         value: parseFloat(value),
         currency: 'BRL',
         used: false,
         expirationDate: expiry ? new Date(expiry).getTime() : null
      });

      navigate(`/stores/${targetStoreId}`);
    } catch (err) {
      console.error(err);
      alert("Error saving: " + err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-white/10 rounded-none py-2 px-0 focus:ring-0 focus:border-blue-500 text-white transition-colors shadow-none placeholder-gray-600";

  return (
    <div className="flex items-center justify-center p-4 w-full max-w-7xl mx-auto">
      <div className="w-full max-w-2xl bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative z-0">
        
        <div className="px-6 sm:px-10 pt-10 pb-6 border-b border-white/5 bg-[#1a1a1a]/40">
          <h1 className="font-h1 text-2xl font-semibold text-white m-0 p-0 mb-1">Add New Gift Card</h1>
          <p className="text-gray-400 text-sm m-0 p-0">Securely store your card details to access them anytime.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:px-10 sm:py-8 flex flex-col gap-8">
           
           <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Store / Merchant</label>
              <select disabled={loading} value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)} required className={clsx(inputClass, "font-h2 text-lg appearance-none cursor-pointer")} >
                  <option value="" disabled className="bg-[#1a1a1a] text-gray-500">Select existing or create new...</option>
                  {stores.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#1a1a1a] text-white">{s.name}</option>
                  ))}
                  <option value="new" className="bg-[#1a1a1a] text-blue-400 font-bold">+ Create New Store</option>
              </select>
              {selectedStoreId === 'new' && (
                  <input type="text" placeholder="Enter new store name..." required value={newStoreName} onChange={e => setNewStoreName(e.target.value)} className={clsx(inputClass, "font-h2 text-lg mt-2")} autoFocus />
              )}
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex justify-between">
                 Card Number / Claim Code *
                 <span className="text-red-400 normal-case tracking-normal">Required</span>
              </label>
              <input type="text" required value={code} onChange={e => setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" className={clsx(inputClass, "font-code tracking-[0.15em]")} />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex justify-between">
                    Security PIN
                    <span className="text-gray-600 normal-case tracking-normal">Optional</span>
                 </label>
                 <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" className={clsx(inputClass, "font-code")} />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Initial Balance</label>
                 <div className="relative flex items-center">
                    <span className="absolute left-0 text-gray-600 font-h2 pb-2">R$</span>
                    <input type="number" step="0.01" min="0" required value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" className={clsx(inputClass, "font-h2 text-lg pl-8 text-right")} />
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-2 w-full sm:w-1/2">
               <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex justify-between">
                  Expiration Date
                  <span className="text-gray-600 normal-case tracking-normal">Optional</span>
               </label>
               <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className={clsx(inputClass, "font-body-lg [&::-webkit-calendar-picker-indicator]:filter-[invert(1)] [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer")} />
           </div>

           {/* Actions */}
           <div className="mt-4 pt-6 border-t border-white/5 flex items-center justify-end gap-4">
              <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 font-semibold text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                  Cancel
              </button>
              <button disabled={saving} type="submit" className="px-6 py-2.5 font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20">
                 {saving ? "Saving..." : <><Lock size={16} /> Save Gift Card</>}
              </button>
           </div>
        </form>
      </div>
    </div>
  )
}
