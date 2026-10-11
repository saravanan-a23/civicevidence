import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiBriefcase, FiFolderPlus, FiSearch, FiFileText, FiUser, 
  FiClock, FiTrendingUp, FiX, FiEye, FiUploadCloud, FiChevronRight, FiChevronDown
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const CaseManagementPage = () => {
  const { user, isAdmin, isOfficer } = useAuth();
  const [casesList, setCasesList] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Expand state (tracks ID of case expanded in details)
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [expandedCaseEvidence, setExpandedCaseEvidence] = useState([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [caseDesc, setCaseDesc] = useState('');
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cases', {
        params: {
          search,
          status: statusFilter,
        }
      });
      setCasesList(res.data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load cases directory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      if (isAdmin || isOfficer) {
        // Admin gets users endpoint, filter by role = officer
        const res = await api.get('/users?role=officer');
        setOfficers(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching officers:', error);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOfficers();
  }, []);

  // Fetch evidence for expanded case
  const handleToggleExpand = async (cId) => {
    if (expandedCaseId === cId) {
      setExpandedCaseId(null);
      setExpandedCaseEvidence([]);
      return;
    }

    setExpandedCaseId(cId);
    setExpandedCaseEvidence([]);
    
    try {
      setLoadingEvidence(true);
      const res = await api.get(`/cases/${cId}`);
      setExpandedCaseEvidence(res.data.evidence || []);
    } catch (error) {
      console.error('Error fetching case details:', error);
      toast.error('Failed to load case files.');
    } finally {
      setLoadingEvidence(false);
    }
  };

  // Create Case Submit
  const handleCreateCaseSubmit = async (e) => {
    e.preventDefault();
    if (!caseTitle || !caseNumber || !assignedOfficer) {
      toast.error('Please input case number, title, and assigned officer.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/cases', {
        caseNumber,
        title: caseTitle,
        description: caseDesc,
        assignedOfficer,
      });
      toast.success('Investigation case created successfully.');
      
      // Reset form
      setCaseTitle('');
      setCaseNumber('');
      setCaseDesc('');
      setAssignedOfficer('');
      setIsCreateOpen(false);
      
      fetchCases();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCaseStatus = async (cId, currentCase, newStatus) => {
    try {
      await api.put(`/cases/${cId}`, {
        status: newStatus,
      });
      toast.success(`Case status set to ${newStatus.replace('_', ' ')}.`);
      fetchCases();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status update failed.');
    }
  };

  // Open Create Case helper
  const openCreateCase = () => {
    setCaseNumber(`CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setCaseTitle('');
    setCaseDesc('');
    setAssignedOfficer(user?._id || '');
    setIsCreateOpen(true);
  };

  return (
    <DashboardLayout title="Case Management Directory">
      {/* Filter panel */}
      <div className="filter-panel glass-card">
        <div className="search-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by case number, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="filters-group">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="form-input filter-select"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {(isAdmin || isOfficer) && (
          <button className="btn btn-primary" onClick={openCreateCase}>
            <FiFolderPlus /> Register New Case
          </button>
        )}
      </div>

      {/* Cases list */}
      {loading ? (
        <div className="loader-container">
          <div className="system-loader"></div>
          <span>Loading cases...</span>
        </div>
      ) : casesList.length === 0 ? (
        <div className="glass-card empty-message-box">
          <FiBriefcase style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No Cases Registered</h3>
          <p>No active case directories match the current filters.</p>
        </div>
      ) : (
        <div className="cases-list-container">
          {casesList.map(item => {
            const isExpanded = expandedCaseId === item._id;
            return (
              <div key={item._id} className={`case-card-wrapper glass-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="case-card-header" onClick={() => handleToggleExpand(item._id)}>
                  <div className="header-left">
                    <div className="expand-indicator">
                      {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                    </div>
                    <div className="case-title-block">
                      <span className="case-num">{item.caseNumber}</span>
                      <h4 className="case-title">{item.title}</h4>
                    </div>
                  </div>

                  <div className="header-right">
                    <span className="officer-assigned">
                      <FiUser /> {item.assignedOfficer?.name || 'Unassigned'}
                    </span>
                    
                    <span className={`badge ${
                      item.status === 'open' 
                        ? 'badge-primary' 
                        : item.status === 'closed' 
                          ? 'badge-success' 
                          : 'badge-warning'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="case-expanded-details animate-fade-in">
                    {item.description && (
                      <div className="case-desc-box">
                        <h5>Case Scope & Background</h5>
                        <p>{item.description}</p>
                      </div>
                    )}

                    <div className="case-evidence-section">
                      <div className="section-header-row">
                        <h5>Associated Evidence Payloads</h5>
                        {(isAdmin || isOfficer) && (
                          <div className="case-controls">
                            {/* Update Status dropdown */}
                            <select
                              value={item.status}
                              onChange={(e) => updateCaseStatus(item._id, item, e.target.value)}
                              className="form-input status-select-btn"
                            >
                              <option value="open">Open</option>
                              <option value="under_investigation">Under Investigation</option>
                              <option value="closed">Closed</option>
                            </select>
                            <Link to={`/evidence`} className="btn btn-secondary btn-sm">
                              <FiUploadCloud /> Upload to Case
                            </Link>
                          </div>
                        )}
                      </div>

                      {loadingEvidence ? (
                        <div className="loader-container inline-loader">
                          <div className="system-loader mini"></div>
                          <span>Querying case archive...</span>
                        </div>
                      ) : expandedCaseEvidence.length === 0 ? (
                        <div className="empty-message-inline">No evidence items linked to this case file.</div>
                      ) : (
                        <div className="evidence-subtable table-container">
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Evidence Title</th>
                                <th>Filename</th>
                                <th>Category</th>
                                <th>Size</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedCaseEvidence.map(ev => (
                                <tr key={ev._id}>
                                  <td><strong>{ev.title}</strong></td>
                                  <td className="small-text">{ev.originalFilename}</td>
                                  <td><span className="badge badge-primary">{ev.category}</span></td>
                                  <td>{(ev.fileSize / 1024).toFixed(1)} KB</td>
                                  <td>
                                    <Link to={`/evidence/${ev._id}`} className="btn btn-secondary btn-xs" title="View details">
                                      <FiEye /> View Details
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Register Case Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header-row">
              <h3>Register Investigation Directory</h3>
              <button className="close-modal-btn" onClick={() => setIsCreateOpen(false)}><FiX /></button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="case-num">Case Directory ID (Unique)</label>
                <input
                  id="case-num"
                  type="text"
                  className="form-input"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="case-title">Case Title / Focus</label>
                <input
                  id="case-title"
                  type="text"
                  className="form-input"
                  placeholder="E.g., Grand Larceny Investigation 2026"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="case-desc">Scope and Context</label>
                <textarea
                  id="case-desc"
                  className="form-input"
                  rows={3}
                  placeholder="Detail primary targets, timelines, locations, and suspect IDs..."
                  value={caseDesc}
                  onChange={(e) => setCaseDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="case-officer">Lead Investigator</label>
                <select
                  id="case-officer"
                  className="form-input"
                  value={assignedOfficer}
                  onChange={(e) => setAssignedOfficer(e.target.value)}
                  required
                  style={{ appearance: 'auto' }}
                >
                  <option value="">Select Lead Officer</option>
                  {officers.map(o => (
                    <option key={o._id} value={o._id}>{o.name} ({o.email})</option>
                  ))}
                  {/* Fallback for lead if officers list is empty */}
                  {officers.length === 0 && (
                    <option value={user?._id}>{user?.name} (Self)</option>
                  )}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Open Case File'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .cases-list-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .case-card-wrapper {
          padding: 0;
          overflow: hidden;
          transition: var(--transition-smooth);
        }

        .case-card-wrapper.expanded {
          border-color: var(--primary);
        }

        .case-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          cursor: pointer;
          user-select: none;
          flex-wrap: wrap;
          gap: 16px;
        }

        .case-card-header:hover {
          background: rgba(255, 255, 255, 0.01);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .expand-indicator {
          font-size: 1.3rem;
          color: var(--text-secondary);
          display: flex;
        }

        .case-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .case-num {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.5px;
        }

        .case-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .officer-assigned {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .case-expanded-details {
          padding: 24px;
          border-top: 1px solid var(--card-border);
          background: rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .case-desc-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .case-desc-box h5 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }

        .case-desc-box p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .case-evidence-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .section-header-row h5 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }

        .case-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-select-btn {
          padding: 6px 12px;
          font-size: 0.82rem;
          background: var(--bg-secondary);
          width: fit-content;
          appearance: auto;
        }

        .inline-loader {
          min-height: 100px !important;
        }

        .system-loader.mini {
          width: 24px;
          height: 24px;
          border-width: 2px;
        }

        .small-text {
          font-size: 0.82rem !important;
          color: var(--text-secondary);
        }

        .btn-sm {
          padding: 6px 14px;
          font-size: 0.82rem;
        }
      `}} />
    </DashboardLayout>
  );
};

export default CaseManagementPage;
