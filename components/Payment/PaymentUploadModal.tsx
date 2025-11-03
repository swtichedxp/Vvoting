// components/Payment/PaymentUploadModal.tsx

import React, { useState, useCallback } from 'react';

interface PaymentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (file: File) => void;
  pollTitle: string;
}

const PaymentUploadModal: React.FC<PaymentUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onUploadComplete, 
  pollTitle 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // --- Handlers for Drag & Drop ---

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // --- Handlers for Submission ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onUploadComplete(file);
      // Reset state for next use
      setFile(null); 
    } else {
      alert("Please select a screenshot to continue.");
    }
  };

  if (!isOpen) return null;

  return (
    // Overlay backdrop
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Payment Proof</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <p className="text-sm text-gray-400 mb-4">
            To validate your vote for **{pollTitle}**, please upload your payment screenshot.
          </p>

          {/* Payment Info Box */}
          <div className="bg-gray-800 p-4 rounded-lg mb-4">
            <p className="text-sm font-semibold text-white mb-1">Payment Details (Example):</p>
            <p className="text-xs text-green-400">NAOTEMS Vote Fee: NGN 100.00</p>
            <p className="text-xs text-gray-300">Account: 1234567890 (NAOTEMS Treasury)</p>
          </div>

          {/* Drag & Drop Area */}
          <form onSubmit={handleSubmit}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg 
                cursor-pointer transition-colors duration-300
                ${isDragOver ? 'border-pink-500 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}
              `}
            >
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
              />
              
              {file ? (
                // File Selected View
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h7a2 2 0 012 2v2a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm6 4a1 1 0 100 2h3a1 1 0 100-2H8z" clipRule="evenodd" /></svg>
                  <p className="mt-2 text-sm text-white font-medium">{file.name}</p>
                  <button 
                    type="button" 
                    onClick={() => setFile(null)} 
                    className="text-xs text-pink-400 hover:text-pink-300 mt-1"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                // Initial Upload Prompt
                <label htmlFor="file-upload" className="flex flex-col items-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <p className="mt-2 text-sm text-gray-300">
                    <span className="font-semibold text-pink-400 hover:text-pink-300">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, or PDF (Max 5MB)</p>
                </label>
              )}
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file}
              className={`w-full py-3 mt-4 rounded-lg font-bold text-white transition duration-200
                ${file 
                  ? 'bg-pink-600 hover:bg-pink-500' 
                  : 'bg-gray-600 cursor-not-allowed'
                }
              `}
            >
              Submit Payment Proof & Cast Vote
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentUploadModal;
