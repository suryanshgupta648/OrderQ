import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Badge, Button, Card, CardContent, CardMedia, 
  Fab, Typography, Tabs, Tab, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, IconButton,
  Accordion, AccordionSummary, AccordionDetails,
  RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import SearchIcon from '@mui/icons-material/Search';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import HistoryIcon from '@mui/icons-material/History';
import { Snackbar, Alert } from '@mui/material';
import { MENU_ITEMS, CATEGORIES } from '../data';

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table') || 'Takeaway';
  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [myOrderIds, setMyOrderIds] = useState(() => {
    const stored = localStorage.getItem('desiBitesMyOrderIds');
    return stored ? JSON.parse(stored) : [];
  });
  const [myOrders, setMyOrders] = useState([]);
  const [viewingOrderId, setViewingOrderId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFullOrderSummary, setShowFullOrderSummary] = useState(false);

  const [ws, setWs] = useState(null);
  const [sizeModalItem, setSizeModalItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeModalQuantity, setSizeModalQuantity] = useState(1);

  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [kitchenStatus, setKitchenStatus] = useState('LIVE');
  const [disabledItems, setDisabledItems] = useState([]);
  const [disabledCategories, setDisabledCategories] = useState([]);
  const [waiterRequestStatus, setWaiterRequestStatus] = useState(null);
  const [waiterNotification, setWaiterNotification] = useState(null);
  const [showWaiterNotification, setShowWaiterNotification] = useState(false);

  useEffect(() => {
    // Save myOrderIds to localStorage so the customer remembers their own orders across reloads
    localStorage.setItem('desiBitesMyOrderIds', JSON.stringify(myOrderIds));
  }, [myOrderIds]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      const storedIds = localStorage.getItem('desiBitesMyOrderIds');
      const latestOrderIds = storedIds ? JSON.parse(storedIds) : myOrderIds;

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

        if (isJson(ordersRes)) {
          const allOrders = await ordersRes.json();
          const userOrders = allOrders.filter(o => latestOrderIds.includes(o.id));
          setMyOrders(userOrders);
          
          if (viewingOrderId) {
            const updatedViewingOrder = userOrders.find(o => o.id === viewingOrderId);
            if (updatedViewingOrder) {
              setCurrentOrder(updatedViewingOrder);
            }
          }
        }

        if (isJson(kitchenRes)) {
          const data = await kitchenRes.json();
          setKitchenStatus(data.status || 'LIVE');
        }

        if (isJson(menuRes)) {
          const data = await menuRes.json();
          setDisabledItems(data.disabledItems || []);
          setDisabledCategories(data.disabledCategories || []);
        }

        if (isJson(waiterRes) && tableNumber !== 'Takeaway') {
          const reqs = await waiterRes.json();
          const myReq = reqs.find(r => r.table === tableNumber && (r.status === 'PENDING' || r.status === 'WAITING'));
          
          setWaiterRequestStatus(prev => {
            if (myReq) {
              if (myReq.status === 'WAITING' && prev !== 'WAITING') {
                setWaiterNotification("Please wait, waiter will be there in a few moments");
                setShowWaiterNotification(true);
              }
              return myReq.status;
            } else if (prev === 'PENDING' || prev === 'WAITING') {
              setWaiterNotification("Waiter is on the way!");
              setShowWaiterNotification(true);
              return null;
            }
            return null;
          });
        }
      } catch (err) {
        console.warn("API Fetch Error, using localStorage fallback in customer menu", err);
        // Fallback logic
        const localOrders = JSON.parse(localStorage.getItem('desi_bites_orders') || '[]');
        const userOrders = localOrders.filter(o => latestOrderIds.includes(o.id));
        setMyOrders(userOrders);
        if (viewingOrderId) {
          const updatedViewingOrder = userOrders.find(o => o.id === viewingOrderId);
          if (updatedViewingOrder) {
            setCurrentOrder(updatedViewingOrder);
          }
        }

        const localKitchen = localStorage.getItem('desi_bites_kitchen_status') || 'LIVE';
        setKitchenStatus(localKitchen);

        const localDisabledItems = JSON.parse(localStorage.getItem('desi_bites_disabled_items') || '[]');
        setDisabledItems(localDisabledItems);

        const localDisabledCategories = JSON.parse(localStorage.getItem('desi_bites_disabled_categories') || '[]');
        setDisabledCategories(localDisabledCategories);

        if (tableNumber !== 'Takeaway') {
          const reqs = JSON.parse(localStorage.getItem('desi_bites_waiter_requests') || '[]');
          const myReq = reqs.find(r => r.table === tableNumber && (r.status === 'PENDING' || r.status === 'WAITING'));
          
          setWaiterRequestStatus(prev => {
            if (myReq) {
              if (myReq.status === 'WAITING' && prev !== 'WAITING') {
                setWaiterNotification("Please wait, waiter will be there in a few moments");
                setShowWaiterNotification(true);
              }
              return myReq.status;
            } else if (prev === 'PENDING' || prev === 'WAITING') {
              setWaiterNotification("Waiter is on the way!");
              setShowWaiterNotification(true);
              return null;
            }
            return null;
          });
        }
      }
    };

    fetchCustomerData();
    const interval = setInterval(fetchCustomerData, 3000);

    return () => clearInterval(interval);
  }, [myOrderIds, tableNumber, viewingOrderId]);

  const callWaiter = async () => {
    if (tableNumber === 'Takeaway') return;
    
    // Check if there is already an active request
    if (waiterRequestStatus === 'PENDING' || waiterRequestStatus === 'WAITING') {
       return;
    }

    try {
      const newReq = {
        id: Date.now().toString(),
        table: tableNumber,
        status: 'PENDING',
        timestamp: new Date().toISOString()
      };
      
      let success = false;
      try {
        const res = await fetch('/api/waiter-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReq)
        });
        const isJson = res.ok && res.headers.get("content-type")?.includes("application/json");
        if (isJson) {
          success = true;
        } else {
          throw new Error("Fallback to local storage");
        }
      } catch (err) {
        console.warn("API Down, fallback to localStorage for waiter-requests", err);
        const localReqs = JSON.parse(localStorage.getItem('desi_bites_waiter_requests') || '[]');
        localReqs.push(newReq);
        localStorage.setItem('desi_bites_waiter_requests', JSON.stringify(localReqs));
        success = true;
      }
      
      if (success) {
        setWaiterRequestStatus('PENDING');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (cart.length === 0) {
      if (isCartOpen) setIsCartOpen(false);
      if (isConfirmOpen) setIsConfirmOpen(false);
    }
  }, [cart.length, isCartOpen, isConfirmOpen]);

  const openSizeModal = (item) => {
    setSizeModalItem(item);
    setSelectedSize(item.sizes[0]);
    setSizeModalQuantity(1);
  };

  const handleAddSize = () => {
    if (sizeModalItem && selectedSize) {
      addToCart(sizeModalItem, selectedSize, sizeModalQuantity);
    }
    setSizeModalItem(null);
    setSelectedSize(null);
    setSizeModalQuantity(1);
  };

  const addToCart = (item, size, qty = 1) => {
    setCart(prev => {
      const cartItemId = size ? `${item.id}-${size.name}` : item.id;
      const existing = prev.find(c => c.cartItemId === cartItemId);
      if (existing) {
        return prev.map(c => c.cartItemId === cartItemId ? { ...c, quantity: c.quantity + qty } : c);
      }
      return [...prev, { ...item, cartItemId, quantity: qty, selectedSize: size, price: size ? size.price : item.price }];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
    ).filter(item => item.quantity > 0));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const scrollToCategory = (category) => {
    setIsMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`category-${category}`);
      if (el) {
        // account for sticky header
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 150);
  };

  const CartControl = ({ item }) => {
    if (disabledItems.includes(item.id) || disabledCategories.includes(item.category)) {
      return (
        <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1.5 rounded border border-gray-200 uppercase">
          Unavailable
        </div>
      );
    }

    const cartItems = cart.filter(c => c.id === item.id);
    const quantity = cartItems.reduce((sum, c) => sum + c.quantity, 0);

    if (quantity === 0) {
      return (
        <Button 
          variant="contained" 
          onClick={() => {
            if (item.sizes && item.sizes.length > 0) {
              openSizeModal(item);
            } else {
              addToCart(item);
            }
          }}
          sx={{ 
            backgroundColor: '#fff', 
            color: '#E23744', 
            fontWeight: 800, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #f1f1f1',
            borderRadius: '8px',
            padding: '4px 20px',
            whiteSpace: 'nowrap',
            minWidth: '70px',
            '&:hover': { backgroundColor: '#f9fafb' }
          }}
        >
          ADD {item.sizes && item.sizes.length > 0 && '+'}
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-between bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden px-1 py-0.5 min-w-[96px]">
        <IconButton size="small" onClick={() => {
          if (cartItems.length === 1) {
            removeFromCart(cartItems[0].cartItemId);
          } else {
            removeFromCart(cartItems[cartItems.length - 1].cartItemId);
          }
        }} sx={{ color: '#E23744', padding: '4px' }}>
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" className="font-bold px-1 text-[#E23744]">
          {quantity}
        </Typography>
        <IconButton size="small" onClick={() => {
          if (item.sizes && item.sizes.length > 0) {
            openSizeModal(item);
          } else {
            addToCart(item);
          }
        }} sx={{ color: '#E23744', padding: '4px' }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </div>
    );
  };

  const placeOrder = async () => {
    if (cart.length === 0 || isSubmitting) {
      setIsCartOpen(false);
      setIsConfirmOpen(false);
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber,
      customerName: customerName.trim() || undefined,
      items: cart,
      totalAmount,
      specialInstructions,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };

    let success = false;
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const isJson = response.ok && response.headers.get("content-type")?.includes("application/json");
      if (isJson) {
        success = true;
      } else {
        throw new Error("Server responded with error status " + response.status);
      }
    } catch (err) {
      console.warn("API Down, using localStorage fallback to place order", err);
      // Fallback: save to localStorage list of orders
      const localOrders = JSON.parse(localStorage.getItem('desi_bites_orders') || '[]');
      localOrders.push(orderPayload);
      localStorage.setItem('desi_bites_orders', JSON.stringify(localOrders));
      success = true;
    }

    if (success) {
      const newMyOrderIds = [...myOrderIds, orderPayload.id];
      localStorage.setItem('desiBitesMyOrderIds', JSON.stringify(newMyOrderIds));
      setMyOrderIds(newMyOrderIds);
      
      setCurrentOrder(orderPayload);
      setViewingOrderId(orderPayload.id);
      setCart([]);
      setIsCartOpen(false);
      setIsConfirmOpen(false);
      setSpecialInstructions('');
      setCustomerName('');
    }
    setIsSubmitting(false);
  };

  if (kitchenStatus === 'OFFLINE') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-gray-200 text-gray-500 p-6 rounded-full mb-6 shadow-inner">
          <RestaurantMenuIcon sx={{ fontSize: 64 }} />
        </div>
        <Typography variant="h4" className="mb-3 font-bold text-gray-900 tracking-tight">Kitchen Not Live Yet</Typography>
        <Typography variant="body1" className="text-gray-600 max-w-sm mx-auto leading-relaxed">
          Our kitchen is currently out of service. We will be back soon! Please check back later.
        </Typography>
      </div>
    );
  }

  const renderOrderDetails = (order) => (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 mt-6 mb-6 overflow-hidden text-left">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <Typography variant="subtitle2" className="font-bold text-gray-900">Order Items</Typography>
        <Typography variant="subtitle2" className="font-bold text-gray-900">₹{(order.totalAmount * 25).toFixed(0)}</Typography>
      </div>
      <div className="divide-y divide-gray-100 px-4 py-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="py-2 flex justify-between items-center">
            <div>
              <Typography variant="body2" className="font-medium text-gray-900">{item.name}</Typography>
              {item.selectedSize?.name && <Typography variant="caption" className="text-gray-500 block leading-tight">{item.selectedSize.name}</Typography>}
            </div>
            <Typography variant="body2" className="font-bold text-gray-900">{item.quantity} x ₹{(item.price * 25).toFixed(0)}</Typography>
          </div>
        ))}
      </div>
    </div>
  );

  if (viewingOrderId && currentOrder) {
    if (currentOrder.status === 'PENDING') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-full mb-6 mt-12">
            <svg className="w-12 h-12 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 14v1m8-8h1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
            </svg>
          </div>
          <Typography variant="h4" className="mb-2 font-bold text-gray-900">Waiting for Confirmation...</Typography>
          <Typography variant="body1" className="text-gray-600 max-w-md">
            Your order for {tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${tableNumber}`} has been sent. Please wait while the kitchen confirms it.
          </Typography>
          {renderOrderDetails(currentOrder)}
          <Button 
            variant="outlined" 
            onClick={() => setViewingOrderId(null)}
            sx={{ borderRadius: '9999px', px: 4, py: 1.5, mb: 12 }}
          >
            {showHistory ? 'Back to History' : 'Back to Menu'}
          </Button>
        </div>
      );
    }

    if (currentOrder.status === 'PREPARING') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-blue-100 text-blue-800 p-4 rounded-full mb-6 mt-12">
            <svg className="w-12 h-12 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <Typography variant="h4" className="mb-2 font-bold text-gray-900">Order Preparing!</Typography>
          <Typography variant="body1" className="text-gray-600 max-w-md">
            Your order for {tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${tableNumber}`} is being prepared and will be there in a few minutes.
          </Typography>
          {renderOrderDetails(currentOrder)}
          <Button 
            variant="outlined" 
            onClick={() => setViewingOrderId(null)}
            sx={{ borderRadius: '9999px', px: 4, py: 1.5, mb: 12 }}
          >
            {showHistory ? 'Back to History' : 'Order More'}
          </Button>
        </div>
      );
    }

    if (currentOrder.status === 'COMPLETED') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-green-100 text-green-800 p-4 rounded-full mb-6 mt-12">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <Typography variant="h4" className="mb-2 font-bold text-gray-900">Order Ready!</Typography>
          <Typography variant="body1" className="text-gray-600 max-w-md">
            Your order for {tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${tableNumber}`} is ready. {showHistory && 'It has been served.'}
          </Typography>
          {renderOrderDetails(currentOrder)}
          <Button 
            variant="outlined" 
            onClick={() => setViewingOrderId(null)}
            sx={{ borderRadius: '9999px', px: 4, py: 1.5, mb: 12 }}
          >
            {showHistory ? 'Back to History' : 'Back to Menu'}
          </Button>
        </div>
      );
    }

    if (currentOrder.status === 'REJECTED') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-100 text-red-800 p-4 rounded-full mb-6 mt-12">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <Typography variant="h4" className="mb-2 font-bold text-gray-900">Order Rejected</Typography>
          <Typography variant="body1" className="text-gray-600 mb-2 max-w-md">
            We're really sorry, but your order could not be accepted at this time.
          </Typography>
          {currentOrder.rejectReason && (
            <div className="bg-red-50 text-red-800 border border-red-200 px-4 py-3 rounded-lg max-w-md font-medium mx-auto">
              Reason: {currentOrder.rejectReason}
            </div>
          )}
          {!currentOrder.rejectReason && (
            <Typography variant="body1" className="text-gray-600 max-w-md">
              Please try again or check with the staff.
            </Typography>
          )}
          {renderOrderDetails(currentOrder)}
          <Button 
            variant="outlined" 
            color="error"
            onClick={() => setViewingOrderId(null)}
            sx={{ borderRadius: '9999px', px: 4, py: 1.5, mb: 12 }}
          >
            {showHistory ? 'Back to History' : 'Back to Menu'}
          </Button>
        </div>
      );
    }
  }

  const getOrderHistorySummary = () => {
    const validOrders = myOrders.filter(o => o.status !== 'REJECTED');
    const itemsTotal = validOrders.reduce((sum, o) => sum + (o.totalAmount * 25), 0);
    const sgst = itemsTotal * 0.025;
    const cgst = itemsTotal * 0.025;
    const finalTotal = itemsTotal + sgst + cgst;
    return { itemsTotal, sgst, cgst, finalTotal };
  };

  if (showHistory && !viewingOrderId) {
    const summary = getOrderHistorySummary();
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="px-6 py-4 bg-[#E23744] text-white shadow-md sticky top-0 z-20 flex justify-between items-center">
          <Typography variant="h6" className="font-bold">Order History</Typography>
          <Button 
            variant="outlined" 
            onClick={() => setShowHistory(false)}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', borderRadius: '9999px', textTransform: 'none' }}
          >
            Close
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 max-w-3xl w-full mx-auto space-y-6 pb-24">
          {myOrders.length === 0 ? (
            <div className="text-center text-gray-500 mt-12">
              <HistoryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
              <Typography variant="h6">No orders yet</Typography>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {myOrders.slice().reverse().map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => setViewingOrderId(order.id)}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <Typography variant="body2" className="font-bold text-gray-900">{order.id}</Typography>
                        <Typography variant="caption" className="text-gray-500 font-medium block">
                          {order.status === 'PENDING' ? 'Waiting Confirmation...' : 
                           order.status === 'PREPARING' ? 'Preparing...' : 
                           order.status === 'COMPLETED' ? 'Served / Ready' : 'Rejected'}
                        </Typography>
                      </div>
                      <div className="flex items-center gap-3">
                        <Typography variant="subtitle2" className="font-bold text-gray-900">₹{(order.totalAmount * 25).toFixed(0)}</Typography>
                        <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${order.status === 'COMPLETED' ? 'bg-green-500' : order.status === 'PREPARING' ? 'bg-blue-500' : order.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-400'}`}></div>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 mt-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1">
                          <div>
                            <Typography variant="body2" className="font-medium text-gray-800">{item.name}</Typography>
                            {item.selectedSize?.name && <Typography variant="caption" className="text-gray-500 block leading-none">{item.selectedSize.name}</Typography>}
                          </div>
                          <Typography variant="body2" className="text-gray-600 font-medium">
                            {item.quantity} x ₹{(item.price * 25).toFixed(0)}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              {myOrders.some(o => o.status !== 'REJECTED') && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mt-8">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <Typography variant="h6" className="font-bold text-gray-900">Order Summary</Typography>
                    <Button 
                      variant="text" 
                      size="small"
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                      onClick={() => setShowFullOrderSummary(!showFullOrderSummary)}
                    >
                      {showFullOrderSummary ? 'Hide Full Order' : 'Show Full Order'}
                    </Button>
                  </div>

                  {showFullOrderSummary && (
                    <div className="mb-4 space-y-1 max-h-64 overflow-y-auto pr-2 border-b border-gray-100 pb-4">
                      {myOrders.filter(o => o.status !== 'REJECTED').flatMap(o => o.items).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <Typography variant="body2" className="font-medium text-gray-800">{item.name}</Typography>
                            {item.selectedSize?.name && <Typography variant="caption" className="text-gray-500 block leading-none mt-1">{item.selectedSize.name}</Typography>}
                          </div>
                          <Typography variant="body2" className="text-gray-600 font-medium">
                            {item.quantity} x ₹{(item.price * 25).toFixed(0)}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Items Total</span>
                      <span className="font-medium text-gray-900">₹{summary.itemsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (2.5%)</span>
                      <span className="font-medium text-gray-900">₹{summary.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST (2.5%)</span>
                      <span className="font-medium text-gray-900">₹{summary.cgst.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Final Total</span>
                    <span className="font-bold text-[#E23744] text-lg">₹{summary.finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const isItemDisabled = (item) => disabledItems.includes(item.id) || disabledCategories.includes(item.category);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans relative">
      {/* Header and Search */}
      <div className="sticky top-0 z-20 bg-[#E23744] shadow-md text-white">
        <header className="px-6 py-4 flex justify-between items-center">
          <div>
            <Typography variant="h5" className="font-bold tracking-tight">
              Desi Bites
            </Typography>
            <Typography variant="body2" className="text-red-100 flex items-center gap-1">
              {tableNumber !== 'Takeaway' ? <span>Table {tableNumber}</span> : <span>Takeaway</span>}
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            {tableNumber !== 'Takeaway' && (
              <Button
                variant="outlined"
                onClick={callWaiter}
                disabled={waiterRequestStatus === 'PENDING' || waiterRequestStatus === 'WAITING'}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.5)',
                  borderRadius: '9999px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  padding: '4px 12px',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
                startIcon={<RoomServiceIcon fontSize="small" />}
              >
                {waiterRequestStatus === 'PENDING' || waiterRequestStatus === 'WAITING' ? 'Called' : 'Waiter'}
              </Button>
            )}
            <IconButton 
              onClick={() => setShowHistory(true)} 
              sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <HistoryIcon />
            </IconButton>
          </div>
        </header>
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="bg-white rounded-xl flex items-center px-3 py-2 shadow-sm">
            <SearchIcon sx={{ color: '#9CA3AF' }} />
            <input 
              type="text" 
              placeholder="Search for dishes or categories..." 
              className="bg-transparent border-none outline-none ml-2 w-full text-gray-900 placeholder-gray-500 font-medium text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Recommended */}
      {!searchQuery && (
        <div className="pt-6 mb-6 px-4">
          <div className="flex items-center gap-2 mb-3">
            <StarIcon sx={{ color: '#F59E0B' }} />
            <Typography variant="h6" className="font-bold text-gray-900">Recommended</Typography>
          </div>
          <div className="overflow-hidden hide-scrollbar">
            <div className="flex gap-4 pb-4 animate-scroll w-max">
              {[...MENU_ITEMS.filter(item => item.recommended), ...MENU_ITEMS.filter(item => item.recommended)].map((item, idx) => (
              <Card key={`rec-${item.id}-${idx}`} elevation={0} className={`border border-gray-200 shadow-sm shrink-0 w-64 rounded-2xl flex flex-col ${isItemDisabled(item) ? 'opacity-60' : ''}`}>
                <div className="w-full h-32 relative">
                  <img src={item.image} alt={item.name} className={`w-full h-full object-cover rounded-t-2xl ${isItemDisabled(item) ? 'grayscale' : ''}`} />
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Bestseller
                  </div>
                </div>
                <CardContent className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <Typography variant="subtitle1" className="font-bold text-gray-900 leading-tight mb-1 line-clamp-1">
                      {item.name}
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 line-clamp-2 text-xs">
                      {item.description}
                    </Typography>
                  </div>
                  <div className="flex justify-between items-center mt-3 h-8">
                    <Typography variant="subtitle2" className="font-bold text-gray-900">
                      ₹{(item.price * 25).toFixed(0)}
                    </Typography>
                    <CartControl item={item} />
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
      </div>
      )}

      {/* Category Accordions */}
      <div className="px-4 max-w-3xl mx-auto space-y-4 mb-24 mt-4">
        {CATEGORIES.map(category => {
          const categoryItems = MENU_ITEMS.filter(item => {
            if (item.category !== category) return false;
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
          });
          if (categoryItems.length === 0) return null;

          return (
            <Accordion 
              key={category} 
              id={`category-${category}`}
              defaultExpanded 
              elevation={0}
              className="bg-transparent"
              disableGutters
              sx={{ '&:before': { display: 'none' } }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: '#111827' }} />}
                className="px-0 min-h-0 py-2 border-b-2 border-gray-100"
                sx={{ '& .MuiAccordionSummary-content': { margin: '8px 0' } }}
              >
                <Typography variant="h6" className="font-bold text-gray-900">
                  {category} ({categoryItems.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails className="px-0 py-4 space-y-8">
                {categoryItems.map(item => (
                  <div key={item.id} className={`flex justify-between items-start border-b border-gray-100 border-dashed pb-6 last:border-0 last:pb-0 ${isItemDisabled(item) ? 'opacity-60' : ''}`}>
                    <div className="flex-1 pr-4">
                      {/* Veg indicator */}
                      <div className="w-4 h-4 border border-green-600 p-0.5 rounded-sm flex items-center justify-center mb-1.5">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      
                      <Typography variant="subtitle1" className="font-bold text-gray-900 leading-tight">
                        {item.name}
                      </Typography>
                      <Typography variant="subtitle2" className="font-medium text-gray-900 mt-1">
                        ₹{(item.price * 25).toFixed(0)}
                      </Typography>
                      <Typography variant="body2" className="text-gray-500 mt-2 text-sm line-clamp-2 leading-relaxed">
                        {item.description}
                      </Typography>
                    </div>
                    
                    <div className="relative w-32 h-32 shrink-0 flex flex-col items-center">
                      <img src={item.image} alt={item.name} className={`w-full h-full object-cover rounded-xl shadow-sm ${isItemDisabled(item) ? 'grayscale' : ''}`} />
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                        <CartControl item={item} />
                      </div>
                    </div>
                  </div>
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </div>

      {/* Floating Menu FAB */}
      <div className="fixed bottom-24 right-4 z-30 transition-transform">
        <Fab 
          color="primary" 
          aria-label="menu"
          onClick={() => setIsMenuOpen(true)}
          sx={{ backgroundColor: '#111827', color: 'white', '&:hover': { backgroundColor: '#374151' } }}
        >
          <div className="flex flex-col items-center justify-center gap-0.5">
            <RestaurantMenuIcon fontSize="small" />
            <span className="text-[10px] font-bold">MENU</span>
          </div>
        </Fab>
      </div>

      {/* Categories Popup Menu */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed bottom-40 right-4 z-50 bg-[#111827] text-white rounded-2xl shadow-xl w-64 overflow-hidden origin-bottom-right">
            <div className="flex flex-col py-2">
              {CATEGORIES.map(category => {
                const count = MENU_ITEMS.filter(i => i.category === category).length;
                if (count === 0) return null;
                return (
                  <div 
                    key={category} 
                    onClick={() => scrollToCategory(category)}
                    className="flex justify-between items-center px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <Typography variant="subtitle1" className="font-bold text-white">{category}</Typography>
                    <Typography variant="subtitle2" className="text-gray-300 font-bold">{count}</Typography>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Floating Bottom Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <Typography variant="body2" className="text-gray-500 font-medium">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="subtitle1" className="font-bold text-gray-900">
                ₹{(totalAmount * 25).toFixed(0)}
              </Typography>
            </div>
            <Button 
              variant="contained" 
              startIcon={<ShoppingCartIcon />}
              onClick={() => setIsCartOpen(true)}
              sx={{ 
                backgroundColor: '#E23744', 
                borderRadius: '9999px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4, py: 1.5,
                '&:hover': { backgroundColor: '#be2d39' }
              }}
            >
              View Order
            </Button>
          </div>
        </div>
      )}

      {/* Cart Checkout Modal */}
      <Dialog 
        open={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{ '& .MuiDialog-paper': { borderRadius: '24px', m: 2 } }}
      >
        <DialogTitle className="font-bold border-b border-gray-100">
          Your Order
        </DialogTitle>
        <DialogContent className="p-0">
          <div className="divide-y divide-gray-100">
            {cart.map(item => (
              <div key={item.cartItemId} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <Typography variant="subtitle2" className="font-medium text-gray-900">{item.name}</Typography>
                  {item.selectedSize && (
                    <Typography variant="caption" className="text-gray-500 block">
                      {item.selectedSize.name}
                    </Typography>
                  )}
                  <Typography variant="body2" className="text-gray-500">₹{(item.price * item.quantity * 25).toFixed(0)}</Typography>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1">
                  <IconButton size="small" onClick={() => removeFromCart(item.cartItemId)}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="body2" className="font-medium w-4 text-center">{item.quantity}</Typography>
                  <IconButton size="small" onClick={() => addToCart(item, item.selectedSize)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Any special requests or allergies?"
              variant="outlined"
              size="small"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              sx={{ backgroundColor: 'white', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </div>
        </DialogContent>
        <DialogActions className="p-4 pt-0 bg-gray-50 rounded-b-2xl flex-col gap-2 border-t border-gray-100">
          <div className="w-full flex justify-between items-center py-2 px-1">
            <Typography variant="subtitle1" className="font-bold text-gray-900">Total Amount</Typography>
            <Typography variant="h6" className="font-bold text-gray-900">₹{(totalAmount * 25).toFixed(0)}</Typography>
          </div>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => setIsConfirmOpen(true)}
            sx={{ 
              backgroundColor: '#E23744', 
              borderRadius: '9999px',
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              '&:hover': { backgroundColor: '#be2d39' }
            }}
          >
            Place Order
          </Button>
          <Button 
            fullWidth 
            variant="text" 
            onClick={() => setIsCartOpen(false)}
            sx={{ color: '#6B7280', textTransform: 'none', fontWeight: 500 }}
          >
            Continue Browsing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        sx={{ '& .MuiDialog-paper': { borderRadius: '24px', m: 2, padding: 2, textAlign: 'center' } }}
      >
        <DialogTitle className="font-bold text-gray-900 pb-2">
          Confirm Your Order
        </DialogTitle>
        <DialogContent className="pt-2">
          <Typography variant="body1" className="text-gray-600 mb-4">
            Are you sure you want to place this order? You have {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart totaling ₹{(totalAmount * 25).toFixed(0)}.
          </Typography>
          <TextField
            fullWidth
            placeholder="Your Name (Optional)"
            variant="outlined"
            size="small"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            sx={{ 
              backgroundColor: 'white', 
              '& .MuiOutlinedInput-root': { borderRadius: '12px' },
              mb: 2
            }}
          />
        </DialogContent>
        <DialogActions className="flex flex-col gap-2 p-0">
          <Button 
            fullWidth 
            variant="contained" 
            onClick={placeOrder}
            disabled={isSubmitting}
            sx={{ 
              backgroundColor: isSubmitting ? '#f87171' : '#E23744', 
              borderRadius: '9999px',
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              '&:hover': { backgroundColor: isSubmitting ? '#f87171' : '#be2d39' }
            }}
          >
            {isSubmitting ? 'Placing Order...' : 'Yes, Place Order'}
          </Button>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => setIsConfirmOpen(false)}
            sx={{ 
              color: '#6B7280', 
              borderColor: '#E5E7EB',
              borderRadius: '9999px',
              textTransform: 'none', 
              fontWeight: 600,
              py: 1.5,
              '&:hover': { borderColor: '#D1D5DB', backgroundColor: '#F3F4F6' }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      {/* Size Selection Modal */}
      <Dialog 
        open={!!sizeModalItem} 
        onClose={() => { setSizeModalItem(null); setSelectedSize(null); }} 
        fullWidth 
        maxWidth="xs" 
        sx={{ '& .MuiDialog-paper': { borderRadius: '24px', m: 2 } }}
      >
        <DialogTitle className="font-bold border-b border-gray-100">
          Customize {sizeModalItem?.name}
        </DialogTitle>
        <DialogContent className="p-4">
          <RadioGroup 
            value={selectedSize?.name || ''} 
            onChange={(e) => {
              const size = sizeModalItem?.sizes?.find(s => s.name === e.target.value);
              if (size) setSelectedSize(size);
            }}
          >
            {sizeModalItem?.sizes?.map(size => (
              <FormControlLabel 
                key={size.name} 
                value={size.name} 
                control={<Radio sx={{ color: '#E23744', '&.Mui-checked': { color: '#E23744' } }} />} 
                label={
                  <div className="flex justify-between w-full">
                    <span>{size.name}</span>
                    <span className="font-bold text-gray-900">₹{(size.price * 25).toFixed(0)}</span>
                  </div>
                } 
                sx={{ width: '100%', ml: 0, '& .MuiFormControlLabel-label': { flex: 1, ml: 1 } }}
              />
            ))}
          </RadioGroup>
          <div className="flex items-center justify-between mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <Typography variant="body2" className="font-bold text-gray-700">Quantity</Typography>
            <div className="flex items-center gap-4 bg-white rounded-lg shadow-sm border border-gray-200 px-2 py-1">
              <IconButton 
                size="small" 
                onClick={() => setSizeModalQuantity(Math.max(1, sizeModalQuantity - 1))}
                sx={{ color: '#E23744', padding: '4px' }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle2" className="font-bold w-4 text-center">
                {sizeModalQuantity}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setSizeModalQuantity(sizeModalQuantity + 1)}
                sx={{ color: '#E23744', padding: '4px' }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-4 pt-0 border-t border-gray-100 mt-2">
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleAddSize}
            sx={{ 
              backgroundColor: '#E23744', 
              borderRadius: '9999px', 
              textTransform: 'none', 
              fontWeight: 600, 
              py: 1.5, 
              '&:hover': { backgroundColor: '#be2d39' } 
            }}
          >
            Add - ₹{((selectedSize?.price || 0) * 25 * sizeModalQuantity).toFixed(0)}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for Waiter Notifications */}
      <Snackbar 
        open={showWaiterNotification} 
        autoHideDuration={4000} 
        onClose={() => setShowWaiterNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowWaiterNotification(false)} 
          severity="info" 
          sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}
          icon={<RoomServiceIcon />}
        >
          {waiterNotification}
        </Alert>
      </Snackbar>

    </div>
  );
}
