import { useState } from 'react'

function App() {
    const [data, setData] = useState(null)

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-amber-900 text-white p-4">
                <h1>Stories Coffee — Analytics Dashboard</h1>
                <p className="text-amber-200">Data-Driven Decisions for Growth</p>
            </header>
            <main className="max-w-7xl mx-auto p-6">
                <h2 className="text-xl font-bold">Hackathon UI Ready</h2>
            </main>
        </div>
    )
}

export default App
