import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, BarChart, Bar, Legend } from 'recharts';
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
            <div className="flex justify-center gap-6 mt-2 mb-8">
                {Object.entries(QUADRANT_COLORS).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                        <span>{label}</span>
                    </div>
                ))}
            </div>

            {/* Action Table */}
            <div className="glass-card p-6 animate-fade-in-up delay-300">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Action Plan by Product</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-600">
                        <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-100 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Product</th>
                                <th className="px-4 py-3 font-semibold">Category</th>
                                <th className="px-4 py-3 font-semibold">Classification</th>
                                <th className="px-4 py-3 font-semibold">Qty %</th>
                                <th className="px-4 py-3 font-semibold">Profit %</th>
                                <th className="px-4 py-3 font-semibold">Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.sort((a, b) => b.profit_pct - a.profit_pct).slice(0, 50).map((p, i) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">{p.product_desc || p.product}</td>
                                    <td className="px-4 py-3">{p.macro_category}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${QUADRANT_COLORS[p.classification]}20`, color: QUADRANT_COLORS[p.classification] }}>
                                            {p.classification}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{p.popularity_pct}%</td>
                                    <td className="px-4 py-3">{p.profit_pct}%</td>
                                    <td className="px-4 py-3 text-xs leading-tight min-w-[250px]">{p.recommendation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="text-xs text-gray-400 mt-2 italic text-center">Showing top 50 products matching current filters</div>
                </div>
            </div>

            {/* Modifier Insights Panel */}
            {data.modifier_analysis && data.modifier_analysis.branch_stats && (
                <div className="glass-card p-6 animate-fade-in-up delay-400">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Modifier Attachment Rates (Upsell Opportunity)</h3>
                            <p className="text-sm text-gray-500">Percentage of total orders containing high-margin modifiers (e.g., extra shots, syups, milks).</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.modifier_analysis.branch_stats.sort((a, b) => b.attachment_rate - a.attachment_rate)}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="branch"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    interval={0}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis unit="%" />
                                <Tooltip
                                    formatter={(value) => [`${value}%`, 'Attachment Rate']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="attachment_rate"
                                    name="Attachment Rate"
                                    fill="#059669"
                                    radius={[4, 4, 0, 0]}
                                >
                                    {data.modifier_analysis.branch_stats.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.attachment_rate < 15 ? '#e11d48' : '#059669'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
