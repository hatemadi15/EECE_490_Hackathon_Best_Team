import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import BranchDashboard from './components/BranchDashboard';
import MenuMatrix from './components/MenuMatrix';
import ForecastView from './components/ForecastView';
import ExecutiveSummary from './components/ExecutiveSummary';
import { LayoutDashboard, PieChart, TrendingUp, Presentation, Coffee } from 'lucide-react';

function App() {
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('upload');

    const navItems = [
        { id: 'upload', label: 'Upload Data', icon: LayoutDashboard },
        { id: 'branches', label: 'Branch Performance', icon: PieChart, disabled: !data },
        { id: 'menu', label: 'Menu Engineering', icon: Coffee, disabled: !data },
        { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp, disabled: !data },
        { id: 'summary', label: 'Executive Summary', icon: Presentation, disabled: !data },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-amber-900 text-white p-4 shadow-md sticky top-0 z-50 flex items-center gap-3">
                <Coffee className="w-8 h-8 text-amber-200" />
                <div>
                    <h1 className="text-xl font-bold tracking-wide">STORIES COFFEE</h1>
                    <p className="text-xs text-amber-200 uppercase tracking-widest">Analytics Dashboard 2026</p>
                </div>
            </header>

            <nav className="bg-white border-b shadow-sm sticky top-[72px] z-40 overflow-x-auto">
                <ul className="flex max-w-7xl mx-auto px-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.id} className="min-w-fit">
                                <button
                                    onClick={() => !item.disabled && setActiveTab(item.id)}
                                    disabled={item.disabled}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === item.id
                                            ? 'border-amber-600 text-amber-800'
                                            : item.disabled
                                                ? 'border-transparent text-gray-300 cursor-not-allowed'
                                                : 'border-transparent text-gray-600 hover:text-amber-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20">
                {activeTab === 'upload' && (
                    <FileUpload onComplete={(res) => {
                        setData(res);
                        setActiveTab('branches');
                    }} />
                )}
                {activeTab === 'branches' && <BranchDashboard data={data} />}
                {activeTab === 'menu' && <MenuMatrix data={data?.menu_engineering} />}
                {activeTab === 'forecast' && <ForecastView data={data?.forecast} />}
                {activeTab === 'summary' && <ExecutiveSummary data={data} />}
            </main>
        </div>
    );
}

export default App;
