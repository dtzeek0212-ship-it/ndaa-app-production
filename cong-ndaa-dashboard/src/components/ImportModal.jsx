import React, { useState, useRef } from 'react';

export default function ImportModal({ onClose, onImportSuccess }) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndAddFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndAddFiles(Array.from(e.target.files));
        }
    };

    const validateAndAddFiles = (selectedFiles) => {
        setError(null);
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const valid = selectedFiles.filter(f => validTypes.includes(f.type));

        if (valid.length !== selectedFiles.length) {
            setError("Some files were skipped. Invalid format. Only PDF and DOCX files are supported.");
        }

        setFiles(prev => [...prev, ...valid]);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        files.forEach(f => formData.append('documents', f));

        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error("Failed to upload documents.");
            }

            if (data.results && data.results.length > 0) {
                onImportSuccess(data.results[0]);
            } else {
                throw new Error(data.errors?.[0]?.error || 'Failed to extract any files.');
            }
            onClose();
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '600px', background: 'var(--panel-bg)', border: '1px solid #3b4b5a', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #3b4b5a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>⚠️</span> SCAN & IMPORT DOCUMENT
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.5rem' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Upload a vendor's PDF or Word (.docx) request form. The system will automatically OCR the document, extract the technical specifications, infer the requested funding amount, and generate a new record.
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                        style={{
                            border: `2px dashed ${isDragging ? '#3b82f6' : '#3b4b5a'}`,
                            background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem'
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".pdf,.docx"
                            multiple
                            onChange={handleFileSelect}
                        />

                        {files.length > 0 ? (
                            <>
                                <div style={{ fontSize: '3rem' }}>📄</div>
                                <div style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{files.length} File(s) Selected</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxHeight: '60px', overflowY: 'auto' }}>
                                    {files.map((f, i) => <div key={i}>{f.name}</div>)}
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>📥</div>
                                <div style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Click to Browse or Drag & Drop Multiple</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Supports bulk .PDF and .DOCX uploads</div>
                            </>
                        )}
                    </div>

                    {error && (
                        <div style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '4px', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    {/* Action Footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={onClose}
                            style={{ padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            CANCEL
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={files.length === 0 || uploading}
                            style={{
                                padding: '0.6rem 1.5rem',
                                background: uploading ? '#3b4b5a' : 'var(--btn-yellow)',
                                border: '1px solid var(--btn-yellow-border)',
                                color: 'black',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                cursor: (files.length === 0 || uploading) ? 'not-allowed' : 'pointer',
                                opacity: (files.length === 0 || uploading) ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {uploading ? 'SCANNING...' : 'EXTRACT DATA'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
