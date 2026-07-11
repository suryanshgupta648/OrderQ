import React, { useState, useMemo, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  Calendar as CalendarIcon, Download, TrendingUp, DollarSign, ShoppingBag, 
  Users, Activity, Percent, Clock, CreditCard
} from 'lucide-react';
import { 
  Menu, MenuItem, Button, Select, FormControl, InputLabel, 
  Card, CardContent, Divider
} from '@mui/material';
import { 
  format, subDays, startOfDay, endOfDay, isWithinInterval, 
  startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO,
  subMonths
} from 'date-fns';
import * as XLSX from 'xlsx';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { MENU_ITEMS, CATEGORIES } from '../../data';

// --- MOCK DATA GENERATOR ---
const generateMockData = () => {
  const mockData = [];
  const now = new Date();
  const paymentMethods = ['Cash', 'Card', 'UPI', 'Wallet'];
  
  // Generate data for the last 6 months
  for (let i = 0; i < 1500; i++) {
    const daysAgo = Math.floor(Math.random() * 180);
    // Don't generate mock data for "today" to avoid conflicting with live data
    if (daysAgo === 0) continue; 
    
    const date = subDays(now, daysAgo);
    const hour = 11 + Math.floor(Math.random() * 12);
    const minute = Math.floor(Math.random() * 60);
    date.setHours(hour, minute, 0, 0);

    const orderItems = [];
    const numItems = 1 + Math.floor(Math.random() * 4);
    let totalAmount = 0;

    for (let j = 0; j < numItems; j++) {
      const item = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
      if (item) {
        const qty = 1 + Math.floor(Math.random() * 2);
        orderItems.push({
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: qty
        });
        totalAmount += item.price * qty;
      }
    }

    mockData.push({
      id: `ORD-MOCK-${Math.floor(Math.random() * 100000)}`,
      timestamp: date.toISOString(),
      items: orderItems,
      totalAmount: totalAmount,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: 'COMPLETED',
      discount: Math.random() > 0.8 ? totalAmount * 0.1 : 0, 
    });
  }
  return mockData;
};

const MOCK_DATA = generateMockData();
const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

