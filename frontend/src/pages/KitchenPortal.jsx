import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, CheckCircle, Clock, Utensils, ChevronLeft, ArrowRight } from 'lucide-react';
import { playBeep } from '../utils/audio';

export default function KitchenPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pulsingOrders, setPulsingOrders] = useState(new Set());
  const isMutating = useRef(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (isMutating.current) return;
      try {
        const headers = user?.restaurantId ? { 'X-Restaurant-Id': user.restaurantId } : {};
        const res = await fetch('/api/orders', { headers });
        if (res.ok) {
          const rawOrders = await res.json();
          setOrders(prev => {
            if (rawOrders.length > prev.length) {
              playBeep();
              const newO = rawOrders[rawOrders.length - 1];
              setPulsingOrders(p => new Set(p).add(newO.id));
              setTimeout(() => {
                setPulsingOrders(p => {
                  const next = new Set(p);
                  next.delete(newO.id);
                  return next;
                });
              }, 3000);
            }
            return rawOrders;
          });
        }
      } catch (err) {}
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const updateStatus = async (id, status) => {
    isMutating.current = true;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (e) {}
    setTimeout(() => { isMutating.current = false; }, 800);
  };

  // Only show active orders in the kitchen
  const activeOrders = orders.filter(o => ['ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
  
  const newOrders = activeOrders.filter(o => o.status === 'ACCEPTED').sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  const preparingOrders = activeOrders.filter(o => o.status === 'PREPARING').sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  const readyOrders = activeOrders.filter(o => o.status === 'READY').sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderKOTCard = (order) => (
    <motion.div 
      layout
      key={order.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-3xl p-6 shadow-sm border-2 transition-all ${
        pulsingOrders.has(order.id) ? 'border-indigo-500 shadow-indigo-100' : 'border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-3xl font-black text-slate-900">Table {order.tableNumber}</h3>
          <p className="text-sm font-bold text-slate-400 mt-1">#{order.id.split('-')[1]} • {formatTime(order.timestamp)}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider ${
          order.orderType === 'MANUAL' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
        }`}>
          {order.orderType || 'ONLINE'}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <span className="w-12 h-12 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center text-xl font-black shrink-0">
              {item.quantity}x
            </span>
            <div>
              <p className="text-xl font-bold text-slate-800 leading-tight">{item.name}</p>
              {item.selectedSize && <p className="text-sm font-bold text-slate-400 mt-0.5">{item.selectedSize.name}</p>}
            </div>
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <div className="bg-amber-50 p-4 rounded-2xl border-l-4 border-amber-500 mb-6">
          <p className="font-bold text-amber-900 text-lg">⚠️ {order.specialInstructions}</p>
        </div>
      )}

      <div>
        {order.status === 'ACCEPTED' && (
          <button 
            onClick={() => updateStatus(order.id, 'PREPARING')}
            className="w-full bg-slate-900 hover:bg-black text-white text-xl font-black py-5 rounded-2xl transition-colors flex justify-center items-center gap-3"
          >
            START PREPARING <ArrowRight strokeWidth={3} />
          </button>
        )}
        {order.status === 'PREPARING' && (
          <button 
            onClick={() => updateStatus(order.id, 'READY')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-black py-5 rounded-2xl transition-colors flex justify-center items-center gap-3 shadow-lg shadow-emerald-500/20"
          >
            MARK READY <CheckCircle strokeWidth={3} size={28} />
          </button>
        )}
        {order.status === 'READY' && (
          <div className="w-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 text-xl font-black py-5 rounded-2xl flex justify-center items-center gap-3">
            COMPLETED
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      <header className="h-[80px] bg-slate-900 text-white px-8 flex items-center justify-between shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <ChevronLeft size={28} />
          </button>
          <div className="flex items-center gap-3">
            <ChefHat size={36} className="text-emerald-400" />
            <h1 className="text-3xl font-black tracking-tight">KITCHEN KOT</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Queue Status</p>
          <p className="text-xl font-black">{activeOrders.length} Active Orders</p>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          
          {/* New Orders Column */}
          <div className="flex flex-col bg-slate-200/50 rounded-[2rem] p-6 border-2 border-slate-200 overflow-hidden h-full">
            <div className="flex items-center gap-4 mb-6 px-2">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Clock strokeWidth={3} size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">NEW ORDERS</h2>
              <span className="ml-auto bg-amber-200 text-amber-900 font-black px-4 py-1.5 rounded-xl text-lg">{newOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6 pb-6">
              {newOrders.map(renderKOTCard)}
              {newOrders.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xl text-center px-8">
                  Waiting for new orders...
                </div>
              )}
            </div>
          </div>

          {/* Preparing Column */}
          <div className="flex flex-col bg-slate-200/50 rounded-[2rem] p-6 border-2 border-slate-200 overflow-hidden h-full">
            <div className="flex items-center gap-4 mb-6 px-2">
              <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Utensils strokeWidth={3} size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">PREPARING</h2>
              <span className="ml-auto bg-indigo-200 text-indigo-900 font-black px-4 py-1.5 rounded-xl text-lg">{preparingOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6 pb-6">
              {preparingOrders.map(renderKOTCard)}
              {preparingOrders.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xl text-center px-8">
                  No orders currently in prep.
                </div>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="flex flex-col bg-slate-200/50 rounded-[2rem] p-6 border-2 border-slate-200 overflow-hidden h-full">
            <div className="flex items-center gap-4 mb-6 px-2">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle strokeWidth={3} size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">READY</h2>
              <span className="ml-auto bg-emerald-200 text-emerald-900 font-black px-4 py-1.5 rounded-xl text-lg">{readyOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6 pb-6">
              {readyOrders.map(renderKOTCard)}
              {readyOrders.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xl text-center px-8">
                  Cleared! Good job.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
