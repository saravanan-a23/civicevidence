import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiActivity, FiSearch, FiCalendar, FiSmartphone, FiClock, FiFileText, FiChevronDown, FiChevronRight 
} from 'react-icons/fi';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail Modal popup state
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit', {
        params: {
          search,
          action,
          status,
          startDate: startDate ? new Date(startDate).toISOString() : '',
          endDate: endDate ? new Date(endDate).toISOString() : '',
          page,
          limit: 25,
        }
      });
      setLogs(res.data.logs || []);
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load system audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, action, status, startDate, endDate, page]);

  const toggleRow = (id) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };

  return (
    <DashboardLayout title="System Security Audit Trail">
      {/* Filters box */}
      <div className="filter-panel glass-card">
        <div className="search-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by investigator, IP address, target ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input"
          />
        </div>

        <div className="filters-group">
          {/* Action types */}
          <select 
            value={action} 
            onChange={(e) => { setAction(e.target.value); setPage(1); }} 
            className="form-input filter-select"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGIN_FAIL">LOGIN_FAIL</option>
            <option value="UPLOAD">UPLOAD</option>
            <option value="DOWNLOAD">DOWNLOAD</option>
            <option value="DELETE">DELETE</option>
            <option value="RESTORE">RESTORE</option>
            <option value="SHARE">SHARE</option>
            <option value="SHARE_REVOKE">SHARE_REVOKE</option>
            <option value="ROLLBACK">ROLLBACK</option>
          </select>

          {/* Status filter */}
          <select 
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPage(1); }} 
            className="form-input filter-select"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>

        {/* Date Filters */}
        <div className="date-filters-group">
          <div className="date-input-wrap">
            <FiCalendar />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="form-input date-input"
              title="Start Date"
            />
          </div>
          <span className="date-sep">to</span>
          <div className="date-input-wrap">
            <FiCalendar />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="form-input date-input"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card flex-col">
        <div className="logs-header-row">
          <h3 className="section-title"><FiActivity /> Cryptographic Logging Feed</h3>
          <span className="logs-counter">Found <strong>{total}</strong> entry entries</span>
        </div>

        {loading ? (
          <div className="loader-container">
            <div className="system-loader"></div>
            <span>Syncing audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-message">No audit logs found matching the filter parameters.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table audit-logs-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Timestamp</th>
                  <th>Investigator</th>
                  <th>Operation</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Target Object ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <React.Fragment key={log._id}>
                      <tr className="main-log-row" onClick={() => toggleRow(log._id)}>
                        <td>{isExpanded ? <FiChevronDown /> : <FiChevronRight />}</td>
                        <td className="log-time">
                          <FiClock /> {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td>
                          {log.user ? (
                            <div className="user-td">
                              <strong>{log.user.name}</strong>
                              <span>{log.user.email}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>UNAUTHENTICATED</span>
                          )}
                        </td>
                        <td className="log-action">
                          <span className="action-tag">{log.action}</span>
                        </td>
                        <td><code>{log.ipAddress}</code></td>
                        <td>
                          <span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="log-target">
                          <code>{log.target.slice(0, 16)}...</code>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr className="expanded-log-details-row animate-fade-in">
                          <td colSpan={7}>
                            <div className="expanded-log-details">
                              <div className="details-col">
                                <strong>Log Details & Event Context</strong>
                                <p className="details-text">{log.details}</p>
                              </div>
                              <div className="details-col">
                                <strong>Security Signature Metadata</strong>
                                <div className="metadata-lines">
                                  <span><FiSmartphone /> <strong>User-Agent OS:</strong> {log.device}</span>
                                  <span><strong>Database Record ID:</strong> {log._id}</span>
                                  <span><strong>Target Object Link:</strong> {log.target}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination-bar">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            className="btn btn-secondary"
          >
            Prev
          </button>
          <span>Page {page} of {pages}</span>
          <button 
            disabled={page === pages} 
            onClick={() => setPage(prev => Math.min(prev + 1, pages))}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .date-filters-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-input-wrap {
          display: flex;
          align-items: center;
          position: relative;
        }

        .date-input-wrap svg {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }

        .date-input {
          padding-left: 40px !important;
          min-width: 140px;
        }

        .date-sep {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.85rem;
        }

        .logs-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .logs-counter {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .audit-logs-table tbody tr {
          cursor: pointer;
        }

        .main-log-row:hover td {
          background-color: var(--bg-tertiary) !important;
        }

        .log-time {
          font-size: 0.82rem !important;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .log-time svg {
          vertical-align: middle;
          margin-right: 4px;
        }

        .user-td {
          display: flex;
          flex-direction: column;
        }

        .user-td span {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .action-tag {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--primary);
          background: var(--primary-light);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .log-target code, .main-log-row code {
          font-family: monospace;
          background: var(--bg-primary);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .expanded-log-details-row td {
          padding: 0 !important;
          background-color: var(--bg-primary) !important;
        }

        .expanded-log-details {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          padding: 24px 32px;
        }

        @media (min-width: 768px) {
          .expanded-log-details {
            grid-template-columns: 1.5fr 1fr;
          }
        }

        .details-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .details-col strong {
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }

        .details-text {
          font-size: 0.95rem;
          color: var(--text-primary);
          background: var(--bg-secondary);
          border: 1px solid var(--card-border);
          padding: 16px;
          border-radius: var(--radius-sm);
          line-height: 1.6;
        }

        .metadata-lines {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .metadata-lines strong {
          color: var(--text-primary);
          text-transform: none;
          letter-spacing: 0;
        }
      `}} />
    </DashboardLayout>
  );
};

export default AuditLogsPage;
