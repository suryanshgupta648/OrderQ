import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  Typography, Button, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem as MuiMenuItem,
  Select, InputAdornment, Divider, Badge
} from '@mui/material';
import { 
  LayoutDashboard, BellRing, Utensils, Check, X, Printer,
  ChevronLeft, Search, Plus, Minus, Trash2, CreditCard, Banknote,
  Smartphone, Divide, Activity
} from 'lucide-react';
import { CATEGORIES, MENU_ITEMS } from '../data';
import { playBeep } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

export default function BillingPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('MANUAL'); // 'ONLINE' or 'MANUAL'
  const [orders, setOrders] = useState([]);
  const [waiterRequests, setWaiterRequests] = useState([]);
  const [disabledItems, setDisabledItems] = useState([]);
  const [disabledCategories, setDisabledCategories] = useState([]);
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [tableNumber, setTableNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  
  // Printing State
  const [printingBill, setPrintingBill] = useState(null);

  const isMutating = useRef(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (isMutating.current) return;
      try {
        const headers = user?.restaurantId ? { 'X-Restaurant-Id': user.restaurantId } : {};
        const [ordersRes, menuRes, waiterRes] = await Promise.all([
          fetch('/api/orders', { headers }),
          fetch('/api/menu-status', { headers }),
          fetch('/api/waiter-requests', { headers })
        ]);
        
        if (ordersRes.ok) {
          const rawOrders = await ordersRes.json();
          setOrders(prev => {
            if (rawOrders.length > prev.length) playBeep();
            return Array.from(new Map(rawOrders.map(o => [o.id, o])).values());
          });
        }
        
        if (menuRes.ok) {
          const data = await menuRes.json();
          setDisabledItems(data.disabledItems || []);
          setDisabledCategories(data.disabledCategories || []);
        }
        
        if (waiterRes.ok) {
          setWaiterRequests(await waiterRes.json());
        }
      } catch (err) {
        console.warn("API Error", err);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const withMutationLock = async (action) => {
    isMutating.current = true;
    try {
      await action();
    } finally {
      setTimeout(() => { isMutating.current = false; }, 800);
    }
  };

  const updateOrderStatus = (id, status, reason = null) => withMutationLock(async () => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, rejectReason: reason } : o));
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectReason: reason })
      });
    } catch (e) {}
  });

  const updateWaiterRequestStatus = (id, status) => withMutationLock(async () => {
    setWaiterRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
      await fetch(`/api/waiter-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (e) {}
  });

  // --- Cart Operations ---
  const addToCart = (item, size) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(i => i.id === item.id && (!size || i.selectedSize?.name === size.name));
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [...prev, {
        ...item,
        quantity: 1,
        selectedSize: size,
        price: size ? size.price : item.price
      }];
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const next = [...prev];
      next[index].quantity += delta;
      if (next[index].quantity <= 0) {
        return next.filter((_, i) => i !== index);
      }
      return next;
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // --- Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * 0.05; // Fixed 5% tax
  const grandTotal = taxableAmount + taxAmount;

  const handleGenerateBill = () => withMutationLock(async () => {
    if (cart.length === 0) return;
    
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    
    const newOrder = {
      id: `ORDER-${Date.now()}`,
      tableNumber: tableNumber || 'Takeaway',
      customerName: 'Guest',
      totalAmount: grandTotal,
      specialInstructions: instructions,
      status: 'PREPARING', // Goes straight to Kitchen
      timestamp: new Date().toISOString(),
      items: cart,
      discount: discountAmount,
      tax: taxAmount,
      paymentMethod,
      cashierName: user.name || 'Cashier',
      invoiceNumber,
      orderType: 'MANUAL'
    };

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.restaurantId ? { 'X-Restaurant-Id': user.restaurantId } : {})
        },
        body: JSON.stringify(newOrder)
      });
      
      setPrintingBill(newOrder);
      
      // Clear Cart
      setCart([]);
      setTableNumber('');
      setInstructions('');
      setDiscountPercent(0);
      setPaymentMethod('UPI');
      
      setTimeout(() => {
        window.print();
        setPrintingBill(null);
      }, 500);

    } catch (e) {
      alert("Failed to generate bill.");
    }
  });

  const onlineOrders = orders.filter(o => o.status === 'PENDING').sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  const activeWaiterCalls = waiterRequests.filter(r => r.status === 'PENDING' || r.status === 'WAITING');
  const readyOrders = orders.filter(o => o.status === 'READY').sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

  const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-sans rounded-2xl border border-slate-200">
      
      {/* Printable Receipt (Hidden normally) */}
      <div className="hidden print:block absolute top-0 left-0 bg-white w-full text-black p-4 text-sm font-mono">
        {printingBill && (
          <div className="max-w-[300px] mx-auto text-center">
            <h1 className="text-xl font-bold mb-1">Desi Bites</h1>
            <p className="text-xs mb-2">123 Food Street, City</p>
            <p className="text-xs mb-4 border-b border-dashed border-black pb-2">GSTIN: 29ABCDE1234F1Z5</p>
            
            <div className="text-left text-xs space-y-1 mb-4">
              <p>Invoice: {printingBill.invoiceNumber}</p>
              <p>Date: {new Date().toLocaleString()}</p>
              <p>Table: {printingBill.tableNumber}</p>
              <p>Cashier: {printingBill.cashierName}</p>
            </div>
            
            <table className="w-full text-left text-xs mb-4">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="pb-1">Item</th>
                  <th className="pb-1">Qty</th>
                  <th className="pb-1 text-right">Amt</th>
                </tr>
              </thead>
              <tbody>
                {printingBill.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1">
                      {item.name}
                      {item.selectedSize && <span className="block text-[10px]">({item.selectedSize.name})</span>}
                    </td>
                    <td className="py-1">{item.quantity}</td>
                    <td className="py-1 text-right">₹{((item.price * item.quantity) * 25).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="text-right text-xs space-y-1 border-t border-dashed border-black pt-2 mb-4">
              <p>Subtotal: ₹{(printingBill.totalAmount * 25 - printingBill.tax * 25 + printingBill.discount * 25).toFixed(0)}</p>
              {printingBill.discount > 0 && <p>Discount: -₹{(printingBill.discount * 25).toFixed(0)}</p>}
              <p>Tax (5%): ₹{(printingBill.tax * 25).toFixed(0)}</p>
              <p className="font-bold text-sm mt-1 border-t border-black pt-1">Total: ₹{(printingBill.totalAmount * 25).toFixed(0)}</p>
            </div>
            
            <p className="text-xs mb-1">Paid via: {printingBill.paymentMethod}</p>
            <p className="text-xs font-bold mt-4">Thank you for dining with us!</p>
          </div>
        )}
      </div>

      <div className="print:hidden flex flex-col h-full">
        {/* Header */}
        <header className="h-[70px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('MANUAL')}
                className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'MANUAL' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Manual POS
              </button>
              <button
                onClick={() => setActiveTab('ONLINE')}
                className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'ONLINE' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Online Orders
                {onlineOrders.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-md">{onlineOrders.length}</span>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/billing/history')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 mr-2">
              <Activity size={16} /> History
            </button>
          </div>
        </header>

        {/* Waiter Banner */}
        <AnimatePresence>
          {activeWaiterCalls.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-amber-50 border-b border-amber-200 shrink-0"
            >
              <div className="px-6 py-3 flex gap-4 overflow-x-auto hide-scrollbar">
                {activeWaiterCalls.map(req => (
                  <div key={req.id} className="bg-white px-4 py-2 rounded-xl border border-amber-200 shadow-sm flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <BellRing size={16} className="text-amber-600 animate-bounce" />
                      <span className="font-bold text-slate-800 text-sm">Table {req.tableNum}</span>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">"{req.type}"</span>
                    <button 
                      onClick={() => updateWaiterRequestStatus(req.id, 'COMPLETED')}
                      className="ml-2 w-6 h-6 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ready Orders Banner */}
        <AnimatePresence>
          {readyOrders.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-emerald-50 border-b border-emerald-200 shrink-0"
            >
              <div className="px-6 py-3 flex gap-4 overflow-x-auto hide-scrollbar">
                {readyOrders.map(order => (
                  <div key={order.id} className="bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 animate-pulse" />
                      <span className="font-bold text-slate-800 text-sm">Table {order.tableNumber}</span>
                    </div>
                    <span className="text-sm text-emerald-600 font-bold">READY TO SERVE</span>
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                      className="ml-2 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      SERVE & CLOSE
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          
          {activeTab === 'ONLINE' ? (
            <div className="p-8 w-full overflow-y-auto">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Online Orders from QR Menu</h2>
              {onlineOrders.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed max-w-2xl mx-auto mt-10">
                  <Utensils size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold text-lg">No pending online orders.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {onlineOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-900">Table {order.tableNumber}</h3>
                          <p className="text-sm font-bold text-indigo-600">#{order.id.split('-')[1]}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">₹{(order.totalAmount * 25).toFixed(0)}</p>
                          <p className="text-xs text-slate-400 font-medium">{formatTime(order.timestamp)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6 flex-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">
                              <span className="font-bold text-indigo-600 mr-2">{item.quantity}x</span>
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <Check size={18} /> Approve & Print
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'REJECTED')}
                          className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3 rounded-xl transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex w-full h-full">
              {/* Column 1: Categories */}
              <div className="w-[200px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                  <h3 className="font-extrabold text-slate-400 text-xs uppercase tracking-wider">Categories</h3>
                </div>
                <div className="p-2 space-y-1">
                  {CATEGORIES.map(cat => {
                    const isDisabled = disabledCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        disabled={isDisabled}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
                          isDisabled ? 'opacity-40 cursor-not-allowed' :
                          selectedCategory === cat ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Menu Items */}
              <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">{selectedCategory}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {MENU_ITEMS.filter(i => i.category === selectedCategory).map(item => {
                    const isDisabled = disabledItems.includes(item.id) || disabledCategories.includes(item.category);
                    return (
                      <div key={item.id} className={`bg-white rounded-2xl p-4 border border-slate-200 flex flex-col ${isDisabled ? 'opacity-50 grayscale' : 'hover:border-indigo-300 hover:shadow-md transition-all'}`}>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mb-3 h-8">{item.description}</p>
                        
                        <div className="mt-auto">
                          {item.sizes ? (
                            <div className="flex gap-2">
                              {item.sizes.map(size => (
                                <button
                                  key={size.name}
                                  disabled={isDisabled}
                                  onClick={() => addToCart(item, size)}
                                  className="flex-1 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                >
                                  {size.name.slice(0,1)} - ₹{(size.price * 25).toFixed(0)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 text-sm">₹{(item.price * 25).toFixed(0)}</span>
                              <button
                                disabled={isDisabled}
                                onClick={() => addToCart(item, null)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                              >
                                <Plus size={16} strokeWidth={3} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Cart */}
              <div className="w-[380px] bg-white border-l border-slate-200 flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-extrabold text-slate-900 text-lg">Current Bill</h3>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-400">Table:</span>
                    <input 
                      type="text" 
                      value={tableNumber} 
                      onChange={e => setTableNumber(e.target.value)}
                      placeholder="No."
                      className="w-12 text-sm font-extrabold text-slate-900 outline-none text-center bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                      <Utensils size={48} className="mb-4" />
                      <p className="font-bold">Cart is empty</p>
                    </div>
                  ) : cart.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs font-semibold text-indigo-600">
                            {item.selectedSize ? item.selectedSize.name : 'Regular'}
                          </p>
                          <p className="text-sm font-extrabold text-slate-900">
                            ₹{((item.price * item.quantity) * 25).toFixed(0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-slate-500 shadow-sm">
                          <Minus size={14} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-slate-800">{item.quantity}</span>
                        <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-slate-500 shadow-sm">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-slate-200 bg-white">
                  <div className="space-y-2 mb-4 text-sm font-bold">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>₹{(subtotal * 25).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Discount %</span>
                      <input 
                        type="number" 
                        value={discountPercent} 
                        onChange={e => setDiscountPercent(Number(e.target.value))}
                        className="w-16 text-right outline-none bg-slate-100 px-2 py-1 rounded-md border border-slate-200"
                        min="0" max="100"
                      />
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Tax (5%)</span>
                      <span>₹{(taxAmount * 25).toFixed(0)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between text-lg text-slate-900 font-black">
                      <span>Grand Total</span>
                      <span>₹{(grandTotal * 25).toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {['CASH', 'UPI', 'CARD', 'SPLIT'].map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 rounded-xl text-xs font-extrabold transition-colors border ${
                          paymentMethod === method 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  <input 
                    type="text" 
                    placeholder="Special Instructions (Optional)" 
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-400 mb-4 font-medium"
                  />

                  <button 
                    disabled={cart.length === 0}
                    onClick={handleGenerateBill}
                    className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white font-extrabold py-4 rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2"
                  >
                    <Printer size={18} /> GENERATE BILL & KOT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
