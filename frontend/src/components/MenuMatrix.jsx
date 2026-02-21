import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function MenuMatrix({ data }) {
    const [view, setView] = useState('global');
    const [category, setCategory] = useState('ALL');
    const [zoom, setZoom] = useState(1);

    if (!data || !data.global_matrix) return <div className="p-8 text-center text-gray-500">No menu data available.</div>;

    const currentMatrix = view === 'global' ? data.global_matrix : (data.per_cluster[view] || data.global_matrix);

    // Create a robust function to map any messy POS data into BEVERAGES, FOOD, or OTHER
    const getMacroCategory = (product) => {
        const text = ((product.product_desc || '') + " " + (product.category || '')).toUpperCase();
        if (text.match(/COFFEE|ESPRESSO|LATTE|MOCHA|TEA|BEVERAGE|JUICE|WATER|FRAPPE|MACCHIATO|CAPPUCCINO|DRINK|BREW|BAR/)) return 'BEVERAGES';
        if (text.match(/CAKE|CROISSANT|BREAD|SANDWICH|SALAD|YOGHURT|PASTRY|MUFFIN|FOOD|COOKIE|BROWNIE|GRAB&GO|BREAKFAST/)) return 'FOOD';
        return 'OTHER';
    };

    let allProducts = (currentMatrix.products || []).map(p => ({
        ...p,
        macro_category: getMacroCategory(p)
    }));

    // Allow users to filter by these top-level groupings.
    const availableCategories = ['ALL', 'BEVERAGES', 'FOOD', 'OTHER'];

    let products = allProducts;
    if (category !== 'ALL') {
        products = allProducts.filter(p => p.macro_category === category);
    }

    const QUADRANT_COLORS = {
        'Star': '#d97706', // gold
        'Plowhorse': '#3b82f6', // blue
        'Puzzle': '#8b5cf6', // purple
        'Dog': '#e11d48' // red
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm max-w-xs z-50">
                    <p className="font-bold text-gray-800 mb-1">{data.product_desc || data.product}</p>
                    <p className="text-gray-600">Classification: <span style={{ color: QUADRANT_COLORS[data.classification] }} className="font-semibold text-base">{data.classification}</span></p>
                    <p className="text-gray-600">Popularity: <span className="font-medium">{data.popularity_pct}%</span></p>
                    <p className="text-gray-600">Profit Margin: <span className="font-medium">{data.profit_pct}%</span></p>

                    {data.reason && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-blue-700 font-medium leading-relaxed">{data.reason}</p>
                        </div>
                    )}

                    {data.recommendation && (
                        <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                            <p className="text-xs text-gray-800 leading-relaxed"><span className="font-bold">Advice:</span> {data.recommendation}</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Menu Engineering (BCG Matrix)</h2>
                    <p className="text-sm text-gray-500">Optimize product margins based on popularity and profitability.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg mr-2">
                        <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="p-1.5 bg-white border rounded shadow-sm text-gray-600 hover:text-emerald-600"><ZoomOut className="w-4 h-4" /></button>
                        <span className="text-xs font-bold text-gray-500 px-2 w-12 text-center">{zoom * 100}%</span>
                        <button onClick={() => setZoom(z => Math.min(5, z + 0.5))} className="p-1.5 bg-white border rounded shadow-sm text-gray-600 hover:text-emerald-600"><ZoomIn className="w-4 h-4" /></button>
                    </div>
                    <select
                        value={view}
                        onChange={(e) => setView(e.target.value)}
                        className="border-gray-300 rounded-lg shadow-sm text-sm p-2"
                    >
                        <option value="global">Global (All Branches)</option>
                        {Object.keys(data.per_cluster || {}).map(cluster => (
                            <option key={cluster} value={cluster}>{cluster}</option>
                        ))}
                    </select>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="border-gray-300 rounded-lg shadow-sm text-sm p-2 max-w-xs truncate"
                    >
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'ALL' ? 'All Categories' : cat} ({cat === 'ALL' ? allProducts.length : allProducts.filter(p => p.macro_category === cat).length})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white p-2 rounded-xl shadow h-[600px] overflow-auto custom-scrollbar relative border border-gray-100">
                <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%`, minWidth: '100%', minHeight: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="popularity_pct" name="Popularity" unit="%" />
                            <YAxis type="number" dataKey="profit_pct" name="Profit Margin" unit="%" />
                            <Tooltip content={<CustomTooltip />} />

                            <ReferenceLine x={currentMatrix.pop_threshold} stroke="#9ca3af" strokeDasharray="3 3" />
                            <ReferenceLine y={currentMatrix.profit_threshold} stroke="#9ca3af" strokeDasharray="3 3" />

                            <Scatter name="Products" data={products}>
                                {products.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={QUADRANT_COLORS[entry.classification] || '#8884d8'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Legend below chart */}
            <div className="flex justify-center gap-6 mt-2">
                {Object.entries(QUADRANT_COLORS).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
