import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../../utils/api';

const UploadDiagnosis = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [reportId, setReportId] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setError('');
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/diagnose/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setSuccess(true);
        setReportId(res.data.data.report._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-10 font-body">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container rounded-xl p-8 border border-primary/30 shadow-[0_0_30px_rgba(0,219,231,0.1)] text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <div className="w-16 h-16 bg-primary-container/20 border border-primary/50 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-primary mb-2 text-glow">Uplink Successful</h2>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto text-sm">
            Your image has been securely uploaded and is currently being analyzed by our AI diagnostic network. This usually takes a few seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate(`/patient/diagnosis/${reportId}`)}
              className="w-full sm:w-auto px-6 py-3 bg-primary-container hover:bg-primary text-on-primary-container font-display text-sm font-semibold rounded-lg btn-glow transition-all"
            >
              View Report
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                clearSelection();
              }}
              className="w-full sm:w-auto px-6 py-3 bg-surface-container-high border border-outline-variant hover:border-outline text-on-surface font-display text-sm font-semibold rounded-lg transition-colors"
            >
              Upload Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-body">
      
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">New AI Diagnosis</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Upload a dental X-ray or intraoral photo for instant AI analysis.</p>
      </div>

      {error && (
        <div className="bg-error-container/20 text-error p-4 rounded-xl border border-error/50 flex items-start text-sm">
          <span className="material-symbols-outlined mr-2 flex-shrink-0">warning</span>
          {error}
        </div>
      )}

      <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6 md:p-8">
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-primary bg-primary/5 shadow-[inset_0_0_20px_rgba(0,219,231,0.1)]' 
                : 'border-outline-variant/50 bg-surface-container-lowest/50 hover:bg-surface-container-high hover:border-outline-variant'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-primary-container/20 text-primary' : 'bg-surface-container border border-outline-variant/50 text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
            </div>
            <h3 className="text-lg font-display font-semibold text-on-surface mb-1">Click or drag image to upload</h3>
            <p className="text-sm text-on-surface-variant text-center max-w-sm mb-4">
              Supports JPEG, PNG, or WebP. Max file size: 10MB. Clear, well-lit photos provide best results.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden bg-layer-0 aspect-[4/3] md:aspect-video flex items-center justify-center border border-outline-variant/50">
              <img 
                src={preview} 
                alt="Upload preview" 
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-scan pointer-events-none shadow-[0_0_10px_#00dbe7]"></div>
              
              <button
                onClick={clearSelection}
                disabled={isUploading}
                className="absolute top-4 right-4 bg-surface-container-highest/80 hover:bg-error/20 text-on-surface hover:text-error p-2 rounded-full backdrop-blur transition-colors border border-outline-variant/50 hover:border-error/50"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <div className="flex items-center space-x-3 overflow-hidden">
                <span className="material-symbols-outlined text-[32px] text-primary">image</span>
                <div className="min-w-0">
                  <p className="text-sm font-mono text-on-surface truncate">{file.name}</p>
                  <p className="text-xs font-mono text-on-surface-variant">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="ml-4 flex-shrink-0 px-6 py-2.5 bg-primary-container text-on-primary-container font-display font-semibold rounded-lg hover:bg-primary focus:ring-2 focus:ring-primary-container transition-all disabled:opacity-70 flex items-center btn-glow"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin mr-2"></div>
                    UPLOADING...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2 text-[18px]">memory</span>
                    ANALYZE IMAGE
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none"></div>
        <span className="material-symbols-outlined text-primary-fixed-dim mr-3 flex-shrink-0 mt-0.5 relative z-10">lightbulb</span>
        <div className="relative z-10">
          <h4 className="text-sm font-mono tracking-widest uppercase font-semibold text-primary">Optimization Parameters</h4>
          <ul className="mt-2 text-sm text-on-surface-variant list-disc list-inside space-y-1 font-body">
            <li>Ensure the image is well-lit and in focus.</li>
            <li>For photos, avoid heavy shadows inside the mouth.</li>
            <li>Standard bitewing or panoramic X-rays are fully supported.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadDiagnosis;
