
import React, { useEffect, useState } from 'react';
import { Product, Component, AIAnalysisResult } from '../types';
import { analyzeCosting } from '../services/geminiService';
import { Sparkles, TrendingUp, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  components: Component[];
}

export const Dashboard: React.FC<DashboardProps> = ({ products, components }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Stats
  const totalProducts = products.length;
  const totalComponents = components.length;
  
  // Calculate total portfolio value (assuming 1 unit of each product made)
  const portfolioValue = products.reduce((sum, prod) => {
    const matCost = prod.components.reduce((cSum, pc) => {
      const c = components.find(x => x.id === pc.componentId);
      return cSum + (c ? c.price * pc.quantity : 0);
    }, 0);
    return sum + matCost + prod.makingCharges;
  }, 0);

  const handleAIAnalysis = async () => {
    if (products.length === 0) return;
    setLoading(true);
    try {
      const result = await analyzeCosting(products, components);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-secondary">Dashboard</h2>
        <p className="text-slate-500">Overview of your jewelry manufacturing business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-white/20 rounded-lg"><TrendingUp size={24} /></div>
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Live</span>
          </div>
          <p className="text-sm text-yellow-100">Total Catalog Value (Unit Cost)</p>
          <h3 className="text-3xl font-bold mt-1">₹{portfolioValue.toFixed(2)}</h3>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><span className="text-xl font-bold">₹</span></div>
                <div>
                    <p className="text-sm text-slate-500">Active Products</p>
                    <h3 className="text-2xl font-bold text-slate-800">{totalProducts}</h3>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp size={24}/></div>
                <div>
                    <p className="text-sm text-slate-500">Components Tracked</p>
                    <h3 className="text-2xl font-bold text-slate-800">{totalComponents}</h3>
                </div>
            </div>
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-white rounded-xl shadow-xl border border-indigo-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="text-yellow-300" /> AI Cost Analyst
                </h3>
                <p className="text-indigo-200 text-sm mt-1">Get insights on your pricing strategy using Gemini.</p>
            </div>
            <button 
                onClick={handleAIAnalysis}
                disabled={loading || products.length === 0}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                {loading ? 'Analyzing...' : 'Analyze Now'}
            </button>
        </div>

        <div className="p-6">
            {!analysis ? (
                <div className="text-center py-12 text-slate-400">
                    <Sparkles size={48} className="mx-auto mb-4 opacity-20"/>
                    <p>Click "Analyze Now" to generate insights based on your current inventory and product recipes.</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in">
                    <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Market Analysis</h4>
                        <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                            {analysis.analysis}
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Optimization Suggestions</h4>
                        <div className="grid gap-4 md:grid-cols-3">
                            {analysis.suggestions.map((sugg, i) => (
                                <div key={i} className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg flex items-start gap-3">
                                    <div className="bg-yellow-100 text-yellow-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-slate-700">{sugg}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
