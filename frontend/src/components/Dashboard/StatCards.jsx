import React from 'react';
import { LayoutDashboard, PlayCircle, Utensils, BellRing } from 'lucide-react';

export default function StatCards({ orders, pending, preparing, activeWaiterRequests, setActiveTab }) {
  const stats = [
    { title: 'Total Orders', value: orders.length, icon: LayoutDashboard, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', tab: 'HISTORY' },
    { title: 'Pending Now', value: pending.length, icon: PlayCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', tab: 'ORDERS' },
    { title: 'Preparing', value: preparing.length, icon: Utensils, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tab: 'ORDERS' },
    { title: 'Waiter Requests', value: activeWaiterRequests.length, icon: BellRing, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', tab: 'WAITER' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div key={i} onClick={() => setActiveTab(stat.tab)} className={`cursor-pointer bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm border ${stat.border} hover:shadow-md hover:scale-[1.02] transition-all`}>
          <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</h4>
          </div>
        </div>
      ))}
    </div>
  );
}
