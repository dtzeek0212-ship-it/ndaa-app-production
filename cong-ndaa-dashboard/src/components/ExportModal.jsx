import React from 'react';

export default function ExportModal({ onClose }) {
    const handleExport = (type) => {
        window.location.href = `/api/export/${type}`;
        onClose();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '600px', background: 'var(--panel-bg)', border: '1px solid #3b4b5a', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #3b4b5a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '0.05em' }}>DATA OUTPUT & EXPORTS</div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.5rem' }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Generate final submission documents based on the **AUTHORIZED** queue. Pending and rejected requests will be excluded from these outputs.
                    </div>

                    <button
                        onClick={() => handleExport('pdf')}
                        style={{
                            padding: '1.5rem',
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid #3b82f6',
                            borderRadius: '4px',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            textAlign: 'left'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'; e.currentTarget.style.color = '#93c5fd'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.color = '#60a5fa'; }}
                    >
                        <div style={{ marginBottom: '0.5rem' }}>📄 GENERATE PDF BRIEFING BOOK</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                            Creates a formatted PDF document organized by domain, designed for printing and physical review by the Member or Committee staff.
                        </div>
                    </button>

                    <button
                        onClick={() => handleExport('csv')}
                        style={{
                            padding: '1.5rem',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid #10b981',
                            borderRadius: '4px',
                            color: '#34d399',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            textAlign: 'left'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'; e.currentTarget.style.color = '#6ee7b7'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.color = '#34d399'; }}
                    >
                        <div style={{ marginBottom: '0.5rem' }}>📊 EXPORT HASC SUBMISSION CSV</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                            Generates a strictly mapped Excel/CSV file formatted specifically for uploading directly into the House Armed Services Committee portal.
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
}
