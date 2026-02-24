import React, { useState, useEffect } from 'react';

export default function StaffAnalysisPane({ selectedRequest, handleDeleteRequest }) {
    const [activeTab, setActiveTab] = useState('CHECKLIST');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [redlineText, setRedlineText] = useState('');
    const [viewDoc, setViewDoc] = useState(null);

    useEffect(() => {
        if (selectedRequest) {
            setRedlineText(selectedRequest.budgetLanguage || 'No raw language provided. Draft Legislative Counsel text here...');
            fetch(`/api/comments/${selectedRequest.id}`)
                .then(res => res.json())
                .then(data => setComments(data))
                .catch(err => console.error(err));
        }
    }, [selectedRequest]);

    const handleAddComment = () => {
        if (!newComment.trim() || !selectedRequest) return;

        fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestId: selectedRequest.id,
                author: 'Lead LA (Staff)',
                text: newComment
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setComments([{ id: data.id, author: 'Lead LA (Staff)', text: newComment, timestamp: new Date().toISOString() }, ...comments]);
                    setNewComment('');
                }
            });
    };

    if (!selectedRequest) {
        return (
            <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--text-muted)' }}>Select a request from the grid to begin analysis.</div>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="panel-title">VETTING & REDLINE ANALYSIS</div>

            <div style={{ display: 'flex', borderBottom: '1px solid #3b4b5a', marginBottom: '1rem' }}>
                <div
                    onClick={() => setActiveTab('CHECKLIST')}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeTab === 'CHECKLIST' ? '2px solid var(--btn-yellow-border)' : 'none', color: activeTab === 'CHECKLIST' ? 'white' : 'var(--text-muted)' }}
                >
                    CHECKLIST
                </div>
                <div
                    onClick={() => setActiveTab('REDLINE')}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeTab === 'REDLINE' ? '2px solid var(--btn-yellow-border)' : 'none', color: activeTab === 'REDLINE' ? 'white' : 'var(--text-muted)' }}
                >
                    REDLINE
                </div>
                <div
                    onClick={() => setActiveTab('CHAT')}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeTab === 'CHAT' ? '2px solid var(--btn-yellow-border)' : 'none', color: activeTab === 'CHAT' ? 'white' : 'var(--text-muted)' }}
                >
                    STAFF CHAT
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem 1rem' }}>
                {activeTab === 'CHECKLIST' && (
                    <div>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.8rem' }}>FIELD VALIDATION & OFFSET CHECKS</h4>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                            <input type="checkbox" checked={selectedRequest.hasValidOffset} readOnly />
                            <span><strong>Offset Validated:</strong> Requires {selectedRequest.formattedAmount} cut from O&M.</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                            <input type="checkbox" checked={selectedRequest.domain !== 'VA' && selectedRequest.domain !== 'Intel'} readOnly />
                            <span><strong>HASC Jurisdiction Confirmed:</strong> Belongs in Armed Services.</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                            <input type="checkbox" checked={redlineText.length < 5000} readOnly />
                            <span><strong>Language Constraints:</strong> Legal text is under 5,000 characters.</span>
                        </label>

                        <div style={{ marginTop: '2rem' }}>
                            <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem' }}>DISTRICT MULTIPLIER MAP</h4>
                            <div style={{ border: '1px solid #3b4b5a', padding: '1rem', borderRadius: '4px', background: 'rgba(0,0,0,0.5)' }}>
                                {selectedRequest.districtImpact.includes('FL') ? (
                                    <div style={{ color: 'var(--btn-green-border)' }}>✓ Active Supply Chain in FL-07 region detected.</div>
                                ) : (
                                    <div style={{ color: 'var(--btn-yellow-border)' }}>⚠️ No secondary suppliers found in FL-07. General Florida impact only.</div>
                                )}
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{selectedRequest.districtImpact}</div>
                            </div>
                        </div>

                        <div className="massive-blue-btn-wrapper" style={{ marginTop: '2rem' }}>
                            <div className="massive-blue-btn"
                                onClick={() => {
                                    if (selectedRequest.documentUrl) setViewDoc(selectedRequest.documentUrl);
                                    else alert("No original document attached to this request.");
                                }}
                            >
                                <div className="mb-text-main">ACCESS ORIGINAL DOCUMENT <span style={{ fontSize: '1.5rem' }}>⬇️</span></div>
                            </div>
                        </div>

                        {handleDeleteRequest && (
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={() => handleDeleteRequest(selectedRequest.id)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid #ef4444',
                                        color: '#fca5a5',
                                        padding: '0.6rem 2rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                >
                                    <span>🗑️</span> PERMANENTLY DELETE RECORD
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'REDLINE' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem' }}>LEGISLATIVE COUNSEL EDITOR</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--btn-yellow-border)', marginBottom: '1rem' }}>
                            * Scrub vendor branding and raw text into acceptable committee format.
                        </div>
                        <textarea
                            value={redlineText}
                            onChange={(e) => setRedlineText(e.target.value)}
                            style={{
                                flex: 1, width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid #3b4b5a',
                                color: 'white', fontFamily: 'monospace', padding: '1rem', resize: 'none', borderRadius: '4px'
                            }}
                        />
                        <button style={{
                            marginTop: '1rem', background: 'var(--btn-green)', border: '1px solid var(--btn-green-border)',
                            color: 'black', padding: '0.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                        }}>
                            SAVE REDLINE EDITS
                        </button>
                    </div>
                )}

                {activeTab === 'CHAT' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.8rem' }}>INTERNAL OPTICS & STRATEGY</h4>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                            {comments.map((c, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '4px', borderLeft: '3px solid var(--text-blue)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{c.author}</span>
                                        <span>{new Date(c.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem' }}>{c.text}</div>
                                </div>
                            ))}
                            {comments.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No internal discussion yet.</div>}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                placeholder="Type strategy notes here..."
                                style={{ flex: 1, padding: '0.8rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #3b4b5a', color: 'white', borderRadius: '4px' }}
                            />
                            <button
                                onClick={handleAddComment}
                                style={{ background: 'var(--text-blue)', border: 'none', color: 'white', padding: '0 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                POST
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DOCUMENT VIEWER MODAL */}
            {viewDoc && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ width: '100%', maxWidth: '1000px', background: 'var(--panel-bg)', border: '1px solid #3b4b5a', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '90vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid #3b4b5a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                            <div style={{ fontFamily: 'var(--font-header)', fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '0.05em' }}>DOCUMENT VIEWER</div>
                            <button
                                onClick={() => setViewDoc(null)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.5rem' }}
                                onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'}
                                onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{ flex: 1, padding: '1rem' }}>
                            <iframe
                                src={`/api/document?path=${encodeURIComponent(viewDoc)}`}
                                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white', borderRadius: '4px' }}
                                title="Document Viewer"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
