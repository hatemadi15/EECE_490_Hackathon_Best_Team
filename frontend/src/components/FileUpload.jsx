import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function FileUpload({ onComplete }) {
    const [files, setFiles] = useState({
        file1: null,
        file2: null,
        file3: null,
        file4: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onDrop = useCallback((acceptedFiles, fileKey) => {
        setFiles(prev => ({ ...prev, [fileKey]: acceptedFiles[0] }));
    }, []);

    // --- Loading Sequence Logic ---
    const loadingSteps = [
        "Ingesting 14,000+ rows of POS Data...",
        "Normalizing Revenue and Parsing Menus...",
        "Running unsupervised K-Means Clustering on Branch Performance...",
        "Evaluating BCG Matrix Constraints for Menu Engineering...",
        "Forecasting Future Demand via External Variables...",
        "Compiling Executive Summary..."
    ];
    const [loadingStepIndex, setLoadingStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const handleUpload = async () => {
        if (!files.file1 || !files.file2 || !files.file3 || !files.file4) {
            setError("Please upload all 4 required CSV files.");
            return;
        }

        setLoading(true);
        setError(null);
        setLoadingStepIndex(0);
        setProgress(0);

        // Fake the progress sequence for demo purposes to build hype
        const totalDuration = 3500; // 3.5 seconds
        const stepTime = totalDuration / loadingSteps.length;

        let currentStep = 0;
        const progressInterval = setInterval(() => {
            currentStep += 1;
            if (currentStep < loadingSteps.length) {
                setLoadingStepIndex(currentStep);
                setProgress((currentStep / loadingSteps.length) * 100);
            }
        }, stepTime);

        try {
            const formData = new FormData();
            formData.append('file1', files.file1);
            formData.append('file2', files.file2);
            formData.append('file3', files.file3);
            formData.append('file4', files.file4);

            const response = await axios.post('http://localhost:8000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Make sure the sequence finishes visually before advancing
            setTimeout(() => {
                clearInterval(progressInterval);
                setProgress(100);
                setLoadingStepIndex(loadingSteps.length - 1);
                setTimeout(() => {
                    onComplete(response.data);
                    setLoading(false);
                }, 400); // Tiny pause at 100%
            }, totalDuration);

        } catch (err) {
            console.error(err);
            clearInterval(progressInterval);
            setLoading(false);
            setError("Data processing failed. Check server logs or uploaded files.");
        }
    };

    // Extracting to a pure component outside to prevent hook state wipe
    const DropzoneArea = ({ fileKey, label, file, onDrop }) => {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop: (accepted) => onDrop(accepted, fileKey),
            accept: { 'text/csv': ['.csv'] },
            maxFiles: 1
        });

        return (
            <div key={fileKey} {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'}`}>
                <input {...getInputProps()} />
                {file ? (
                    <div className="flex flex-col items-center text-emerald-600">
                        <CheckCircle className="w-8 h-8 mb-2" />
                        <p className="text-sm font-medium">{file.name}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-gray-500">
                        <UploadCloud className="w-8 h-8 mb-2" />
                        <p className="text-sm">{label}</p>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-pulse">
                    <div className="mb-6 flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-xl font-bold text-center text-gray-900 mb-2">AI Insight Engine</h3>
                    <p className="text-center text-emerald-600 font-medium h-6">{loadingSteps[loadingStepIndex]}</p>

                    <div className="mt-8 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl shadow-emerald-900/5 p-8 max-w-4xl mx-auto mt-10 border border-white">
            <h2 className="text-2xl font-bold text-emerald-900 mb-6">Upload Historical Data</h2>
            <p className="text-gray-600 mb-8">Please upload the required Point of Sale data extracts to generate insights.</p>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg flex items-center mb-6 shadow-sm">
                    <AlertCircle className="w-5 h-5 mr-3" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <DropzoneArea fileKey="file1" label="File 1: Monthly Sales (SMRY 00134)" file={files.file1} onDrop={onDrop} />
                <DropzoneArea fileKey="file2" label="File 2: Product Profitability (SMRY 00014)" file={files.file2} onDrop={onDrop} />
                <DropzoneArea fileKey="file3" label="File 3: Sales by Groups (SMRY 00191)" file={files.file3} onDrop={onDrop} />
                <DropzoneArea fileKey="file4" label="File 4: Category Summary (SMRY 00673)" file={files.file4} onDrop={onDrop} />
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className={`px-8 py-3 rounded-lg text-white font-medium text-lg transition-all duration-300 shadow-lg ${loading ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-600/30'}`}
                >
                    Generate Dashboard
                </button>
            </div>
        </div>
    );
}
