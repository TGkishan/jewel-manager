export interface Component {
  id: string;
  name: string;
  price: number;
  unit: string; // e.g., 'pcs', 'gram', 'meter'
  category: string;
}

export interface ProductComponent {
  componentId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  makingCharges: number;
  components: ProductComponent[];
  // Computed fields for display (not stored)
  totalCost?: number;
}

export type View = 'dashboard' | 'components' | 'products';

export interface AIAnalysisResult {
  analysis: string;
  suggestions: string[];
}
