import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#78350f', '#059669', '#d97706', '#e11d48', '#3b82f6'];

export default function BranchDashboard({ data }) {
    if (!data || !data.clusters || data.clusters.length === 0) {
        return <div className="p-8 text-center text-gray-500">No branch data available. Please upload files first.</div>;
    }

    const { clusters, branch_data } = data;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const b = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm max-w-xs z-50">
                    <p className="font-bold text-gray-800 mb-1">{b.branch}</p>
                    <p className="text-gray-600">Cluster: <span className="font-semibold">{b.cluster_label}</span></p>
                    <p className="text-gray-600">Revenue: ${(b.total_annual_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-gray-600">Margin: {((b.avg_margin || 0) * 100).toFixed(1)}%</p>
                    <p className="text-gray-600 whitespace-nowrap">YoY Growth: {((b.yoy_growth || 0) * 100).toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {clusters.map((c, i) => (
                    <div key={c.id} className="bg-white rounded-xl shadow p-6 border-l-4" style={{ borderColor: COLORS[i % COLORS.length] }}>
                        <h3 className="font-bold text-gray-800 text-lg mb-2">{c.label}</h3>
                        <p className="text-sm text-gray-600 mb-4">{c.strategy}</p>
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Branches:</span>
                            <span>{c.branches.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Avg Rev:</span>
                            <span>${c.avg_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-xl font-bold mb-6 text-gray-800">Branch Performance Clusters</h3>
                <p className="text-sm text-gray-500 mb-4">Scatter plot of Branches by Revenue vs Profit Margin</p>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="total_annual_revenue" name="Annual Revenue" unit="$" />
                            <YAxis type="number" dataKey="avg_margin" name="Avg Margin" />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Branches" data={branch_data} fill="#8884d8">
                                {branch_data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.cluster % COLORS.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Branch Leaderboard</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">Branch</th>
                                <th className="px-6 py-3 font-medium">Cluster</th>
                                <th className="px-6 py-3 font-medium">Annual Revenue</th>
                                <th className="px-6 py-3 font-medium">Avg Margin</th>
                                <th className="px-6 py-3 font-medium">YoY Growth</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {branch_data.sort((a, b) => b.total_annual_revenue - a.total_annual_revenue).map((b, i) => (
                                <tr key={b.branch} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{b.branch}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                                            {b.cluster_label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">${(b.total_annual_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4">{((b.avg_margin || 0) * 100).toFixed(1)}%</td>
                                    <td className={`px-6 py-4 ${(b.yoy_growth || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {((b.yoy_growth || 0) * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">How this AI Model Works (Explainability)</h3>
                <p className="text-sm text-blue-800 leading-relaxed mb-6">
                    This dashboard uses <strong>K-Means Clustering</strong> to mathematically group branches into distinct behavioral segments based on Annual Revenue, Profit Margin, and Year-over-Year Growth. This allows executives to safely deploy targeted financial strategies to maximize EBITDA instead of using "one-size-fits-all" approaches:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                        <h4 className="font-bold text-emerald-800 text-[13px] mb-2">Flagship (High Rev, High Margin)</h4>
                        <p className="text-xs text-gray-700 mb-2"><strong>Insight:</strong> Print money. High volume and excellent cost control.</p>
                        <p className="text-xs text-gray-700"><strong>Action:</strong> Protect volume. Reinvest in staff retention instead of aggressive pricing.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                        <h4 className="font-bold text-amber-800 text-[13px] mb-2">High Volume (High Rev, Low Margin)</h4>
                        <p className="text-xs text-gray-700 mb-2"><strong>Insight:</strong> Massive sales, but bleeding profit (e.g., waste or low-margin mix).</p>
                        <p className="text-xs text-gray-700"><strong>Action:</strong> Implement small 2%-5% price hikes; margin recovery goes straight to the bottom line.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                        <h4 className="font-bold text-purple-800 text-[13px] mb-2">Niche/Premium (Low Rev, High Margin)</h4>
                        <p className="text-xs text-gray-700 mb-2"><strong>Insight:</strong> Sells high-profit items but lacks raw foot traffic.</p>
                        <p className="text-xs text-gray-700"><strong>Action:</strong> Invest localized marketing dollars specifically into these neighborhoods.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                        <h4 className="font-bold text-rose-800 text-[13px] mb-2">Underperforming (Low Rev, Low Margin)</h4>
                        <p className="text-xs text-gray-700 mb-2"><strong>Insight:</strong> Actively draining company resources and footprint value.</p>
                        <p className="text-xs text-gray-700"><strong>Action:</strong> Conduct immediate operational audit; evaluate bad leases for closure.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
