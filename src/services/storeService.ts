import { db, auth } from '../firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';

export interface Store {
  id: string;
  name: string;
  createdAt: number;
}

export interface Giftcard {
  id: string;
  code: string;
  password?: string;
  value: number;
  originalValue?: number;
  currency: string;
  expirationDate?: number | null;
  used: boolean;
  createdAt: number;
}

export interface HistoryEvent {
  id: string;
  storeName: string;
  giftcardCode: string;
  giftcardId: string;
  action: 'added' | 'used_partial' | 'used_full' | 'deleted';
  amount?: number;
  createdAt: number;
}

export const storeService = {
  getStores: async (): Promise<Store[]> => {
    if (!auth.currentUser) return [];
    
    try {
      const storesRef = collection(db, 'users', auth.currentUser.uid, 'stores');
      const storeSnap = await getDocs(storesRef);
      return storeSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        createdAt: doc.data().createdAt?.toMillis() || Date.now()
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getStore: async (storeId: string): Promise<Store | null> => {
     if (!auth.currentUser) return null;
     
     try {
       const storeRef = doc(db, 'users', auth.currentUser.uid, 'stores', storeId);
       const storeSnap = await getDoc(storeRef);
       if(storeSnap.exists()) {
           return {
               id: storeSnap.id,
               name: storeSnap.data().name,
               createdAt: storeSnap.data().createdAt?.toMillis() || Date.now()
           }
       }
       return null;
     } catch (e) {
       console.error(e);
       return null;
     }
  },

  createStore: async (name: string): Promise<string> => {
    if (!auth.currentUser) throw new Error('Not logged in');
    
    // Create random ID for new store
    const storeRef = doc(collection(db, 'users', auth.currentUser.uid, 'stores'));
    await setDoc(storeRef, {
      name,
      createdAt: serverTimestamp()
    });
    return storeRef.id;
  },

  getCards: async (storeId: string): Promise<Giftcard[]> => {
    if (!auth.currentUser) return [];

    try {
      const cardsRef = collection(db, 'users', auth.currentUser.uid, 'stores', storeId, 'giftcards');
      const querySnap = await getDocs(cardsRef);
      return querySnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          code: data.code,
          password: data.password,
          value: data.value,
          originalValue: data.originalValue,
          currency: data.currency || 'BRL',
          expirationDate: data.expirationDate ? data.expirationDate.toMillis() : null,
          used: data.used,
          createdAt: data.createdAt?.toMillis() || Date.now()
        };
      });
    } catch(e) {
      console.error(e);
      return [];
    }
  },
  
  createCard: async (storeId: string, storeName: string, card: Omit<Giftcard, 'id' | 'createdAt'>): Promise<string> => {
     if (!auth.currentUser) throw new Error('Not logged in');
    
     const cardRef = doc(collection(db, 'users', auth.currentUser.uid, 'stores', storeId, 'giftcards'));
     
     const data: any = {
        code: card.code,
        value: card.value,
        originalValue: card.originalValue ?? card.value,
        currency: card.currency,
        used: card.used,
        createdAt: serverTimestamp()
     };

     if (card.password) {
         data.password = card.password;
     }
     if (card.expirationDate) {
         data.expirationDate = Timestamp.fromMillis(card.expirationDate);
     }

     const historyRef = doc(collection(db, 'users', auth.currentUser.uid, 'history'));
     const historyData = {
         storeName,
         giftcardCode: card.code,
         giftcardId: cardRef.id,
         action: 'added',
         amount: card.value,
         createdAt: serverTimestamp()
     };

     const batch = writeBatch(db);
     batch.set(cardRef, data);
     batch.set(historyRef, historyData);
     await batch.commit();

     return cardRef.id;
  },

  updateCardUsedStatus: async (storeId: string, storeName: string, cardId: string, cardCode: string, used: boolean, amount?: number, currentValue?: number) => {
    if (!auth.currentUser) throw new Error('Not logged in');
    
    const cardRef = doc(db, 'users', auth.currentUser.uid, 'stores', storeId, 'giftcards', cardId);
    let cardUpdateData: any = { used };
    
    let action = 'used_full';
    if (!used && amount !== undefined && currentValue !== undefined) {
      cardUpdateData = { value: currentValue - amount };
      action = 'used_partial';
    } else if (used && amount !== undefined && currentValue !== undefined) {
      cardUpdateData = { value: currentValue - amount, used: true };
    }

    const historyRef = doc(collection(db, 'users', auth.currentUser.uid, 'history'));
    const historyData: any = {
        storeName,
        giftcardCode: cardCode,
        giftcardId: cardId,
        action,
        createdAt: serverTimestamp()
    };
    if (amount !== undefined) {
       historyData.amount = amount;
    }

    const batch = writeBatch(db);
    batch.update(cardRef, cardUpdateData);
    batch.set(historyRef, historyData);
    await batch.commit();
  },

  deleteCard: async (storeId: string, storeName: string, cardId: string, cardCode: string) => {
    if (!auth.currentUser) throw new Error('Not logged in');
    
    const cardRef = doc(db, 'users', auth.currentUser.uid, 'stores', storeId, 'giftcards', cardId);
    
    const historyRef = doc(collection(db, 'users', auth.currentUser.uid, 'history'));
    const historyData = {
        storeName,
        giftcardCode: cardCode,
        giftcardId: cardId,
        action: 'deleted',
        createdAt: serverTimestamp()
    };

    const batch = writeBatch(db);
    batch.delete(cardRef);
    batch.set(historyRef, historyData);
    await batch.commit();
  },
  
  getHistory: async (): Promise<HistoryEvent[]> => {
    if (!auth.currentUser) return [];
    try {
      const historyRef = collection(db, 'users', auth.currentUser.uid, 'history');
      const querySnap = await getDocs(historyRef);
      const events = querySnap.docs.map(doc => {
        const data = doc.data();
        return {
           id: doc.id,
           storeName: data.storeName,
           giftcardCode: data.giftcardCode,
           giftcardId: data.giftcardId,
           action: data.action,
           amount: data.amount,
           createdAt: data.createdAt?.toMillis() || Date.now()
        } as HistoryEvent;
      });
      return events.sort((a, b) => b.createdAt - a.createdAt);
    } catch(e) {
      console.error(e);
      return [];
    }
  }
}
