import { useState, useMemo, useEffect } from 'react';
import Login from './components/Login';
import StaffGrid from './components/StaffGrid';
import StaffAnalysisPane from './components/StaffAnalysisPane';
import MemberExecutiveView from './components/MemberExecutiveView';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';

function App() {
  const [role, setRole] = useState(null); // 'LA_ADMIN' or 'MEMBER_EXEC'
  const [requests, setRequests] = useState([]);
  const [votes, setVotes] = useState({}); // { id: 'yes'|'no'|'hold' }
  const [voteHistory, setVoteHistory] = useState([]); // Array of request IDs in order of vote
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (role) {
      setLoading(true);
      fetch('/api/requests')
        .then(res => res.json())
        .then(data => {
          setRequests(data);
          if (data.length > 0) setSelectedRequest(data[0]);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch requests", err);
          setLoading(false);
        });
    }
  }, [role]);

  // Filtering 
  const [filterDomain] = useState('All');

  // Voting & Selection

  // Derived metrics
  const filteredRequests = useMemo(() => {
    return requests.filter(req => filterDomain === 'All' || req.domain === filterDomain);
  }, [requests, filterDomain]);

  const totalAmount = filteredRequests.reduce((sum, req) => sum + req.requestAmount, 0);
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(totalAmount);

  // For the exact text of "$1.85 BILLION" from the mockup
  let displayFunding = formattedTotal.replace('B', ' BILLION').replace('M', ' MILLION');

  const votedCount = Object.keys(votes).length;
  const pendingCount = requests.length - votedCount;
  const progressPercent = requests.length > 0 ? Math.round((votedCount / requests.length) * 100) : 0;

  const handleVote = (e, id, decision) => {
    if (e) e.stopPropagation();

    // Optimistic local update
    setVotes(prev => {
      const isReverting = prev[id] === decision;
      const finalDecision = isReverting ? null : decision;

      if (finalDecision !== null && prev[id] !== finalDecision) {
        setVoteHistory(vh => [...vh.filter(vId => vId !== id), id]);
      }

      return {
        ...prev,
        [id]: finalDecision
      };
    });

    // Sync to backend
    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, vote: decision === null ? 'pending' : decision })
    }).catch(err => console.error("Vote failed:", err));
  };

  const handleUndoVote = () => {
    if (voteHistory.length === 0) return;

    setVoteHistory(prev => {
      const newHistory = [...prev];
      const lastVotedId = newHistory.pop();

      setVotes(v => {
        const newVotes = { ...v };
        delete newVotes[lastVotedId];
        return newVotes;
      });

      fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lastVotedId, vote: 'pending' })
      }).catch(err => console.error("Undo vote failed:", err));

      return newHistory;
    });
  };

  const handleDeleteRequest = async (id) => {
    // Execute delete immediately without blocking confirm
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete from server");

      setRequests(prev => prev.filter(req => req.id !== id));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Failed to delete request.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    // Execute bulk delete instantly

    try {
      const res = await fetch(`/api/requests/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (!res.ok) throw new Error("Failed to delete from server");

      setRequests(prev => prev.filter(req => !selectedIds.includes(req.id)));
      if (selectedRequest && selectedIds.includes(selectedRequest.id)) {
        setSelectedRequest(null);
      }
      setSelectedIds([]); // Clear selection
    } catch (err) {
      console.error("Error bulk deleting requests:", err);
      alert("Failed to delete requests.");
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (isSelectAll, currentFilteredRequests) => {
    if (isSelectAll) {
      setSelectedIds(currentFilteredRequests.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  if (!role) {
    return <Login setRole={setRole} />;
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading Secure Data...</div>;
  }

  return (
    <div className="app-wrapper">

      {/* ---------- HEADER ---------- */}
      <header className="top-header">
        <img className="seal-img" src="/house_seal.png" alt="House Seal (Dark Mode)" />
        <div className="header-text-container">
          <h1 className="header-title">REP. MILLS - FL 7</h1>
          <h2 className="header-sub">
            FY27 NDAA LEGISLATIVE REVIEW PORTAL - {role === 'LA_ADMIN' ? 'STAFF / LA VIEW' : 'EXECUTIVE VIEW'}
          </h2>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowExportModal(true)}
            style={{ background: 'var(--btn-green)', border: '1px solid var(--btn-green-border)', color: 'black', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-header)', letterSpacing: '0.05em', fontWeight: 'bold' }}
          >
            DATA EXPORTS
          </button>
          <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>⚙️</span>
          <span style={{ color: 'var(--text-muted)' }}>🛡️</span>
          <button
            onClick={() => setRole(null)}
            style={{ background: 'transparent', border: '1px solid var(--border-bright)', color: 'var(--text-muted)', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-header)', letterSpacing: '0.05em' }}
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* ---------- MAIN ROUTING ---------- */}
      {role === 'MEMBER_EXEC' ? (
        <MemberExecutiveView
          requests={requests}
          votes={votes}
          handleVote={handleVote}
          handleUndoVote={handleUndoVote}
          hasUndo={voteHistory.length > 0}
        />
      ) : (
        <div className="dashboard-grid">
          {/* -- LEFT COL: FILTERS -- */}
          <div className="glass-panel">
            <div className="panel-title">Filters & Navigation</div>
            <div className="filters-panel">

              {/* Service Filter Group */}
              <div className="filter-section">
                <div className="filter-section-title">
                  <span>SERVICE</span>
                  <div className="filter-switch"></div>
                </div>
                <div className="filter-list">
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> Army</label>
                    <span className="count-badge">268</span>
                  </div>
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> Navy</label>
                    <span className="count-badge">17</span>
                  </div>
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> Air Force</label>
                    <span className="count-badge">26</span>
                  </div>
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> Space Force</label>
                    <span className="count-badge">5</span>
                  </div>
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> Marine Corps</label>
                    <span className="count-badge">10</span>
                  </div>
                </div>
              </div>

              {/* Request Type Group */}
              <div className="filter-section">
                <div className="filter-section-title">
                  <span>REQUEST TYPE</span>
                  <div className="filter-switch"></div>
                </div>
                <div className="filter-list">
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> Programmatic</label>
                    <span className="count-badge">10</span>
                  </div>
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> Language</label>
                    <span className="count-badge">10</span>
                  </div>
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> Community Project</label>
                    <span className="count-badge">1</span>
                  </div>
                </div>
              </div>

              {/* FL Impact Group */}
              <div className="filter-section">
                <div className="filter-section-title">
                  <span>FLORIDA DISTRICT IMPACT</span>
                  <span style={{ fontSize: '0.6rem' }}>▲</span>
                </div>
                <div className="filter-list">
                  <div className="checkbox-row checked">
                    <label><input type="checkbox" defaultChecked /> District 07</label>
                    <span className="count-badge">87</span>
                  </div>
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> Other FL</label>
                    <span className="count-badge">1</span>
                  </div>
                  <div className="checkbox-row">
                    <label><input type="checkbox" /> None</label>
                    <span className="count-badge">0</span>
                  </div>
                </div>
              </div>

              <input
                type="text"
                placeholder="🔍 SEARCH REQUESTS"
                style={{
                  width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.5)',
                  border: '1px solid #3b4b5a', color: 'white', marginTop: '1rem',
                  borderRadius: '4px'
                }}
              />
              <button
                style={{
                  width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.1)',
                  border: '1px solid #3b4b5a', color: 'white', marginTop: '0.5rem',
                  borderRadius: '4px', cursor: 'pointer'
                }}
              >
                RESET FILTERS
              </button>

            </div>
          </div>


          {/* -- MIDDLE COL: CARDS -- */}
          <div className="middle-col">

            <div className="exec-dash-row">
              {/* Total Requests Metric */}
              <div className="metric-card">
                <div className="metric-label">Total Requests</div>
                <div className="metric-big-val">{requests.length}</div>
                <div className="metric-sub-val">Active Entries</div>
              </div>
              {/* Funding Metric */}
              <div className="metric-card funds">
                <div className="metric-label">Funding Requested</div>
                <div className="metric-big-val">{displayFunding}</div>
                <div className="metric-sub-val">Total Estimated</div>
              </div>
            </div>

            {/* Conditional Middle View Based on Role */}
            {role === 'LA_ADMIN' ? (
              <StaffGrid
                requests={filteredRequests}
                selectedRequest={selectedRequest}
                setSelectedRequest={setSelectedRequest}
                onOpenImportModal={() => setShowImportModal(true)}
                selectedIds={selectedIds}
                toggleSelection={toggleSelection}
                toggleSelectAll={toggleSelectAll}
                handleBulkDelete={handleBulkDelete}
              />
            ) : (
              <div className="glass-panel" style={{ flex: 1 }}>
                <div className="panel-title">REQUEST CARDS</div>

                <div className="cards-container" style={{ padding: '1rem', paddingRight: '0.5rem' }}>
                  {filteredRequests.map(req => {
                    const currentVote = votes[req.id];
                    const isFlorida = req.districtImpact && (req.districtImpact.includes('FL') || req.districtImpact.includes('Florida') || req.districtImpact.includes('Tampa') || req.districtImpact.includes('Orlando') || req.districtImpact.includes('Miami'));

                    return (
                      <div key={req.id} className="mockup-req-card" onClick={() => setSelectedRequest(req)}>
                        <div className="m-card-header">
                          <div className="m-dots">
                            <div className="m-dot"></div><div className="m-dot"></div>
                          </div>
                          <div className="m-date">SUBMITTED: OCT 15, 2026</div>
                        </div>

                        <div className="m-card-body">
                          {/* Left side text */}
                          <div>
                            <div className="m-org-lbl">ORGANIZATION:</div>
                            <div className="m-org-val">{req.companyName}</div>
                            <div className="m-title-lbl">PROPOSAL TITLE:</div>
                            <div className="m-title-val">{req.briefSummary ? req.briefSummary.substring(0, 50) + '...' : req.programElement}</div>
                          </div>

                          {/* Right side data */}
                          <div style={{ borderLeft: '1px solid #3b4b5a', paddingLeft: '1rem' }}>
                            <div className="m-amt-lbl">REQUESTED AMOUNT:</div>
                            <div className="m-amt-val">{req.formattedAmount} ↓</div>
                            <div className="m-impact-lbl">FLORIDA-BASED (Y/N):</div>
                            <div className="m-impact-val">
                              {isFlorida ? (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <img src="/fl_outline.png" alt="FL Outline" style={{ width: '42px', height: '42px', marginRight: '2px', objectFit: 'contain', mixBlendMode: 'lighten', filter: 'contrast(1.5) brightness(0.8)' }} />
                                  <span style={{ color: 'var(--btn-green-border)', fontWeight: '800', fontSize: '1rem', letterSpacing: '0.05em' }}>YES</span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>NO</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Buttons Row */}
                        <div className="m-card-footer">
                          <div
                            className={`m-btn m-btn-yes ${currentVote === 'yes' ? '' : 'm-btn-inactive'}`}
                            onClick={(e) => handleVote(e, req.id, 'yes')}
                          >
                            ✓ YES
                          </div>
                          <div
                            className={`m-btn m-btn-hold ${currentVote === 'hold' ? '' : 'm-btn-inactive'}`}
                            onClick={(e) => handleVote(e, req.id, 'hold')}
                          >
                            🕒 HOLD
                          </div>
                          <div
                            className={`m-btn m-btn-no ${currentVote === 'no' ? '' : 'm-btn-inactive'}`}
                            onClick={(e) => handleVote(e, req.id, 'no')}
                          >
                            ✕ NO
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>


          {/* -- RIGHT COL: VIEWER -- */}
          <div className="right-col">
            <StaffAnalysisPane
              selectedRequest={selectedRequest}
              handleDeleteRequest={handleDeleteRequest}
            />
          </div>
        </div>
      )}

      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={(newRequestData) => {
            // Refresh the list
            fetch('/api/requests')
              .then(res => res.json())
              .then(data => {
                setRequests(data);
                // Optionally set the newly imported request as selected
                const newlyAdded = data.find(r => r.id === newRequestData.id);
                if (newlyAdded) setSelectedRequest(newlyAdded);
              });
          }}
        />
      )}
    </div>
  );
}

export default App;
