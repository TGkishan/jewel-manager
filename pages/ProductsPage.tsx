
import React, { useState, useMemo } from 'react';
import { Component, Product, ProductComponent } from '../types';
import { Plus, Trash2, ChevronRight, Save, Calculator } from 'lucide-react';
import { dataService } from '../services/api';

interface ProductsPageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  components: Component[];
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ products, setProducts, components }) => {
  const [isCreating, setIsCreating] = useState(false);
  
  // New Product State
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductMakingCharge, setNewProductMakingCharge] = useState(0);
  const [selectedComponents, setSelectedComponents] = useState<ProductComponent[]>([]);
  
  // Helper to find component details
  const getComponent = (id: string) => components.find(c => c.id === id);

  // Calculate dynamic cost
  const calculateCost = (prodComponents: ProductComponent[], makingCharge: number) => {
    const materialCost = prodComponents.reduce((sum, item) => {
      const comp = getComponent(item.componentId);
      return sum + (comp ? comp.price * item.quantity : 0);
    }, 0);
    return materialCost + makingCharge;
  };

  const currentTotalCost = useMemo(() => 
    calculateCost(selectedComponents, newProductMakingCharge), 
    [selectedComponents, newProductMakingCharge, components]
  );

  const addComponentToProduct = (compId: string) => {
    const existing = selectedComponents.find(sc => sc.componentId === compId);
    if (existing) {
      setSelectedComponents(selectedComponents.map(sc => 
        sc.componentId === compId ? { ...sc, quantity: sc.quantity + 1 } : sc
      ));
    } else {
      setSelectedComponents([...selectedComponents, { componentId: compId, quantity: 1 }]);
    }
  };

  const saveProduct = async () => {
    if (!newProductName) return alert("Product name required");
    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: newProductName,
      sku: newProductSku,
      makingCharges: newProductMakingCharge,
      components: selectedComponents
    };
    
    await dataService.addProduct(newProduct);
    setProducts([...products, newProduct]);
    resetForm();
  };

  const resetForm = () => {
    setIsCreating(false);
    setNewProductName('');
    setNewProductSku('');
    setNewProductMakingCharge(0);
    setSelectedComponents([]);
  };

  const deleteProduct = async (id: string) => {
    if (confirm("Delete this product?")) {
      await dataService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-8 space-y-6 h-screen overflow-y-auto pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Products</h2>
          <p className="text-slate-500">Build recipes and track costs automatically.</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-yellow-600 shadow-lg transition-all"
          >
            <Plus size={20} /> New Product
          </button>
        )}
      </div>

      {/* Builder Mode */}
      {isCreating && (
        <div className="bg-white rounded-xl shadow-xl border border-primary/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Calculator size={20} className="text-primary"/> 
              Product Builder
            </h3>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Estimated Cost</p>
              <p className="text-3xl font-bold text-emerald-600">₹{currentTotalCost.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-slate-100">
            {/* Left: Details & Selected List */}
            <div className="col-span-2 p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-white border border-slate-300 rounded focus:border-primary outline-none text-slate-900"
                    placeholder="e.g. Bridal Necklace Set"
                    value={newProductName}
                    onChange={e => setNewProductName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Code</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-white border border-slate-300 rounded focus:border-primary outline-none text-slate-900"
                    placeholder="e.g. BN-001"
                    value={newProductSku}
                    onChange={e => setNewProductSku(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">Components Used</label>
                  <span className="text-xs text-slate-400">Add from right sidebar</span>
                </div>
                <div className="border border-slate-200 rounded-lg bg-white min-h-[200px] p-2 space-y-2">
                  {selectedComponents.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 italic p-4">
                      Select components from the list to start building
                    </div>
                  )}
                  {selectedComponents.map((item, idx) => {
                    const comp = getComponent(item.componentId);
                    if (!comp) return null;
                    return (
                      <div key={idx} className="bg-white p-3 rounded shadow-sm flex justify-between items-center border border-slate-100">
                        <div>
                          <p className="font-medium text-slate-800">{comp.name}</p>
                          <p className="text-xs text-slate-500">₹{comp.price}/{comp.unit}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500">Qty:</label>
                            <input 
                              type="number" 
                              min="0.1" step="0.1"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = parseFloat(e.target.value);
                                setSelectedComponents(selectedComponents.map((x, i) => i === idx ? {...x, quantity: qty} : x));
                              }}
                              className="w-20 p-1 bg-white border border-slate-300 rounded text-center text-slate-900"
                            />
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="font-bold text-slate-700">₹{(comp.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <button 
                            onClick={() => setSelectedComponents(selectedComponents.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <div>
                  <p className="font-bold text-yellow-800">Making / Labor Charges</p>
                  <p className="text-xs text-yellow-600">Assembly, polishing, packaging</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-800 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={newProductMakingCharge}
                    onChange={e => setNewProductMakingCharge(parseFloat(e.target.value) || 0)}
                    className="w-24 p-2 bg-white border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none text-right font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={resetForm} className="px-6 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                <button onClick={saveProduct} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-yellow-600 shadow-lg font-bold flex items-center gap-2">
                  <Save size={18} /> Save Product
                </button>
              </div>
            </div>

            {/* Right: Component Selector */}
            <div className="col-span-1 bg-slate-50 p-4 h-full max-h-[600px] overflow-y-auto">
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Available Components</h4>
              <input type="text" placeholder="Search..." className="w-full mb-3 p-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-primary text-slate-900" />
              <div className="space-y-2">
                {components.map(comp => (
                  <button 
                    key={comp.id}
                    onClick={() => addComponentToProduct(comp.id)}
                    className="w-full text-left p-3 bg-white border border-slate-200 rounded hover:border-primary hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-slate-700 group-hover:text-primary">{comp.name}</span>
                      <Plus size={16} className="text-slate-300 group-hover:text-primary" />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>{comp.category}</span>
                      <span className="font-mono">₹{comp.price}/{comp.unit}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map(product => {
          const totalCost = calculateCost(product.components, product.makingCharges);
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow duration-300 group">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{product.name}</h3>
                    <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded inline-block mt-1">{product.sku}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs text-slate-400">Total Cost</p>
                     <p className="text-2xl font-bold text-emerald-600">₹{totalCost.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm text-slate-600 border-b border-slate-100 pb-1">
                    <span>Making Charges</span>
                    <span>₹{product.makingCharges.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 border-b border-slate-100 pb-1">
                    <span>Material Cost</span>
                    <span>₹{(totalCost - product.makingCharges).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2">{product.components.length} Components Used</p>
                    <div className="flex gap-1 overflow-hidden">
                        {product.components.slice(0, 4).map((pc, i) => {
                            const c = getComponent(pc.componentId);
                            return c ? (
                                <div key={i} className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 border border-white ring-1 ring-slate-100" title={c.name}>
                                    {c.name[0]}
                                </div>
                            ) : null;
                        })}
                        {product.components.length > 4 && <span className="text-xs text-slate-400 ml-1">+{product.components.length - 4}</span>}
                    </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 flex justify-end border-t border-slate-200 rounded-b-xl opacity-50 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
