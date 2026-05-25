import api from '../../api/api.js';
import { getAllSales, clearAllSales } from '../../utils/offlineQueue.js';

export async function syncOfflineQueue(){
  const sales = await getAllSales();
  if (!sales || sales.length === 0) return { sincronizadas:0, errores:0 };
  const res = await api.post('/api/v1/offline/sync', { sales });
  // if success, clear local queue
  if (res && res.data && res.status === 200) {
    await clearAllSales();
  }
  return res.data;
}

export default { syncOfflineQueue };
