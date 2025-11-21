import { Component, Product } from '../types';

// Configuration
// If API_URL is not set in environment variables, we default to empty string
// This signals the app to run in "Local/Offline" mode by default.
const API_URL = process.env.API_URL || '';

// State to track backend health
// If no URL is provided, we start as "Offline" (Local Storage only)
let isBackendOnline = !!API_URL; 

export const getBackendStatus = () => isBackendOnline;

// --- Data Transformers (Frontend camelCase <-> Backend snake_case) ---

const transformComponentToBackend = (c: Component) => ({
    id: c.id,
    name: c.name,
    price: c.price,
    unit: c.unit,
    category: c.category
});

const transformProductToBackend = (p: Product) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    making_charges: p.makingCharges, 
    components: p.components.map(pc => ({
        component_id: pc.componentId,
        quantity: pc.quantity
    }))
});

const transformProductFromBackend = (data: any): Product => ({
    id: data.id,
    name: data.name,
    sku: data.sku,
    makingCharges: parseFloat(data.making_charges),
    components: data.components.map((c: any) => ({
        componentId: c.component_id,
        quantity: c.quantity
    }))
});

// --- Django API Implementation ---
const api = {
  async getComponents(): Promise<Component[]> {
    if (!API_URL) throw new Error("No API Configured");
    try {
        const res = await fetch(`${API_URL}/components/`, { signal: AbortSignal.timeout(2000) });
        if (!res.ok) throw new Error('Server Error');
        const data = await res.json();
        isBackendOnline = true;
        return data;
    } catch (error) {
        isBackendOnline = false;
        throw error;
    }
  },
  async createComponent(comp: Component): Promise<Component> {
    if (!API_URL) throw new Error("No API Configured");
    const res = await fetch(`${API_URL}/components/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformComponentToBackend(comp))
    });
    if (!res.ok) throw new Error('Failed to create');
    isBackendOnline = true;
    return res.json();
  },
  async updateComponent(comp: Component): Promise<Component> {
    if (!API_URL) throw new Error("No API Configured");
    const res = await fetch(`${API_URL}/components/${comp.id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformComponentToBackend(comp))
    });
    if (!res.ok) throw new Error('Failed to update');
    return res.json();
  },
  async deleteComponent(id: string): Promise<void> {
    if (!API_URL) throw new Error("No API Configured");
    const res = await fetch(`${API_URL}/components/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
  },

  async getProducts(): Promise<Product[]> {
    if (!API_URL) throw new Error("No API Configured");
    try {
        const res = await fetch(`${API_URL}/products/`, { signal: AbortSignal.timeout(2000) });
        if (!res.ok) throw new Error('Server Error');
        const data = await res.json();
        isBackendOnline = true;
        return data.map(transformProductFromBackend);
    } catch (error) {
        isBackendOnline = false;
        throw error;
    }
  },
  async createProduct(prod: Product): Promise<Product> {
    if (!API_URL) throw new Error("No API Configured");
    const res = await fetch(`${API_URL}/products/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformProductToBackend(prod))
    });
    if (!res.ok) throw new Error('Failed to create');
    const data = await res.json();
    isBackendOnline = true;
    return transformProductFromBackend(data);
  },
  async deleteProduct(id: string): Promise<void> {
    if (!API_URL) throw new Error("No API Configured");
    const res = await fetch(`${API_URL}/products/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
  }
};

// --- LocalStorage Implementation (Fallback) ---
const storage = {
  getComponents: async (): Promise<Component[]> => {
    const data = localStorage.getItem('jewel_components');
    return data ? JSON.parse(data) : [];
  },
  saveComponents: async (data: Component[]) => {
    localStorage.setItem('jewel_components', JSON.stringify(data));
  },
  getProducts: async (): Promise<Product[]> => {
    const data = localStorage.getItem('jewel_products');
    return data ? JSON.parse(data) : [];
  },
  saveProducts: async (data: Product[]) => {
    localStorage.setItem('jewel_products', JSON.stringify(data));
  }
};

// --- Unified Service Export ---

export const dataService = {
  async fetchComponents(): Promise<Component[]> {
    // If no API URL configured, go straight to local storage
    if (!API_URL) return storage.getComponents();

    try {
        const data = await api.getComponents();
        return data;
    } catch (e) {
        // Silent Fallback
        return storage.getComponents();
    }
  },

  async addComponent(comp: Component): Promise<Component> {
    if (isBackendOnline && API_URL) {
        try {
            return await api.createComponent(comp);
        } catch (e) {
            console.warn("Backend write failed, falling back to local.");
            isBackendOnline = false;
        }
    }
    const current = await storage.getComponents();
    const updated = [...current, comp];
    await storage.saveComponents(updated);
    return comp;
  },

  async updateComponent(comp: Component): Promise<Component> {
    if (isBackendOnline && API_URL) {
        try {
            return await api.updateComponent(comp);
        } catch (e) { isBackendOnline = false; }
    }
    const current = await storage.getComponents();
    const updated = current.map(c => c.id === comp.id ? comp : c);
    await storage.saveComponents(updated);
    return comp;
  },

  async deleteComponent(id: string): Promise<void> {
    if (isBackendOnline && API_URL) {
        try {
            await api.deleteComponent(id);
            return;
        } catch (e) { isBackendOnline = false; }
    }
    const current = await storage.getComponents();
    await storage.saveComponents(current.filter(c => c.id !== id));
  },

  async fetchProducts(): Promise<Product[]> {
    if (!API_URL) return storage.getProducts();
    try {
        const data = await api.getProducts();
        return data;
    } catch (e) {
        return storage.getProducts();
    }
  },

  async addProduct(prod: Product): Promise<Product> {
    if (isBackendOnline && API_URL) {
        try {
            return await api.createProduct(prod);
        } catch (e) { 
            console.warn("Backend write failed, falling back to local.");
            isBackendOnline = false;
        }
    }
    const current = await storage.getProducts();
    const updated = [...current, prod];
    await storage.saveProducts(updated);
    return prod;
  },

  async deleteProduct(id: string): Promise<void> {
    if (isBackendOnline && API_URL) {
        try {
            await api.deleteProduct(id);
            return;
        } catch (e) { isBackendOnline = false; }
    }
    const current = await storage.getProducts();
    await storage.saveProducts(current.filter(p => p.id !== id));
  }
};