export default function Analytics({ data = [] }) {
  const [dateFilter, setDateFilter] = useState('today');
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState(null);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    const now = new Date();
    let start, end;

    switch (dateFilter) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case 'last7':
        start = startOfDay(subDays(now, 7));
        end = endOfDay(now);
        break;
      case 'last30':
        start = startOfDay(subDays(now, 30));
        end = endOfDay(now);
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'thisYear':
        start = startOfYear(now);
        end = endOfDay(now);
        break;
      case 'custom':
        start = startOfDay(dateRange[0].startDate);
        end = endOfDay(dateRange[0].endDate);
        break;
      default:
        start = startOfDay(now);
        end = endOfDay(now);
    }

    const combinedData = [...MOCK_DATA, ...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return combinedData.filter(order => {
      if (!order.timestamp) return false;
      const orderDate = new Date(order.timestamp);
      return isWithinInterval(orderDate, { start, end });
    });
  }, [dateFilter, data, dateRange]);

  // --- AGGREGATIONS ---
  const kpis = useMemo(() => {
    let grossSales = 0;
    let discounts = 0;
    const orders = filteredData.length;

    filteredData.forEach(order => {
      grossSales += order.totalAmount;
      discounts += order.discount || 0;
    });

    return {
      grossSales,
      discounts,
      netSales: grossSales - discounts,
      orders,
      avgOrderValue: orders > 0 ? (grossSales - discounts) / orders : 0,
    };
  }, [filteredData]);

  const salesByCategory = useMemo(() => {
    const categories = {};
    filteredData.forEach(order => {
      order.items.forEach(item => {
        if (!categories[item.category]) categories[item.category] = { name: item.category, value: 0, qty: 0 };
        categories[item.category].value += (item.price * item.quantity);
        categories[item.category].qty += item.quantity;
      });
    });
    return Object.values(categories).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const salesByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, revenue: 0, orders: 0 }));
    filteredData.forEach(order => {
      const hour = parseISO(order.timestamp).getHours();
      hours[hour].revenue += (order.totalAmount - (order.discount || 0));
      hours[hour].orders += 1;
    });
    // Filter to active hours only (e.g. 10 AM to 11 PM) to make charts cleaner
    return hours.filter(h => h.orders > 0 || (parseInt(h.hour) >= 10 && parseInt(h.hour) <= 23));
  }, [filteredData]);

  const topItems = useMemo(() => {
    const items = {};
    filteredData.forEach(order => {
      order.items.forEach(item => {
        if (!items[item.name]) items[item.name] = { name: item.name, revenue: 0, qty: 0 };
        items[item.name].revenue += (item.price * item.quantity);
        items[item.name].qty += item.quantity;
      });
    });
    return Object.values(items).sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  const paymentBreakdown = useMemo(() => {
    const methods = { Cash: 0, Card: 0, UPI: 0, Wallet: 0 };
    filteredData.forEach(order => {
      const pMethod = order.paymentMethod || 'Cash';
      if (methods[pMethod] !== undefined) {
        methods[pMethod] += (order.totalAmount - (order.discount || 0));
      }
    });
    return methods;
  }, [filteredData]);

  // --- EXPORT FUNCTIONALITY ---
  const handleExport = (formatType) => {
    setExportAnchorEl(null);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // 1. Summary Sheet
    const summaryData = [
      ['Saffron Roots Analytics Report'],
      ['Generated On:', format(new Date(), 'PPpp')],
      ['Filter Applied:', dateFilter],
      [],
      ['Metric', 'Value'],
      ['Total Orders', kpis.orders],
      ['Gross Sales', `₹${(kpis.grossSales * 25).toFixed(2)}`],
      ['Total Discounts', `₹${(kpis.discounts * 25).toFixed(2)}`],
      ['Net Sales', `₹${(kpis.netSales * 25).toFixed(2)}`],
      ['Average Order Value', `₹${(kpis.avgOrderValue * 25).toFixed(2)}`],
      [],
      ['Payment Method', 'Amount'],
      ['Cash', `₹${(paymentBreakdown.Cash * 25).toFixed(2)}`],
      ['Card', `₹${(paymentBreakdown.Card * 25).toFixed(2)}`],
      ['UPI', `₹${(paymentBreakdown.UPI * 25).toFixed(2)}`],
      ['Wallet', `₹${(paymentBreakdown.Wallet * 25).toFixed(2)}`]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // 2. Item Sales Sheet
    const itemData = topItems.map(item => ({
      'Item Name': item.name,
      'Quantity Sold': item.qty,
      'Revenue (₹)': (item.revenue * 25).toFixed(2)
    }));
    const wsItems = XLSX.utils.json_to_sheet(itemData);
    XLSX.utils.book_append_sheet(wb, wsItems, "Sales By Item");

    // 3. Category Sales Sheet
    const categoryData = salesByCategory.map(cat => ({
      'Category': cat.name,
      'Quantity Sold': cat.qty,
      'Revenue (₹)': (cat.value * 25).toFixed(2)
    }));
    const wsCategories = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, wsCategories, "Sales By Category");

    // Download
    if (formatType === 'excel') {
      XLSX.writeFile(wb, `Saffron Roots_Analytics_${dateFilter}.xlsx`);
    } else {
      XLSX.writeFile(wb, `Saffron Roots_Analytics_${dateFilter}.csv`, { bookType: 'csv' });
    }
  };

  const formatCurrency = (val) => `₹${(val * 25).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto hide-scrollbar pb-10">
      
      {/* Header & Filter Bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Analytics Dashboard</h1>
            <p className="text-xs font-bold text-slate-500">Real-time business insights & reporting</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              sx={{ borderRadius: '12px', fontWeight: 'bold', backgroundColor: 'white' }}
            >
              <MenuItem value="today" className="font-bold">Today</MenuItem>
              <MenuItem value="yesterday" className="font-bold">Yesterday</MenuItem>
              <MenuItem value="last7" className="font-bold">Last 7 Days</MenuItem>
              <MenuItem value="last30" className="font-bold">Last 30 Days</MenuItem>
              <MenuItem value="thisMonth" className="font-bold">This Month</MenuItem>
              <MenuItem value="lastMonth" className="font-bold">Last Month</MenuItem>
              <MenuItem value="thisYear" className="font-bold">This Year</MenuItem>
              <MenuItem value="custom" className="font-bold">Custom Range...</MenuItem>
            </Select>
          </FormControl>

          {dateFilter === 'custom' && (
            <>
              <Button 
                variant="outlined" 
                onClick={(e) => setDatePickerAnchorEl(e.currentTarget)}
                sx={{ borderRadius: '12px', fontWeight: 'bold', borderColor: '#e2e8f0', color: '#334155', textTransform: 'none', backgroundColor: 'white', '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' } }}
              >
                {format(dateRange[0].startDate, 'MMM dd, yyyy')} - {format(dateRange[0].endDate, 'MMM dd, yyyy')}
              </Button>
              <Menu
                anchorEl={datePickerAnchorEl}
                open={Boolean(datePickerAnchorEl)}
                onClose={() => setDatePickerAnchorEl(null)}
                PaperProps={{ sx: { borderRadius: '16px', mt: 1, p: 0, overflow: 'hidden', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' } }}
              >
                <DateRange
                  editableDateInputs={true}
                  onChange={item => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  rangeColors={['#4f46e5']}
                />
              </Menu>
            </>
          )}

          <Button 
            variant="contained" 
            startIcon={<Download size={18} />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            sx={{ borderRadius: '12px', fontWeight: 'bold', textTransform: 'none', backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
          >
            Export Report
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
            PaperProps={{ sx: { borderRadius: '12px', mt: 1, minWidth: 150 } }}
          >
            <MenuItem onClick={() => handleExport('excel')} className="font-bold text-slate-700">Excel (.xlsx)</MenuItem>
            <MenuItem onClick={() => handleExport('csv')} className="font-bold text-slate-700">CSV</MenuItem>
          </Menu>
        </div>
      </div>

      <div className="p-8 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Net Sales" value={formatCurrency(kpis.netSales)} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-100" />
          <KPICard title="Total Orders" value={kpis.orders} icon={ShoppingBag} color="text-indigo-600" bg="bg-indigo-100" />
          <KPICard title="Avg Order Value" value={formatCurrency(kpis.avgOrderValue)} icon={Activity} color="text-amber-600" bg="bg-amber-100" />
          <KPICard title="Discounts Given" value={formatCurrency(kpis.discounts)} icon={Percent} color="text-rose-600" bg="bg-rose-100" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hourly Sales Area Chart */}
          <Card className="lg:col-span-2 shadow-sm rounded-2xl border border-slate-200" elevation={0}>
            <CardContent className="p-6">
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <Clock size={20} className="text-slate-400" /> Hourly Sales Trend
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesByHour}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(val) => `₹${(val*25)/1000}k`} />
                    <RechartsTooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Sales Donut */}
          <Card className="shadow-sm rounded-2xl border border-slate-200" elevation={0}>
            <CardContent className="p-6">
              <h3 className="text-lg font-extrabold text-slate-800 mb-2">Sales by Category</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 & Day End Report */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Selling Items Table */}
          <Card className="lg:col-span-2 shadow-sm rounded-2xl border border-slate-200" elevation={0}>
            <CardContent className="p-0">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-800">Top Selling Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Item Name</th>
                      <th className="p-4 font-bold border-b border-slate-200 text-right">Qty Sold</th>
                      <th className="p-4 font-bold border-b border-slate-200 text-right">Revenue</th>
                      <th className="p-4 font-bold border-b border-slate-200 text-right">% of Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.slice(0, 8).map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                        <td className="p-4 font-bold text-slate-800 text-sm">{item.name}</td>
                        <td className="p-4 font-bold text-slate-600 text-sm text-right">{item.qty}</td>
                        <td className="p-4 font-extrabold text-indigo-600 text-sm text-right">{formatCurrency(item.revenue)}</td>
                        <td className="p-4 font-bold text-slate-500 text-sm text-right">
                          {kpis.netSales > 0 ? ((item.revenue / kpis.netSales) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Day End Report Snapshot */}
          <Card className="shadow-sm rounded-2xl border border-slate-200 bg-slate-900 text-white" elevation={0}>
            <CardContent className="p-6">
              <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2">
                <CalendarIcon size={20} className="text-indigo-400" /> Day End Snapshot
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="text-slate-400 font-bold text-sm">Gross Sales</span>
                  <span className="text-white font-extrabold">{formatCurrency(kpis.grossSales)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="text-slate-400 font-bold text-sm">Discounts</span>
                  <span className="text-rose-400 font-extrabold">-{formatCurrency(kpis.discounts)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="text-slate-400 font-bold text-sm">Net Sales</span>
                  <span className="text-emerald-400 font-extrabold text-lg">{formatCurrency(kpis.netSales)}</span>
                </div>
                
                <div className="pt-4 space-y-3">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Payment Breakdown</h4>
                  {Object.entries(paymentBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center">
                      <span className="text-slate-300 font-medium text-sm flex items-center gap-2">
                        <CreditCard size={14} className="text-indigo-400"/> {method}
                      </span>
                      <span className="text-white font-bold text-sm">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

const KPICard = ({ title, value, icon: Icon, color, bg }) => (
  <Card className="shadow-sm rounded-2xl border border-slate-200" elevation={0}>
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        <Icon size={26} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </CardContent>
  </Card>
);

