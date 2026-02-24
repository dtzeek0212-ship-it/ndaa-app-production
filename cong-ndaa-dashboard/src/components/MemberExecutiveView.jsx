import React, { useMemo, useState } from 'react';

export default function MemberExecutiveView({ requests, votes, handleVote, handleUndoVote, hasUndo }) {
    const [viewDoc, setViewDoc] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Pending queue for Member to review
    const pendingRequests = useMemo(() => {
        return requests.filter(req => !votes[req.id]);
    }, [requests, votes]);

    // Ensure index stays within bounds if the pending queue shrinks
    const safeIndex = Math.min(currentIndex, Math.max(0, pendingRequests.length - 1));
    const currentRequest = pendingRequests[safeIndex] || null;

    const handleNext = () => {
        if (safeIndex < pendingRequests.length - 1) setCurrentIndex(safeIndex + 1);
    };

    const handlePrev = () => {
        if (safeIndex > 0) setCurrentIndex(safeIndex - 1);
    };

    // Calculate Strategic Metrics
    const approvedRequests = requests.filter(req => votes[req.id] === 'yes');

    // Total Florida-Direct Funding (approved requests with FL impact)
    const flFunding = approvedRequests.reduce((sum, req) => {
        return (req.districtImpact && req.districtImpact.includes('FL')) ? sum + req.requestAmount : sum;
    }, 0);

    const formattedFlFunding = new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2
    }).format(flFunding).replace('B', ' BILLION').replace('M', ' MILLION');

    const pendingRecommendedCount = pendingRequests.filter(req => req.isStaffRecommended).length;
    const vetoRiskCount = pendingRequests.filter(req => !req.hasValidOffset).length;

    // Calculate dynamic portfolio balance based on Warfighter Services for Approved Requests
    const serviceMentions = useMemo(() => {
        const counts = {
            'Army': { count: 0, color: '#86efac' },
            'Navy': { count: 0, color: '#bfdbfe' },
            'Marines': { count: 0, color: '#fca5a5' },
            'Air Force': { count: 0, color: '#93c5fd' },
            'Space Force': { count: 0, color: '#d8b4fe' },
            'Joint': { count: 0, color: '#a78bfa' }
        };
        let total = 0;

        approvedRequests.forEach(req => {
            if (req.warfighterService) {
                if (req.warfighterService.includes('Army')) { counts['Army'].count++; total++; }
                if (req.warfighterService.includes('Navy')) { counts['Navy'].count++; total++; }
                if (req.warfighterService.includes('Marines')) { counts['Marines'].count++; total++; }
                if (req.warfighterService.includes('Air Force')) { counts['Air Force'].count++; total++; }
                if (req.warfighterService.includes('Space Force')) { counts['Space Force'].count++; total++; }
                if (req.warfighterService.includes('Unknown') || req.warfighterService === 'Joint') { counts['Joint'].count++; total++; }
            } else {
                counts['Joint'].count++; total++;
            }
        });

        // Convert to array of objects with percentages, sorted by percentage descending
        return Object.keys(counts)
            .map(key => ({
                label: key,
                color: counts[key].color,
                percent: total === 0 ? 0 : Math.round((counts[key].count / total) * 100)
            }))
            .filter(item => item.percent > 0) // Only show ones that have some share
            .sort((a, b) => b.percent - a.percent);
    }, [approvedRequests]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem', padding: '1rem' }}>

            {/* STRATEGIC ALIGNMENT SUMMARY */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(0, 0, 0, 0.4)', border: '2px solid #3b4b5a', borderBottom: '4px solid var(--text-blue)', gap: '2rem' }}>
                <div style={{ flex: 1, borderRight: '1px solid #3b4b5a', paddingRight: '2rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: 'bold' }}>FLORIDA-DIRECT FUNDING (APPROVED)</div>
                    <div style={{ fontSize: '3rem', fontFamily: 'var(--font-header)', letterSpacing: '0.05em', color: 'var(--btn-green-border)', textShadow: '0 0 10px rgba(34, 197, 94, 0.2)' }}>
                        {formattedFlFunding === '$0' ? '$0' : formattedFlFunding}
                    </div>
                </div>
                <div style={{ flex: 1, borderRight: '1px solid #3b4b5a', paddingRight: '2rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: 'bold' }}>STAFF RECOMMENDED (PENDING)</div>
                    <div style={{ fontSize: '3rem', fontFamily: 'var(--font-header)', letterSpacing: '0.05em', color: 'var(--btn-yellow-border)', textShadow: '0 0 10px rgba(250, 204, 21, 0.2)' }}>
                        {pendingRecommendedCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>REQUESTS</span>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: 'bold' }}>OFFSET VETO RISK (PENDING)</div>
                    <div style={{ fontSize: '3rem', fontFamily: 'var(--font-header)', letterSpacing: '0.05em', color: 'var(--btn-red-border)', textShadow: '0 0 10px rgba(239, 68, 68, 0.2)' }}>
                        {vetoRiskCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>WARNINGS</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>

                {/* TINDER-STYLE QUEUE */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="panel-title" style={{ fontSize: '1.2rem', color: 'var(--btn-yellow-border)', margin: 0 }}>
                            "MEMBER'S CHOICE" QUEUE ({pendingRequests.length} PENDING)
                        </div>
                        {/* NAVIGATION CONTROLS */}
                        {pendingRequests.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={handlePrev}
                                    disabled={safeIndex === 0}
                                    style={{ background: 'transparent', border: '1px solid #3b4b5a', color: safeIndex === 0 ? 'rgba(255,255,255,0.2)' : 'var(--text-main)', padding: '0.4rem 1rem', borderRadius: '4px', cursor: safeIndex === 0 ? 'not-allowed' : 'pointer' }}
                                >
                                    ◀ PREVIOUS
                                </button>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', minWidth: '60px', textAlign: 'center' }}>
                                    {safeIndex + 1} OF {pendingRequests.length}
                                </div>
                                <button
                                    onClick={handleNext}
                                    disabled={safeIndex >= pendingRequests.length - 1}
                                    style={{ background: 'transparent', border: '1px solid #3b4b5a', color: safeIndex >= pendingRequests.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--text-main)', padding: '0.4rem 1rem', borderRadius: '4px', cursor: safeIndex >= pendingRequests.length - 1 ? 'not-allowed' : 'pointer' }}
                                >
                                    NEXT ▶
                                </button>
                            </div>
                        )}
                    </div>

                    {currentRequest ? (
                        <div className="mockup-req-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>

                            <div style={{ padding: '2rem', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>NATIONAL SECURITY BLUF</div>
                                        <div style={{ fontSize: '2rem', fontFamily: 'var(--font-header)', lineHeight: '1.1' }}>{currentRequest.companyName}</div>
                                        <div style={{ fontSize: '1.2rem', color: 'var(--btn-green-border)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {currentRequest.formattedAmount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>| {currentRequest.programElement}</span>
                                        </div>
                                    </div>
                                    {currentRequest.isStaffRecommended && (
                                        <div style={{ background: 'rgba(250, 204, 21, 0.2)', border: '1px solid var(--btn-yellow-border)', color: 'var(--btn-yellow-border)', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                            ★ STAFF RECOMMENDED
                                        </div>
                                    )}
                                </div>

                                {currentRequest.warfighterImpact && (
                                    <div style={{
                                        background: currentRequest.warfighterImpact.includes('Needs Clarification') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                        border: `1px solid ${currentRequest.warfighterImpact.includes('Needs Clarification') ? '#ef4444' : '#3b82f6'}`,
                                        borderRadius: '4px',
                                        padding: '1.5rem',
                                        marginBottom: '1rem',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: currentRequest.warfighterImpact.includes('Needs Clarification') ? '#ef4444' : '#3b82f6' }}></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: currentRequest.warfighterImpact.includes('Needs Clarification') ? '#f87171' : '#60a5fa', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                            {currentRequest.warfighterImpact.includes('Needs Clarification') ? '⚠️ STAFF FLAG: MISSING TACTICAL JUSTIFICATION' : '🎯 DIRECT WARFIGHTER IMPACT (BLUF)'}
                                        </div>
                                        <div style={{ fontSize: '1.15rem', lineHeight: '1.5', color: 'white', fontWeight: '500' }}>
                                            {currentRequest.warfighterImpact}
                                        </div>
                                    </div>
                                )}

                                {currentRequest.justification && (
                                    <div style={{ fontSize: '1.1rem', lineHeight: '1.6', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '4px', borderLeft: '4px solid #3b4b5a', marginBottom: '1rem' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>JUSTIFICATION</div>
                                        "{currentRequest.justification}"
                                    </div>
                                )}

                                {currentRequest.theAsk && (
                                    <div style={{ fontSize: '1.1rem', lineHeight: '1.6', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '4px', borderLeft: '4px solid #10b981', marginBottom: '2rem' }}>
                                        <div style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>THE ASK (SUMMARY)</div>
                                        {currentRequest.theAsk}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '2rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>LOCAL IMPACT SCORE</div>
                                        <div style={{ fontSize: '1.2rem' }}>
                                            {currentRequest.districtImpact.includes('FL') ? '🟢 HIGH (FL-07 Presence)' : '🟡 MODERATE (Statewide)'}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>OFFSET STATUS</div>
                                        <div style={{ fontSize: '1.2rem', color: currentRequest.hasValidOffset ? 'var(--btn-green-border)' : 'var(--btn-red-border)' }}>
                                            {currentRequest.hasValidOffset ? '✓ FULLY OFFSET' : '⚠️ MILLS VETO RISK: MISSING OFFSET'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {currentRequest.documentUrl && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    <button
                                        onClick={() => setViewDoc(currentRequest.documentUrl)}
                                        style={{ padding: '0.8rem 2rem', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', borderRadius: '4px', color: '#60a5fa', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', letterSpacing: '0.05em' }}
                                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'; e.currentTarget.style.color = '#93c5fd'; }}
                                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.color = '#60a5fa'; }}
                                    >
                                        🔍 QUICK VIEW DOCUMENT
                                    </button>
                                </div>
                            )}

                            {/* EXECUTIVE ACTION SUITE (YES/NO/HOLD) */}
                            <div style={{ display: 'flex', borderTop: '1px solid #3b4b5a', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={(e) => handleVote(e, currentRequest.id, 'no')}
                                    style={{ flex: 1, padding: '1.5rem', background: 'var(--btn-red)', border: '2px solid var(--btn-red-border)', borderRadius: '8px', color: 'white', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    ✕ REJECT
                                </button>
                                <button
                                    onClick={(e) => handleVote(e, currentRequest.id, 'hold')}
                                    style={{ flex: 1, padding: '1.5rem', background: 'var(--btn-yellow)', border: '2px solid var(--btn-yellow-border)', borderRadius: '8px', color: 'black', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    🕒 REQUIRE MORE INFO
                                </button>
                                <button
                                    onClick={(e) => handleVote(e, currentRequest.id, 'yes')}
                                    style={{ flex: 1, padding: '1.5rem', background: 'var(--btn-green)', border: '2px solid var(--btn-green-border)', borderRadius: '8px', color: 'black', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    ✓ AUTHORIZE SUBMISSION
                                </button>
                            </div>

                            {hasUndo && (
                                <div style={{ display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', paddingBottom: '1rem' }}>
                                    <button
                                        onClick={handleUndoVote}
                                        style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--text-muted)', borderRadius: '4px', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s', letterSpacing: '0.05em' }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        ⟲ UNDO PREVIOUS VOTE
                                    </button>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ fontSize: '4rem' }}>🎉</div>
                            <h2 style={{ fontFamily: 'var(--font-header)' }}>THE SLATE IS CLEAR</h2>
                            <div style={{ color: 'var(--text-muted)' }}>All requests have been evaluated for the day.</div>

                            {hasUndo && (
                                <button
                                    onClick={handleUndoVote}
                                    style={{ marginTop: '2rem', padding: '0.8rem 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--text-muted)', borderRadius: '4px', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s', letterSpacing: '0.05em' }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    ⟲ UNDO PREVIOUS VOTE
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* PORTFOLIO BALANCE VIEW (HEATMAP PLACEHOLDER) */}
                <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div className="glass-panel" style={{ flex: 1 }}>
                        <div className="panel-title">PORTFOLIO BALANCE</div>
                        <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                            <div style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>CURRENT APPROVED MIX (WARFIGHTER SERVICES)</div>

                            {serviceMentions.length > 0 ? serviceMentions.map((service) => (
                                <React.Fragment key={service.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>{service.label}</span>
                                        <span style={{ color: 'white' }}>{service.percent}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                                        <div style={{ width: `${service.percent}%`, height: '100%', background: service.color, transition: 'width 0.5s ease' }}></div>
                                    </div>
                                </React.Fragment>
                            )) : (
                                <div style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.3)', padding: '1rem 0' }}>No approvals yet to calculate portfolio balance.</div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ background: 'rgba(30, 58, 138, 0.2)', border: '1px solid var(--text-blue)' }}>
                        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
                            <h3 style={{ fontFamily: 'var(--font-header)', margin: '0 0 1rem 0' }}>HASC EXPORT ENGINE</h3>
                            <button style={{ width: '100%', background: 'var(--text-blue)', border: 'none', color: 'white', padding: '0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                                GENERATE SUBMISSION BATCH
                            </button>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Exports {Object.values(votes).filter(v => v === 'yes').length} approved requests to CSV.</div>
                        </div>
                    </div>

                </div>

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
