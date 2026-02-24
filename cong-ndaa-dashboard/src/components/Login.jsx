export default function Login({ setRole }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', width: '100vw', background: 'var(--bg-darkest)', color: 'var(--text-main)'
        }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                <img className="seal-img" src="/house_seal.png" alt="House Seal" style={{ width: '80px', height: '80px', marginBottom: '1rem' }} />

                <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '2rem', letterSpacing: '0.05em', margin: 0 }}>NDAA V3 PORTAL</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
                    Select Authentication Profile
                </div>

                <button
                    onClick={() => setRole('LA_ADMIN')}
                    style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-bright)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-header)', fontSize: '1.2rem', letterSpacing: '0.05em', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--text-blue)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--border-bright)'; }}
                >
                    LOG IN AS STAFF (LA)
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
