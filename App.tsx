
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ComponentsPage } from './pages/ComponentsPage';
import { ProductsPage } from './pages/ProductsPage';
import { View, Component, Product } from './types';
import { dataService, getBackendStatus } from './services/api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [components, setComponents] = useState<Component[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch Data on Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const comps = await dataService.fetchComponents();
        const prods = await dataService.fetchProducts();
        
        // Update online status after fetch attempts
        setIsOnline(getBackendStatus());

        if (comps.length === 0) {
            const defaults = [
                { id: '1', name: 'Gold Plated Chain (Fine)', price: 12.50, unit: 'meter', category: 'Chain' },
                { id: '2', name: 'Crystal Bead 4mm', price: 0.50, unit: 'pcs', category: 'Beads' },
                { id: '3', name: 'Lobster Clasp', price: 2.00, unit: 'pcs', category: 'Findings' },
                { id: '4', name: 'Pendant Base (Brass)', price: 15.00, unit: 'pcs', category: 'Pendants' },
            ];
            setComponents(defaults);
            // Try to save defaults if we are using local storage, so it persists
            if (!getBackendStatus()) {
                defaults.forEach(c => dataService.addComponent(c));
            }
        } else {
            setComponents(comps);
        }

        if (prods.length === 0 && comps.length === 0) {
             const defaultProd = [
              {
                id: 'p1',
                name: 'Crystal Simple Necklace',
                sku: 'NCK-001',
                makingCharges: 25.00,
                components: [
                  { componentId: '1', quantity: 0.5 },
                  { componentId: '2', quantity: 10 },
                  { componentId: '3', quantity: 1 }
                ]
              }
            ];
            setProducts(defaultProd);
            if (!getBackendStatus()) {
                defaultProd.forEach(p => dataService.addProduct(p));
            }
        } else {
            setProducts(prods);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const renderContent = () => {
    if (loading) return <div className="flex h-full items-center justify-center text-slate-400">Loading...</div>;

    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={products} components={components} />;
      case 'components':
        return <ComponentsPage components={components} setComponents={setComponents} />;
      case 'products':
        return <ProductsPage products={products} setProducts={setProducts} components={components} />;
      default:
        return <Dashboard products={products} components={components} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} isOnline={isOnline} />
      <main className="ml-64 flex-1 overflow-x-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
