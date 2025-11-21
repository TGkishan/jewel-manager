
import React from 'react';
import { LayoutDashboard, Package, Layers, Settings, Wifi, WifiOff } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOnline }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'components', label: 'Components', icon: Layers },
    { id: 'products', label: 'Products', icon: Package },
  ];

  return (
    <div className="w-64 bg-white text-slate-800 h-screen flex flex-col fixed left-0 top-0 shadow-xl z-10 border-r border-slate-200">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <span className="text-3xl">💎</span> JewelCost
        </h1>
        <p className="text-xs text-slate-400 mt-1">Imitation Jewelry Manager</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id as View)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-slate-100 text-primary font-bold shadow-sm ring-1 ring-slate-200'
                : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
            }`}
          >
            <item.icon size={20} className={currentView === item.id ? 'text-primary' : 'text-slate-400'} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className={`p-3 rounded border text-xs transition-colors ${isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
          <div className="flex items-center gap-2 mb-1 font-semibold">
            <Settings size={14} />
            <span>System Status</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="font-bold">{isOnline ? 'Online (Django)' : 'Offline (Local)'}</span>
          </div>
          <p className="mt-1 opacity-75 text-[10px]">
             {isOnline ? 'Data saved to database' : 'Data saved to browser'}
          </p>
        </div>
      </div>
    </div>
  );
};
