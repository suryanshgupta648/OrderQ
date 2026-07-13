import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Receipt, Printer, Copy, Clock, Search, CheckCircle, XCircle 
} from 'lucide-react';

export default function BillingHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [printingBill, setPrintingBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const headers = user?.restaurantId ? { 'X-Restaurant-Id': user.restaurantId } : {};
        const res = await fetch('/api/orders', { headers });
        if (res.ok) {
          const rawOrders = await res.json();
          // Filter to only completed or orders that have invoices
          const invoicedOrders = rawOrders.filter(o => o.invoiceNumber || o.status === 'COMPLETED');
          setOrders(invoicedOrders.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
        }
      } catch (err) {
        console.warn("Failed to fetch billing history");
      }
    };
    fetchHistory();
  }, [user]);

  const handlePrintAgain = (order) => {
    setPrintingBill(order);
    setTimeout(() => {
      window.print();
      setPrintingBill(null);
    }, 500);
  };

  const filteredOrders = orders.filter(o => 
    o.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Printable Receipt (Hidden normally) */}
      <div className="hidden print:block absolute top-0 left-0 bg-white w-full text-black p-4 text-sm font-mono z-50">
        {printingBill && (
          <div className="max-w-[300px] mx-auto text-center">
            <h1 className="text-xl font-bold mb-1">Desi Bites</h1>
            <p className="text-xs mb-2">123 Food Street, City</p>
            <p className="text-xs mb-4 border-b border-dashed border-black pb-2">GSTIN: 29ABCDE1234F1Z5</p>
            <p className="text-xs font-bold mb-2">** DUPLICATE COPY **</p>
            
            <div className="text-left text-xs space-y-1 mb-4">
              <p>Invoice: {printingBill.invoiceNumber || 'N/A'}</p>
              <p>Date: {new Date(printingBill.timestamp).toLocaleString()}</p>
              <p>Table: {printingBill.tableNumber}</p>
              <p>Cashier: {printingBill.cashierName || 'Staff'}</p>
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
                    <td className="py-1">{item.name}</td>
                    <td className="py-1">{item.quantity}</td>
                    <td className="py-1 text-right">₹{((item.price * item.quantity) * 25).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="text-right text-xs space-y-1 border-t border-dashed border-black pt-2 mb-4">
              <p>Subtotal: ₹{((printingBill.totalAmount - (printingBill.tax || 0) + (printingBill.discount || 0)) * 25).toFixed(0)}</p>
              {(printingBill.discount || 0) > 0 && <p>Discount: -₹{(printingBill.discount * 25).toFixed(0)}</p>}
              <p>Tax (5%): ₹{((printingBill.tax || 0) * 25).toFixed(0)}</p>
              <p className="font-bold text-sm mt-1 border-t border-black pt-1">Total: ₹{(printingBill.totalAmount * 25).toFixed(0)}</p>
            </div>
            
            <p className="text-xs mb-1">Paid via: {printingBill.paymentMethod || 'CASH'}</p>
            <p className="text-xs font-bold mt-4">Thank you for dining with us!</p>
          </div>
        )}
      </div>

      <div className="print:hidden flex flex-col h-full">
        {/* Header */}
        <header className="h-[70px] bg-white border-b border-slate-200 px-6 flex items-center shrink-0 justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/billing')}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Receipt size={18} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Billing History</h1>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Invoice or Table..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm bg-slate-50 w-64 font-medium"
            />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                <p className="text-slate-500 font-bold">No billing history found.</p>
              </div>
            ) : filteredOrders.map(order => (
              <div key={order.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div 
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-400">TABLE</span>
                      <span className="text-sm font-extrabold text-slate-800">{order.tableNumber}</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-lg">
                        {order.invoiceNumber || `#${order.id.split('-')[1]}`}
                      </p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {formatTime(order.timestamp)} • Cashier: {order.cashierName || 'System'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900 text-lg">₹{(order.totalAmount * 25).toFixed(0)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 inline-block px-2 py-0.5 rounded-md mt-1">
                        {order.paymentMethod || 'UNKNOWN'}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                      order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 
                      order.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {order.status === 'COMPLETED' && <CheckCircle size={16} />}
                      {order.status === 'REJECTED' && <XCircle size={16} />}
                      {order.status}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-slate-100 bg-slate-50"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Order Items</h4>
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm font-medium text-slate-700">
                                  <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center font-bold text-slate-600">{item.quantity}</span>
                                    <span>{item.name} {item.selectedSize && <span className="text-xs text-slate-400">({item.selectedSize.name})</span>}</span>
                                  </div>
                                  <span className="font-bold text-slate-900">₹{((item.price * item.quantity) * 25).toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Billing Summary</h4>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex-1 flex flex-col justify-between">
                              <div className="space-y-2 text-sm font-medium">
                                <div className="flex justify-between text-slate-500">
                                  <span>Subtotal</span>
                                  <span>₹{((order.totalAmount - (order.tax || 0) + (order.discount || 0)) * 25).toFixed(0)}</span>
                                </div>
                                {(order.discount || 0) > 0 && (
                                  <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span>
                                    <span>-₹{(order.discount * 25).toFixed(0)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-100">
                                  <span>Tax (5%)</span>
                                  <span>₹{((order.tax || 0) * 25).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2">
                                  <span>Grand Total</span>
                                  <span>₹{(order.totalAmount * 25).toFixed(0)}</span>
                                </div>
                              </div>
                              
                              <div className="mt-6 flex gap-3">
                                <button 
                                  onClick={() => handlePrintAgain(order)}
                                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                  <Printer size={16} /> Print Again
                                </button>
                                <button 
                                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                  <Copy size={16} /> Duplicate Bill
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
