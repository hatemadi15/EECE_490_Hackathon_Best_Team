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

    const handleUpload = async () => {
        if (!files.file1 || !files.file2 || !files.file3 || !files.file4) {
            setError("Please upload all 4 required CSV files.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file1', files.file1);
            formData.append('file2', files.file2);
            formData.append('file3', files.file3);
            formData.append('file4', files.file4);

            const response = await axios.post('http://localhost:8000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            onComplete(response.data);
        } catch (err) {
            console.error(err);
            setError("Data processing failed. Check server logs or uploaded files.");
        } finally {
            setLoading(false);
        }
    };

    const DropzoneArea = ({ fileKey, label }) => {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop: (accepted) => onDrop(accepted, fileKey),
            accept: { 'text/csv': ['.csv'] },
            maxFiles: 1
        });

        const file = files[fileKey];

        return (
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-amber-400'}`}>
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

    return (
        <div className="bg-white rounded-xl shadow p-8 max-w-4xl mx-auto mt-10">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">Upload Historical Data</h2>
            <p className="text-gray-600 mb-8">Please upload the required Point of Sale data extracts to generate insights.</p>

            {error && (
                <div className="bg-rose-50 text-rose-700 p-4 rounded-lg flex items-center mb-6">
                    <AlertCircle className="w-5 h-5 mr-3" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <DropzoneArea fileKey="file1" label="File 1: Monthly Sales (SMRY 00134)" />
                <DropzoneArea fileKey="file2" label="File 2: Product Profitability (SMRY 00014)" />
                <DropzoneArea fileKey="file3" label="File 3: Sales by Groups (SMRY 00191)" />
                <DropzoneArea fileKey="file4" label="File 4: Category Summary (SMRY 00673)" />
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className={`px-8 py-3 rounded-lg text-white font-medium text-lg transition-colors ${loading ? 'bg-amber-300 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'}`}
                >
                    {loading ? 'Processing Data...' : 'Generate Dashboard'}
                </button>
            </div>
        </div>
    );
}
