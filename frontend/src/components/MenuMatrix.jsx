import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export default function MenuMatrix({ data }) {
    const [view, setView] = useState('global');
    const [category, setCategory] = useState('ALL');

    if (!data || !data.global_matrix) return <div className="p-8 text-center text-gray-500">No menu data available.</div>;

    const currentMatrix = view === 'global' ? data.global_matrix : (data.per_cluster[view] || data.global_matrix);
    let products = currentMatrix.products || [];

    if (category !== 'ALL') {
        products = products.filter(p => p.category === category);
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
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm max-w-xs">
                    <p className="font-bold text-gray-800">{data.product_desc || data.product}</p>
                    <p className="text-gray-600">Classification: <span style={{ color: QUADRANT_COLORS[data.classification] }} className="font-semibold">{data.classification}</span></p>
                    <p className="text-gray-600">Popularity: {data.popularity_pct}%</p>
                    <p className="text-gray-600">Profit Margin: {data.profit_pct}%</p>
                    <p className="mt-2 text-xs text-gray-500 italic">{data.recommendation}</p>
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
                <div className="flex gap-4">
                    <select
                        value={view}
                        onChange={(e) => setView(e.target.value)}
                        className="border-gray-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                    >
                        <option value="global">Global (All Branches)</option>
                        {Object.keys(data.per_cluster || {}).map(cluster => (
                            <option key={cluster} value={cluster}>{cluster}</option>
                        ))}
                    </select>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="border-gray-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                    >
                        <option value="ALL">All Categories</option>
                        <option value="BEVERAGES">Beverages</option>
                        <option value="FOOD">Food</option>
                    </select>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
