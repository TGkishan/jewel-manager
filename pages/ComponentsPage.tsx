
import React, { useState, useRef } from 'react';
import { Component } from '../types';
import { Plus, Trash2, Upload, Download, Search, Save } from 'lucide-react';
import { parseComponentsExcel, generateTemplate } from '../services/fileService';
import { dataService } from '../services/api';

interface ComponentsPageProps {
  components: Component[];
  setComponents: React.Dispatch<React.SetStateAction<Component[]>>;
}

export const ComponentsPage: React.FC<ComponentsPageProps> = ({ components, setComponents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newComponent, setNewComponent] = useState<Partial<Component>>({ name: '', price: 0, unit: 'pcs', category: 'General' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!newComponent.name || !newComponent.price) return;
    const component: Component = {
      id: crypto.randomUUID(),
      name: newComponent.name,
      price: Number(newComponent.price),
      unit: newComponent.unit || 'pcs',
      category: newComponent.category || 'General',
    };
    
    // Use Data Service
    await dataService.addComponent(component);
    setComponents([...components, component]);
    setNewComponent({ name: '', price: 0, unit: 'pcs', category: 'General' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This might affect product costs.')) {
      await dataService.deleteComponent(id);
      setComponents(components.filter(c => c.id !== id));
    }
  };

  const handlePriceChange = async (id: string, newPrice: number) => {
    const updated = components.map(c => c.id === id ? { ...c, price: newPrice } : c);
    setComponents(updated);
    const comp = updated.find(c => c.id === id);
    if (comp) await dataService.updateComponent(comp);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const newComponents = await parseComponentsExcel(file);
        // Batch save to service
        for (const comp of newComponents) {
            await dataService.addComponent(comp);
        }
        setComponents(prev => [...prev, ...newComponents]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert(`Successfully imported ${newComponents.length} components.`);
      } catch (error) {
        alert("Error parsing file. Please use the template.");
        console.error(error);
      }
    }
  };

  const filteredComponents = components.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Raw Components</h2>
          <p className="text-slate-500">Manage materials and base prices.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => generateTemplate('component')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <Download size={18} /> Template
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Upload size={18} /> Import Excel
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx,.xls" 
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Quick Add Form - WHITE BOX */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Add New Component</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input 
              type="text" 
              value={newComponent.name}
              onChange={e => setNewComponent({...newComponent, name: e.target.value})}
              className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-slate-900"
              placeholder="e.g. 2mm Gold Bead"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
            <input 
              type="number" 
              value={newComponent.price || ''}
              onChange={e => setNewComponent({...newComponent, price: Number(e.target.value)})}
              className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-slate-900"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
            <select 
              value={newComponent.unit}
              onChange={e => setNewComponent({...newComponent, unit: e.target.value})}
              className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-slate-900"
            >
              <option value="pcs">Pcs</option>
              <option value="gram">Gram</option>
              <option value="meter">Meter</option>
              <option value="pack">Pack</option>
            </select>
          </div>
          <button 
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 bg-primary text-white p-2 rounded-md hover:bg-yellow-600 transition-colors shadow-md"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search components..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-200 p-2 rounded outline-none flex-1 text-slate-600 focus:border-primary"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Unit</th>
                <th className="p-4 w-32">Price (₹)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredComponents.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No components found</td></tr>
              ) : (
                filteredComponents.map(comp => (
                  <tr key={comp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-medium text-slate-800">{comp.name}</td>
                    <td className="p-4 text-slate-600"><span className="px-2 py-1 bg-slate-200 rounded-full text-xs">{comp.category}</span></td>
                    <td className="p-4 text-slate-600">{comp.unit}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">₹</span>
                        <input 
                          type="number" 
                          value={comp.price}
                          onChange={(e) => handlePriceChange(comp.id, Number(e.target.value))}
                          className="w-20 p-1 bg-white border border-slate-300 rounded text-sm focus:border-primary outline-none text-slate-900"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(comp.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
