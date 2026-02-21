import React from 'react';
import { Download } from 'lucide-react';

export default function ExecutiveSummary({ data }) {
    if (!data) return <div className="p-8 text-center text-gray-500">Summary generation requires data upload.</div>;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white rounded-xl shadow p-8 max-w-4xl mx-auto print:shadow-none print:p-0">
            <div className="flex justify-between items-start border-b-2 border-amber-900 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-amber-900">STORIES COFFEE</h1>
                    <h2 className="text-xl text-gray-700 tracking-wide mt-1">DATA-DRIVEN GROWTH STRATEGY</h2>
                </div>
                <button
                    onClick={handlePrint}
                    className="print:hidden flex items-center gap-2 bg-amber-100 text-amber-900 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            <div className="space-y-8 text-gray-800 leading-relaxed">

                <section>
                    <h3 className="text-lg font-bold text-amber-900 mb-3 border-l-4 border-amber-500 pl-3">PROBLEM STATEMENT</h3>
                    <p>Stories Coffee operates 25 branches with 300+ menu items but lacks data-driven decision-making tools to optimize margins and accurately forecast demand. Our objective is to generate actionable insights from 13 months of POS data to directly increase bottom-line revenue.</p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-amber-900 mb-3 border-l-4 border-amber-500 pl-3">KEY FINDINGS</h3>
                    <ol className="list-decimal pl-5 space-y-4">
                        <li>
                            <strong>Branch Segmentation:</strong> Your 25 branches group into distinct operational profiles based on revenue vs. profit margin variance. This reveals that uniform menu pricing leaves money on the table in premium or highly seasonal locations.
                        </li>
                        <li>
                            <strong>Menu Engineering (Plowhorses):</strong> {data.menu_engineering?.global_matrix?.summary?.plowhorses || 'Several'} high-volume items across the Food & Beverage categories have below-median margins. A 3-5% price increase on these specific items would significantly lift aggregate profit with minimal volume bleed.
                        </li>
                        <li>
                            <strong>Menu Complexity (Dogs):</strong> {data.menu_engineering?.global_matrix?.summary?.dogs || 'Numerous'} specific Food & Beverage items are both low volume and low margin. These items slow down barista efficiency and increase COGS waste.
                        </li>
                        <li>
                            <strong>Demand Forecasting:</strong> Future sales trajectories over the next 6 months are strongly influenced by weather patterns and calendar holidays.
                        </li>
                    </ol>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-amber-900 mb-3 border-l-4 border-amber-500 pl-3">RECOMMENDATIONS</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Launch <strong>cluster-specific pricing strategies</strong> to protect margins where elasticity is low.</li>
                        <li>Implement a <strong>3-5% price increase</strong> exclusively on Plowhorse classifications.</li>
                        <li>Institute a <strong>phased retirement</strong> of Dog classification items to streamline the menu.</li>
                        <li>Utilize the connected dashboard's <strong>Forecasting module</strong> to optimize inventory purchasing around weather fluctuations.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-amber-900 mb-3 border-l-4 border-amber-500 pl-3">METHODOLOGY</h3>
                    <p className="text-sm text-gray-600">
                        Powered by Python FastAPI backend and React frontend.
                        Models deployed: K-Means Clustering (Branch profiling), BCG Menu Matrix (Profit/Popularity classification),
                        and XGBoost/LightGBM Time-Series Forecasting enriched with Open-Meteo API and Lebanese logic.
                    </p>
                </section>

            </div>
        </div>
    );
}
