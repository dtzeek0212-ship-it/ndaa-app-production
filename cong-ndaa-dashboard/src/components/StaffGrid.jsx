import React from 'react';

export default function StaffGrid({ requests, selectedRequest, setSelectedRequest, onOpenImportModal, selectedIds = [], toggleSelection, toggleSelectAll, handleBulkDelete }) {
    return (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>STAFF VIEW: HIGH-DENSITY VETTING GRID</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            style={{
                                background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5',
                                padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        >
                            🗑️ DELETE SELECTED ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={onOpenImportModal}
                        style={{
                            background: 'var(--btn-yellow)', border: '1px solid var(--btn-yellow-border)', color: 'black',
                            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                        }}>
                        ⚠️ SCAN & IMPORT DOCUMENT
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #3b4b5a', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.5rem', width: '30px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={requests.length > 0 && selectedIds.length === requests.length}
                                    onChange={(e) => toggleSelectAll && toggleSelectAll(e.target.checked, requests)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                            <th style={{ padding: '0.5rem' }}>FL (Y/N)</th>
                            <th style={{ padding: '0.5rem' }}>DRL</th>
                            <th style={{ padding: '0.5rem' }}>ORGANIZATION</th>
                            <th style={{ padding: '0.5rem' }}>PROPOSAL TITLE</th>
                            <th style={{ padding: '0.5rem' }}>FUNDING AMT</th>
                            <th style={{ padding: '0.5rem' }}>OFFSET / COMPLIANCE</th>
                            <th style={{ padding: '0.5rem' }}>JURISDICTION</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>PRIORITY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(req => {
                            const isSelected = selectedRequest && selectedRequest.id === req.id;
                            // Mock logic for Jurisdictional Flagging based on domain
                            const isHasc = req.domain !== 'VA' && req.domain !== 'Intel';

                            return (
                                <tr
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: isSelected ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background 0.1s'
                                    }}
                                    onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                                    onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                                >
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(req.id)}
                                            onChange={() => toggleSelection && toggleSelection(req.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                                        {req.districtImpact && (req.districtImpact.includes('FL') || req.districtImpact.includes('Florida') || req.districtImpact.includes('Tampa') || req.districtImpact.includes('Orlando') || req.districtImpact.includes('Miami')) ? (
                                            <span style={{ color: 'var(--btn-green-border)' }}>YES</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>NO</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        {req.isDrl ? <span style={{ color: 'var(--btn-yellow-border)' }}>Y</span> : null}
                                    </td>
                                    <td style={{ padding: '0.5rem', fontWeight: '600' }}>{req.companyName.substring(0, 20)}{req.companyName.length > 20 ? '...' : ''}</td>
                                    <td style={{ padding: '0.5rem' }}>{req.briefSummary ? req.briefSummary.substring(0, 30) + '...' : req.programElement.substring(0, 30)}</td>
                                    <td style={{ padding: '0.5rem', fontFamily: 'var(--font-header)', fontSize: '1rem' }}>{req.formattedAmount}</td>

                                    {/* OFFSET VALIDATOR COLUMN */}
                                    <td style={{ padding: '0.5rem' }}>
                                        {req.hasValidOffset ? (
                                            <span style={{ color: 'var(--btn-green-border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ fontSize: '1rem' }}>✓</span> VALID PE
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--btn-yellow-border)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(217, 119, 6, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(217, 119, 6, 0.5)' }}>
                                                <span style={{ fontSize: '1rem' }}>⚠️</span> MISSING OFFSET
                                            </span>
                                        )}
                                    </td>

                                    {/* JURISDICTIONAL FLAGGING COLUMN */}
                                    <td style={{ padding: '0.5rem' }}>
                                        {isHasc ? (
                                            <span style={{ color: 'var(--text-muted)' }}>HASC</span>
                                        ) : (
                                            <span style={{ color: 'var(--btn-red-border)', fontWeight: 'bold' }}>{req.domain.toUpperCase()} (OUT OF SCOPE)</span>
                                        )}
                                    </td>

                                    {/* STAFF RECOMMENDATION STAR */}
                                    <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '1.2rem' }}>
                                        {req.isStaffRecommended ? (
                                            <span style={{ color: '#facc15', textShadow: '0 0 5px rgba(250, 204, 21, 0.5)' }}>★</span>
                                        ) : (
                                            <span style={{ color: 'rgba(255,255,255,0.1)' }}>☆</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
