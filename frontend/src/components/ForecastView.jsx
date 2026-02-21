import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';

export default function ForecastView({ data }) {
    const [factors, setFactors] = useState({
        weather: true,
        holidays: true,
        calendar: true
    });

    if (!data || !data.forecast) return <div className="p-8 text-center text-gray-500">No forecast data available.</div>;

    // Merge historical and forecast data for the chart
    const combinedData = [];

    if (data.historical && data.historical.dates) {
        data.historical.dates.forEach((date, i) => {
            combinedData.push({
                date,
                actual: data.historical.actual_sales[i]
            });
        });
    }

    if (data.forecast && data.forecast.dates) {
        data.forecast.dates.forEach((date, i) => {
            combinedData.push({
                date,
                forecast: data.forecast.predicted_sales[i],
                lower: data.forecast.lower_bound ? data.forecast.lower_bound[i] : null,
                upper: data.forecast.upper_bound ? data.forecast.upper_bound[i] : null
            });
        });
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Sales Demand Forecast</h2>
                        <p className="text-sm text-gray-500">6-month forward projection based on XGBoost/LightGBM model</p>
                    </div>
                    <div className="flex gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={factors.weather} onChange={(e) => setFactors({ ...factors, weather: e.target.checked })} className="rounded text-amber-600 focus:ring-amber-500" />
                            <span>Weather</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={factors.holidays} onChange={(e) => setFactors({ ...factors, holidays: e.target.checked })} className="rounded text-amber-600 focus:ring-amber-500" />
                            <span>Holidays</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={factors.calendar} onChange={(e) => setFactors({ ...factors, calendar: e.target.checked })} className="rounded text-amber-600 focus:ring-amber-500" />
                            <span>Calendar</span>
                        </label>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-96 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={combinedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />

                            {/* Optional Confidence Interval Area */}
                            <Area type="monotone" dataKey="upper" stroke="none" fill="#fef3c7" />
                            <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" />

                            <Line type="monotone" dataKey="actual" stroke="#0f172a" strokeWidth={2} name="Actual Sales" dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="forecast" stroke="#d97706" strokeWidth={2} strokeDasharray="5 5" name="Forecast" dot={{ r: 4 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Model Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Mean Absolute Error (MAE)</span>
                            <span className="font-bold text-gray-900">{data.metrics?.mae || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Mean Abs. Percentage Error (MAPE)</span>
                            <span className="font-bold text-gray-900">{data.metrics?.mape || 'N/A'}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">Model trained on 10 months history, backtested on 3 months.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Top Growth Drivers</h3>
                    <div className="space-y-3">
                        {data.feature_importance?.slice(0, 5).map((feat, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 capitalize">{feat.feature.replace(/_/g, ' ')}</span>
                                    <span className="text-gray-500 font-medium">{(feat.importance * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${feat.importance * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
