export default function Login({ setRole }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', width: '100vw', background: 'var(--bg-darkest)', color: 'var(--text-main)'
        }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <img className="seal-img" src="/house_seal.png" alt="House Seal" style={{ width: '80px', height: '80px' }} />

                    {/* American Flag Seal */}
                    <div className="seal-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', color: 'var(--text-blue)', background: 'linear-gradient(145deg, rgba(30,58,138,0.5), rgba(15,23,42,0.8))' }}>
                        <svg width="45" height="45" viewBox="0 0 24 24" fill="currentColor" style={{ filter: 'drop-shadow(0 0 5px rgba(96, 165, 250, 0.8))' }}>
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Airborne Parachute Seal */}
                    <div className="seal-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', color: 'var(--text-blue)', background: 'linear-gradient(145deg, rgba(30,58,138,0.5), rgba(15,23,42,0.8))' }}>
                        <svg width="45" height="45" viewBox="0 0 24 24" fill="currentColor" style={{ filter: 'drop-shadow(0 0 5px rgba(96, 165, 250, 0.8))' }}>
                            <path d="M12 2c-5.5 0-10 4.5-10 10h20c0-5.5-4.5-10-10-10z" opacity="0.8" />
                            <path d="M12 12l-3 10 M12 12l3 10 M12 12v10 M2 12l4 8 M22 12l-4 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Machine Gun Seal */}
                    <div className="seal-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', color: 'var(--text-blue)', background: 'linear-gradient(145deg, rgba(30,58,138,0.5), rgba(15,23,42,0.8))' }}>
                        <svg width="45" height="45" viewBox="0 0 24 24" fill="currentColor" style={{ filter: 'drop-shadow(0 0 5px rgba(96, 165, 250, 0.8))' }}>
                            <path d="M21 11h-4v-2h-3v-1h-2v1h-3C7.9 9 7 9.9 7 11v1H2v2h5v2h2v-4h3v2h2v-2h3v1h4v-3z" />
                            <rect x="9" y="16" width="3" height="5" rx="0.5" />
                            <path d="M12 16h2v3h-2z" fill="none" />
                            <circle cx="15.5" cy="12.5" r="0.5" fill="var(--bg-darkest)" />
                        </svg>
                    </div>
                </div>

                <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '2.4rem', letterSpacing: '0.05em', margin: 0, paddingBottom: '0.5rem', textAlign: 'center', lineHeight: 1 }}>FY 27 NDAA MATRIX</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
                    Select Authentication Profile
                </div>

                <button
                    onClick={() => setRole('LA_ADMIN')}
                    style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-bright)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-header)', fontSize: '1.2rem', letterSpacing: '0.05em', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--text-blue)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--border-bright)'; }}
                >
                    LOG IN AS STAFF (MLA/WAR FELLOW)
                </button>

                <button
                    onClick={() => setRole('MEMBER_EXEC')}
                    style={{ width: '100%', padding: '1rem', background: '#1e3a8a', border: '1px solid #60a5fa', color: 'white', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-header)', fontSize: '1.2rem', letterSpacing: '0.05em', boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.4)'; }}
                >
                    LOG IN AS REP. MILLS
                </button>
            </div>
        </div>
    );
}
