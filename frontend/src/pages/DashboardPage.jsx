import { useEffect, useState, useRef } from 'react';
import { 
  Typography, Card, CardContent, Button, Chip, 
  Divider, IconButton, Tooltip, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Menu, MenuItem
} from '@mui/material';
import { playBeep } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, MENU_ITEMS } from '../data';
import { 
  LayoutDashboard, PlayCircle, CheckCircle, BookOpen, 
  BellRing, MapPin, History, Search, Clock, Check, X,
  ChevronRight, CircleDollarSign, Utensils,
  ChefHat, Moon, Sun, Camera, TrendingUp
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import Analytics from '../components/Dashboard/AnalyticsView';
import StatCards from '../components/Dashboard/StatCards';

const SIDEBAR_ITEMS = [
  { id: 'DASHBOARD', label: 'Overview', icon: LayoutDashboard },
  { id: 'ANALYTICS', label: 'Analytics', icon: TrendingUp },
  { id: 'ORDERS', label: 'Orders', icon: ChefHat },
  { id: 'WAITER', label: 'Waiter Requests', icon: BellRing },
  { id: 'HISTORY', label: 'Order History', icon: History },
  { id: 'MANAGER', label: 'Menu Manager', icon: BookOpen },
];

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [pulsingOrders, setPulsingOrders] = useState(new Set());
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [kitchenStatus, setKitchenStatus] = useState('LIVE');
  const [disabledItems, setDisabledItems] = useState([]);
  const [disabledCategories, setDisabledCategories] = useState([]);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [waiterRequests, setWaiterRequests] = useState([]);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [expandedHistoryOrders, setExpandedHistoryOrders] = useState(new Set());

  const toggleHistoryOrder = (orderId) => {
    setExpandedHistoryOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) newSet.delete(orderId);
      else newSet.add(orderId);
      return newSet;
    });
  };
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const { logout, user } = useAuth();
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem('desi_bites_pic') || 'https://api.dicebear.com/7.x/notionists/svg?seed=Admin&backgroundColor=e2e8f0');
  const [picModalOpen, setPicModalOpen] = useState(false);
  const [newPicUrl, setNewPicUrl] = useState('');

  const handleUpdatePic = () => {
    if (newPicUrl) {
      setProfilePic(newPicUrl);
      localStorage.setItem('desi_bites_pic', newPicUrl);
      setPicModalOpen(false);
      setNewPicUrl('');
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('desi_bites_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('desi_bites_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('desi_bites_theme', 'light');
    }
  }, [isDarkMode]);

  const isMutating = useRef(false);

  const REJECT_REASONS = [
    "Item Out of Stock",
    "Kitchen is too busy",
    "Store closing soon",
    "Cannot fulfill special instructions",
    "Other"
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      if (isMutating.current) return;
      try {
        const [ordersRes, kitchenRes, menuRes, waiterRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/kitchen-status'),
          fetch('/api/menu-status'),
          fetch('/api/waiter-requests')
        ]);
        
        const isJson = (res) => res.ok && res.headers.get("content-type")?.includes("application/json");

        if (!isJson(ordersRes) || !isJson(kitchenRes) || !isJson(menuRes) || !isJson(waiterRes)) {
          throw new Error("One or more API endpoints are down, using fallback");
        }

        if (isJson(ordersRes) && !isMutating.current) {
          const rawOrders = await ordersRes.json();
          const newOrders = Array.from(new Map(rawOrders.map(o => [o.id, o])).values());
          setOrders(prev => {
            if (newOrders.length > prev.length) {
              playBeep();
              const latestOrder = newOrders[newOrders.length - 1];
              setPulsingOrders(p => new Set(p).add(latestOrder.id));
              setTimeout(() => {
                setPulsingOrders(p => {
                  const next = new Set(p);
                  next.delete(latestOrder.id);
                  return next;
                });
              }, 3000);
            }
            localStorage.setItem('desi_bites_orders', JSON.stringify(newOrders));
            return newOrders;
          });
        }
        
        if (isJson(kitchenRes) && !isMutating.current) {
          const data = await kitchenRes.json();
          setKitchenStatus(data.status);
          localStorage.setItem('desi_bites_kitchen_status', data.status);
        }
        
        if (isJson(menuRes) && !isMutating.current) {
          const data = await menuRes.json();
          setDisabledItems(data.disabledItems || []);
          setDisabledCategories(data.disabledCategories || []);
          localStorage.setItem('desi_bites_disabled_items', JSON.stringify(data.disabledItems || []));
          localStorage.setItem('desi_bites_disabled_categories', JSON.stringify(data.disabledCategories || []));
        }
        
        if (isJson(waiterRes) && !isMutating.current) {
          const data = await waiterRes.json();
          setWaiterRequests(data);
          localStorage.setItem('desi_bites_waiter_requests', JSON.stringify(data));
        }
        
        setIsConnected(true);
      } catch (err) {
        console.warn("API Error, using localStorage fallback in dashboard", err);
        if (!isMutating.current) {
          setOrders(JSON.parse(localStorage.getItem('desi_bites_orders') || '[]'));
          setKitchenStatus(localStorage.getItem('desi_bites_kitchen_status') || 'LIVE');
          setDisabledItems(JSON.parse(localStorage.getItem('desi_bites_disabled_items') || '[]'));
          setDisabledCategories(JSON.parse(localStorage.getItem('desi_bites_disabled_categories') || '[]'));
          setWaiterRequests(JSON.parse(localStorage.getItem('desi_bites_waiter_requests') || '[]'));
          setIsConnected(true);
        }
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  const withMutationLock = async (action) => {
    isMutating.current = true;
    try {
      await action();
    } finally {
      setTimeout(() => { isMutating.current = false; }, 800);
    }
  };

  const toggleKitchenStatus = () => withMutationLock(async () => {
    const newStatus = kitchenStatus === 'LIVE' ? 'OFFLINE' : 'LIVE';
    setKitchenStatus(newStatus);
    localStorage.setItem('desi_bites_kitchen_status', newStatus);
    try {
      await fetch('/api/kitchen-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {}
  });

  const toggleCategory = (category) => withMutationLock(async () => {
    const newDisabled = disabledCategories.includes(category)
      ? disabledCategories.filter(c => c !== category)
      : [...disabledCategories, category];
    setDisabledCategories(newDisabled);
    localStorage.setItem('desi_bites_disabled_categories', JSON.stringify(newDisabled));
    try {
      await fetch('/api/menu-status/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: newDisabled })
      });
    } catch (e) {}
  });

  const toggleItem = (itemId) => withMutationLock(async () => {
    const newDisabled = disabledItems.includes(itemId)
      ? disabledItems.filter(i => i !== itemId)
      : [...disabledItems, itemId];
    setDisabledItems(newDisabled);
    localStorage.setItem('desi_bites_disabled_items', JSON.stringify(newDisabled));
    try {
      await fetch('/api/menu-status/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newDisabled })
      });
    } catch (e) {}
  });

  const updateStatus = (id, status, reason = null) => withMutationLock(async () => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, status, rejectReason: reason } : o);
      localStorage.setItem('desi_bites_orders', JSON.stringify(updated));
      return updated;
    });
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectReason: reason })
      });
    } catch (e) {}
  });

  const updateWaiterRequestStatus = (id, status) => withMutationLock(async () => {
    setWaiterRequests(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status } : r);
      localStorage.setItem('desi_bites_waiter_requests', JSON.stringify(updated));
      return updated;
    });
    try {
      await fetch(`/api/waiter-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (e) {}
  });

  const activeWaiterRequests = waiterRequests.filter(r => r.status === 'PENDING' || r.status === 'WAITING').sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const pending = orders.filter(o => o.status === 'PENDING').sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const preparing = orders.filter(o => o.status === 'PREPARING').sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const completed = orders.filter(o => o.status === 'COMPLETED').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const trackingHistory = [...orders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getBadgeForTab = (tabId) => {
    switch (tabId) {
      case 'ORDERS': return pending.length + preparing.length;
      case 'WAITER': return activeWaiterRequests.length;
      default: return 0;
    }
  };

  const activeLabel = SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label || 'Overview';

  const renderOrderCard = (order, showActions = true) => (
    <motion.div 
      layout
      key={order.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl p-4 transition-all duration-300 ${
        pulsingOrders.has(order.id) ? 'ring-2 ring-indigo-500 shadow-lg scale-[1.02]' : 'shadow-sm border border-gray-100 hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-gray-900 text-base">
              {order.tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${order.tableNumber}`}
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
              #{order.id.split('-')[1]}
            </span>
          </div>
          {order.customerName && (
            <p className="text-gray-600 font-medium text-xs">
              {order.customerName}
            </p>
          )}
          <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
            <Clock size={12} /> {formatTime(order.timestamp)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-extrabold text-slate-800 text-base">
            ₹{(order.totalAmount * 25).toFixed(0)}
          </span>
          {showActions && order.status !== 'COMPLETED' && order.status !== 'REJECTED' && (
            <Tooltip title="Reject Order">
              <button 
                onClick={() => {
                  setRejectingOrderId(order.id);
                  setRejectModalOpen(true);
                }}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start text-sm">
            <div className="flex gap-2">
              <span className="font-bold text-indigo-600 text-xs">{item.quantity}x</span>
              <span className="text-slate-700 font-medium text-xs">
                {item.name}
                {item.selectedSize && (
                  <span className="text-slate-500 italic ml-1 font-normal">({item.selectedSize.name})</span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <div className="bg-amber-50 p-2.5 rounded-xl mb-3 border border-amber-100/50">
          <p className="text-amber-800 font-medium italic text-xs">
            " {order.specialInstructions} "
          </p>
        </div>
      )}

      {showActions && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          {order.status === 'PENDING' && (
            <button 
              onClick={() => updateStatus(order.id, 'PREPARING')}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Utensils size={16} /> Accept & Prep
            </button>
          )}
          {order.status === 'PREPARING' && (
            <button 
              onClick={() => updateStatus(order.id, 'COMPLETED')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Check size={16} strokeWidth={3} /> Mark Ready
            </button>
          )}
          {order.status === 'COMPLETED' && (
            <div className="w-full bg-emerald-50 text-emerald-700 font-bold py-2 rounded-xl text-center border border-emerald-100 text-sm">
              Completed
            </div>
          )}
          {order.status === 'REJECTED' && (
            <div className="w-full bg-red-50 text-red-700 font-bold py-2 rounded-xl flex flex-col items-center border border-red-100 text-sm">
              <span>Rejected</span>
              {order.rejectReason && <span className="text-[10px] font-normal mt-0.5">{order.rejectReason}</span>}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-[260px] bg-white border-r border-slate-200 text-slate-800 flex flex-col shrink-0 relative z-20">
        <div className="p-8 flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
              <span className="text-white font-extrabold text-xl">D</span>
           </div>
           <span className="font-extrabold text-2xl tracking-tight text-slate-900">Desi Bites</span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2 hide-scrollbar pb-6">
           {SIDEBAR_ITEMS.map(item => {
             const isActive = activeTab === item.id;
             const badge = getBadgeForTab(item.id);
             return (
               <button 
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                   isActive 
                     ? 'bg-indigo-50 text-indigo-700' 
                     : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                 }`}
               >
                 <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                 {item.label}
                 {badge > 0 && (
                   <span className={`ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                     isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                   }`}>
                     {badge}
                   </span>
                 )}
               </button>
             );
           })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full bg-slate-50/50">
        {/* Top Header */}
        <header className="h-[90px] flex items-center justify-between px-10 shrink-0 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{activeLabel}</h1>
          <div className="flex items-center gap-4">
            <Tooltip title="Waiter Requests">
              <button 
                onClick={() => setActiveTab('WAITER')}
                className="relative bg-white p-2.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-slate-600 hover:text-indigo-600 mr-1"
              >
                <BellRing size={20} />
                {activeWaiterRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
                      {activeWaiterRequests.length}
                    </span>
                  </span>
                )}
              </button>
            </Tooltip>

            <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="relative bg-white p-2.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-slate-600 hover:text-indigo-600 mr-1"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </Tooltip>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm scale-95 origin-right">
              <div className="flex flex-col items-end mr-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kitchen Status</span>
                <span className={`text-[11px] font-bold ${kitchenStatus === 'LIVE' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {kitchenStatus === 'LIVE' ? 'ACCEPTING' : 'OFFLINE'}
                </span>
              </div>
              <Switch 
                size="small" 
                checked={kitchenStatus === 'LIVE'} 
                onChange={toggleKitchenStatus} 
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#059669' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#059669' },
                }}
              />
            </div>
            
            <Tooltip title="Admin Account">
              <div className="cursor-pointer ml-1" onClick={(e) => setProfileMenuAnchor(e.currentTarget)}>
                 <img src={profilePic} className="w-10 h-10 rounded-full shadow-sm border border-slate-200 hover:border-indigo-400 transition-colors object-cover" alt="Profile" />
              </div>
            </Tooltip>
            
            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={() => setProfileMenuAnchor(null)}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                  mt: 1.5,
                  borderRadius: '12px',
                  minWidth: '180px',
                  border: '1px solid #e2e8f0'
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { setActiveTab('PROFILE'); setProfileMenuAnchor(null); }} className="font-bold text-slate-700">
                View Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={logout} className="font-bold text-rose-600">
                Sign Out
              </MenuItem>
            </Menu>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-10 hide-scrollbar">
          
          <AnimatePresence mode="wait">
            
            {activeTab === 'DASHBOARD' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8 max-w-7xl mx-auto"
              >
                {/* Stats Grid */}
                <StatCards 
                  orders={orders}
                  pending={pending}
                  preparing={preparing}
                  activeWaiterRequests={activeWaiterRequests}
                  setActiveTab={setActiveTab}
                />

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                   <div className="flex justify-between items-center mb-6">
                     <h2 className="text-lg font-extrabold text-slate-900">Recent Activity</h2>
                     <button onClick={() => setActiveTab('HISTORY')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All History →</button>
                   </div>
                   <div className="space-y-0">
                     {trackingHistory.slice(0, 5).map((order, i) => (
                       <div key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-xl flex flex-col">
                         <div onClick={() => toggleHistoryOrder(order.id)} className="flex items-center justify-between py-4 cursor-pointer">
                           <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                               order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                               order.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                               order.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                             }`}>
                               {order.status === 'COMPLETED' ? <CheckCircle size={18} /> : 
                                order.status === 'REJECTED' ? <X size={18} /> : <Clock size={18} />}
                             </div>
                             <div>
                               <p className="font-bold text-slate-900 text-sm">Order #{order.id.split('-')[1]} • Table {order.tableNumber}</p>
                               <p className="text-xs text-slate-500 font-medium mt-0.5">{formatTime(order.timestamp)} • {order.items.length} items</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-5">
                             <span className="font-extrabold text-slate-800 text-sm">₹{(order.totalAmount * 25).toFixed(0)}</span>
                             <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                               order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 
                               order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 
                               order.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                             }`}>
                               {order.status}
                             </span>
                           </div>
                         </div>
                         <AnimatePresence>
                           {expandedHistoryOrders.has(order.id) && (
                             <motion.div
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               className="overflow-hidden"
                             >
                               <div className="bg-slate-50 rounded-xl mb-4 p-4 border border-slate-200">
                                 <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Details</h5>
                                 <div className="space-y-3">
                                   {order.items.map((item, idx) => (
                                     <div key={idx} className="flex justify-between items-start">
                                       <div className="flex items-center gap-2">
                                         <span className="font-bold text-slate-900">{item.quantity}x</span>
                                         <div>
                                           <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                                           {item.selectedSize && <span className="text-xs text-slate-500 block">{item.selectedSize.name}</span>}
                                         </div>
                                       </div>
                                       <span className="text-sm font-bold text-slate-600">₹{((item.price * item.quantity) * 25).toFixed(0)}</span>
                                     </div>
                                   ))}
                                   {order.specialInstructions && (
                                     <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100/50">
                                       <p className="text-xs font-bold text-amber-800">Note: {order.specialInstructions}</p>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                      ))}
                     {trackingHistory.length === 0 && (
                       <div className="text-center py-10 text-slate-400 font-medium">No orders yet today.</div>
                     )}
                   </div>
                 </div>
               </motion.div>
             )}
             
             {activeTab === 'ANALYTICS' && (
               <motion.div 
                 key="analytics"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="h-full"
               >
                 <Analytics data={trackingHistory} />
               </motion.div>
             )}

             {activeTab === 'ORDERS' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4"
                style={{ height: 'calc(100vh - 160px)' }}
              >
                {/* Pending Column */}
                <div className="flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-200/60 p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                        <Clock size={16} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-800">Pending</h2>
                    </div>
                    <span className="bg-amber-500 text-white text-base font-black px-3.5 py-1 rounded-full shadow-sm">{pending.length}</span>
                  </div>
                  <div className="space-y-4 overflow-y-auto hide-scrollbar flex-1 pr-1">
                    {pending.length === 0 ? (
                      <div className="text-center p-8 bg-white/40 rounded-xl border border-slate-200 border-dashed">
                        <p className="text-slate-400 font-semibold text-sm">No new orders.</p>
                      </div>
                    ) : pending.map(order => renderOrderCard(order))}
                  </div>
                </div>

                {/* Preparing Column */}
                <div className="flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-200/60 p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        <Utensils size={16} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-800">Preparing</h2>
                    </div>
                    <span className="bg-indigo-500 text-white text-base font-black px-3.5 py-1 rounded-full shadow-sm">{preparing.length}</span>
                  </div>
                  <div className="space-y-4 overflow-y-auto hide-scrollbar flex-1 pr-1">
                    {preparing.length === 0 ? (
                      <div className="text-center p-8 bg-white/40 rounded-xl border border-slate-200 border-dashed">
                        <p className="text-slate-400 font-semibold text-sm">Nothing in prep.</p>
                      </div>
                    ) : preparing.map(order => renderOrderCard(order))}
                  </div>
                </div>

                {/* Completed Column */}
                <div className="flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-200/60 p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        <CheckCircle size={16} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-800">Ready / Done</h2>
                    </div>
                    <span className="bg-emerald-500 text-white text-base font-black px-3.5 py-1 rounded-full shadow-sm">{completed.length}</span>
                  </div>
                  <div className="space-y-4 overflow-y-auto hide-scrollbar flex-1 pr-1">
                    {completed.length === 0 ? (
                      <div className="text-center p-8 bg-white/40 rounded-xl border border-slate-200 border-dashed">
                        <p className="text-slate-400 font-semibold text-sm">No completed orders.</p>
                      </div>
                    ) : completed.slice(0, 15).map(order => renderOrderCard(order, false))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'MANAGER' && (
              <motion.div 
                key="manager"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-6xl mx-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                  {CATEGORIES.map(category => {
                    const categoryItems = MENU_ITEMS.filter(i => i.category === category);
                    if (categoryItems.length === 0) return null;
                    const isCatDisabled = disabledCategories.includes(category);
                    return (
                      <div key={category} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        <div className="bg-slate-50/80 p-5 border-b border-slate-200 flex justify-between items-center">
                          <h3 className="font-extrabold text-lg text-slate-800">{category}</h3>
                          <FormControlLabel
                            control={
                              <Switch 
                                checked={!isCatDisabled} 
                                onChange={() => toggleCategory(category)} 
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#4f46e5' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4f46e5' },
                                }}
                              />
                            }
                            label={<span className="text-xs font-bold text-slate-500">{!isCatDisabled ? 'In Stock' : 'Out of Stock'}</span>}
                          />
                        </div>
                        <div className="divide-y divide-slate-100 p-2 flex-1">
                          {!isCatDisabled ? categoryItems.map(item => {
                            const isItemDisabled = disabledItems.includes(item.id);
                            return (
                              <div key={item.id} className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors rounded-xl mx-2 my-1">
                                <div className="pr-4">
                                  <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                  <p className="text-slate-500 text-xs font-medium line-clamp-1 mt-0.5">{item.description}</p>
                                </div>
                                <Switch 
                                  checked={!isItemDisabled} 
                                  onChange={() => toggleItem(item.id)} 
                                  size="small"
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#059669' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#059669' },
                                  }}
                                />
                              </div>
                            );
                          }) : (
                            <div className="p-10 flex flex-col items-center justify-center text-center h-full">
                              <BookOpen size={32} className="text-slate-300 mb-3" />
                              <p className="font-bold text-slate-500">Category Disabled</p>
                              <p className="text-xs text-slate-400 mt-1">Enable to manage individual items.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'WAITER' && (
              <motion.div 
                key="waiter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                      <BellRing size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Active Waiter Calls</h2>
                      <p className="text-slate-500 font-medium text-sm mt-0.5">Manage incoming requests from tables.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {activeWaiterRequests.length === 0 ? (
                       <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                         <p className="text-slate-500 font-bold">No active waiter requests right now.</p>
                       </div>
                    ) : activeWaiterRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-5">
                          <div className="bg-indigo-600 text-white w-14 h-14 rounded-xl flex flex-col items-center justify-center shadow-md shadow-indigo-500/20">
                            <span className="text-[10px] font-extrabold uppercase opacity-80 leading-none mb-1">Table</span>
                            <span className="text-xl font-black leading-none">{req.table}</span>
                          </div>
                          <div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block ${
                              req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {req.status === 'PENDING' ? 'Waiting for Waiter' : 'Waiter is on the way'}
                            </span>
                            <p className="text-slate-500 font-medium text-xs flex items-center gap-1.5">
                              <Clock size={12} /> Requested at {formatTime(req.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {req.status === 'PENDING' && (
                            <button 
                              onClick={() => updateWaiterRequestStatus(req.id, 'WAITING')}
                              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-2 px-4 rounded-xl transition-colors shadow-sm text-sm"
                            >
                              Acknowledge
                            </button>
                          )}
                          <button 
                            onClick={() => updateWaiterRequestStatus(req.id, 'RESOLVED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-colors shadow-sm text-sm"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'HISTORY' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-5xl mx-auto"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                      <History size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Complete Order History</h2>
                      <p className="text-slate-500 font-medium text-sm mt-0.5">Search and view all orders processed by the kitchen today.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={searchOrderId}
                        onChange={(e) => setSearchOrderId(e.target.value)}
                        placeholder="Search for an Order by ID (e.g. ord-1234)" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {trackingHistory.filter(o => !searchOrderId || o.id.toLowerCase().includes(searchOrderId.toLowerCase())).length === 0 ? (
                      <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <p className="text-slate-500 font-bold">No matching orders found.</p>
                      </div>
                    ) : trackingHistory.filter(o => !searchOrderId || o.id.toLowerCase().includes(searchOrderId.toLowerCase())).map(order => (
                      <div key={order.id} className="flex flex-col bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                        <div onClick={() => toggleHistoryOrder(order.id)} className="flex items-center justify-between p-4 cursor-pointer">
                           <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                               order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                               order.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                               order.status === 'PREPARING' ? 'bg-indigo-50 text-indigo-600' : 
                               order.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                             }`}>
                               {order.status === 'COMPLETED' ? <CheckCircle size={20} strokeWidth={2.5} /> : 
                                order.status === 'REJECTED' ? <X size={20} strokeWidth={2.5} /> : 
                                order.status === 'PREPARING' ? <Utensils size={20} strokeWidth={2.5} /> :
                                <Clock size={20} strokeWidth={2.5} />}
                             </div>
                             <div>
                               <h4 className="font-bold text-slate-900 text-sm">Order #{order.id.split('-')[1]}</h4>
                               <p className="text-slate-500 font-medium text-xs mt-0.5">Table {order.tableNumber} • {formatDate(order.timestamp)} at {formatTime(order.timestamp)} • {order.items.length} items</p>
                             </div>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                             <span className="font-extrabold text-slate-900 text-base">₹{(order.totalAmount * 25).toFixed(0)}</span>
                             <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                               order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                               order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                               order.status === 'PREPARING' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                               order.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                             }`}>
                               {order.status}
                             </span>
                           </div>
                        </div>
                        <AnimatePresence>
                           {expandedHistoryOrders.has(order.id) && (
                             <motion.div
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               className="overflow-hidden"
                             >
                               <div className="bg-slate-50 mx-4 mb-4 p-4 rounded-xl border border-slate-200">
                                 <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Items</h5>
                                 <div className="space-y-3">
                                   {order.items.map((item, idx) => (
                                     <div key={idx} className="flex justify-between items-start">
                                       <div className="flex items-center gap-2">
                                         <span className="font-bold text-slate-900">{item.quantity}x</span>
                                         <div>
                                           <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                                           {item.selectedSize && <span className="text-xs text-slate-500 block">{item.selectedSize.name}</span>}
                                         </div>
                                       </div>
                                       <span className="text-sm font-bold text-slate-600">₹{((item.price * item.quantity) * 25).toFixed(0)}</span>
                                     </div>
                                   ))}
                                   {order.specialInstructions && (
                                     <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100/50">
                                       <p className="text-xs font-bold text-amber-800">Note: {order.specialInstructions}</p>
                                     </div>
                                   )}
                                   {order.rejectReason && (
                                     <div className="mt-3 p-3 bg-rose-50 rounded-lg border border-rose-100/50">
                                       <p className="text-xs font-bold text-rose-800">Rejected Reason: {order.rejectReason}</p>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </motion.div>
                           )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'PROFILE' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 p-8 flex items-center gap-6">
                     <div className="relative group">
                       <img src={profilePic} className="w-24 h-24 rounded-full shadow-md border-4 border-white object-cover" alt="Profile" />
                       <div 
                         onClick={() => setPicModalOpen(true)}
                         className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                       >
                         <Camera size={24} className="text-white" />
                       </div>
                     </div>
                     <div>
                       <h2 className="text-3xl font-extrabold text-slate-900">{user?.name || 'Desi Bites Admin'}</h2>
                       <p className="text-slate-500 font-bold mt-1 text-lg">Restaurant Owner</p>
                     </div>
                  </div>
                  <div className="p-8 space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                       <div>
                         <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Restaurant Name</p>
                         <p className="text-lg font-bold text-slate-800">Desi Bites Indian Cuisine</p>
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Owner Name</p>
                         <p className="text-lg font-bold text-slate-800">{user?.name || 'Surya'}</p>
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                         <p className="text-lg font-bold text-slate-800">{user?.email || 'admin@desibites.com'}</p>
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Account Type</p>
                         <Chip label="Super Admin" size="small" sx={{ backgroundColor: '#4f46e5', color: 'white', fontWeight: 'bold' }} />
                       </div>
                     </div>
                     
                     <Divider className="my-6" />
                     
                     <div className="flex justify-end">
                       <Button 
                         variant="outlined" 
                         color="error" 
                         onClick={logout}
                         sx={{ borderRadius: '12px', fontWeight: 'bold', borderWidth: '2px', paddingX: 4, '&:hover': { borderWidth: '2px' } }}
                       >
                         Sign Out of Dashboard
                       </Button>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </main>
      </div>

      {/* Edit Profile Pic Modal */}
      <Dialog open={picModalOpen} onClose={() => setPicModalOpen(false)} PaperProps={{ style: { borderRadius: 16, padding: 4 } }}>
        <DialogTitle className="font-extrabold text-slate-900">Update Profile Picture</DialogTitle>
        <DialogContent>
          <p className="text-sm text-slate-500 mb-4 font-medium mt-1">Enter a valid URL for your new profile image.</p>
          <input 
            type="url" 
            value={newPicUrl}
            onChange={(e) => setNewPicUrl(e.target.value)}
            placeholder="https://example.com/my-photo.jpg" 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
        </DialogContent>
        <DialogActions className="px-6 pb-4 pt-2">
          <Button onClick={() => setPicModalOpen(false)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            onClick={handleUpdatePic}
            variant="contained"
            disabled={!newPicUrl}
            sx={{ backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' }, borderRadius: '8px', fontWeight: 'bold' }}
          >
            Update Picture
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={rejectModalOpen} 
        onClose={() => setRejectModalOpen(false)}
        PaperProps={{ style: { borderRadius: 16, padding: 4 } }}
      >
        <DialogTitle className="font-extrabold text-slate-900">Reject Order</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-2 mt-2">
            {REJECT_REASONS.map((reason) => (
              <label key={reason} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" 
                  name="rejectReason" 
                  value={reason}
                  checked={rejectReason === reason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-700 text-sm">{reason}</span>
              </label>
            ))}
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-4 pt-2">
          <Button onClick={() => setRejectModalOpen(false)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            onClick={() => {
              if (rejectingOrderId) {
                updateStatus(rejectingOrderId, 'REJECTED', rejectReason || 'Other');
                setRejectModalOpen(false);
                setRejectingOrderId(null);
                setRejectReason('');
              }
            }}
            variant="contained"
            disabled={!rejectReason}
            sx={{ backgroundColor: '#e11d48', '&:hover': { backgroundColor: '#be123c' }, borderRadius: '8px', fontWeight: 'bold' }}
          >
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
