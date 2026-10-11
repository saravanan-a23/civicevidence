import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { FiShare2, FiTrash2, FiClock, FiLock, FiInfo } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const SharesPage = () => {
  const { user } = useAuth();
  const [sharesList, setSharesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const res = await api.get('/share');
      setSharesList(res.data || []);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast.error('Failed to load shared links.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this user\'s access to this file immediately?')) return;

    try {
      await api.delete(`/share/${id}`);
      toast.success('Access revoked successfully.');
      fetchShares();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke access.');
    }
  };

  return (
    <DashboardLayout title="Active Secure Shares">
      <div className="glass-card flex-col">
        <h3 className="section-title"><FiShare2 /> Shared Evidence Index</h3>
        
        {loading ? (
          <div className="loader-container">
            <div className="system-loader"></div>
            <span>Loading active links...</span>
          </div>
        ) : sharesList.length === 0 ? (
          <div className="empty-message">No active sharing links found in this scope.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Evidence File</th>
                  <th>Shared With</th>
                  <th>Access Tier</th>
                  <th>Expiration Date</th>
                  <th>Authorized By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sharesList.map(share => {
                  const isExpired = new Date() > new Date(share.expiresAt);
                  return (
                    <tr key={share._id} style={{ opacity: isExpired ? 0.5 : 1 }}>
                      <td>
                        {share.evidenceId ? (
                          <Link to={`/evidence/${share.evidenceId._id}`} className="share-link-item">
                            <strong>{share.evidenceId.title}</strong>
                            <span className="sub-file-text">{share.evidenceId.originalFilename}</span>
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Deleted file</span>
                        )}
                      </td>
                      <td>
                        <div className="user-info-td">
                          <span className="name">{share.sharedWith?.name}</span>
                          <span className="email">{share.sharedWith?.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${share.permission === 'download' ? 'badge-success' : 'badge-primary'}`}>
                          {share.permission === 'download' ? 'Download Right' : 'Read Only'}
                        </span>
                      </td>
                      <td>
                        <div className="date-td">
                          <span>{new Date(share.expiresAt).toLocaleString()}</span>
                          {isExpired ? (
                            <span className="expired-warn">EXPIRED</span>
                          ) : (
                            <span className="time-left">
                              <FiClock /> {(() => {
                                const diffMs = new Date(share.expiresAt) - new Date();
                                const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
                                if (diffHours > 48) {
                                  return `${Math.ceil(diffHours / 24)} days left`;
                                }
                                return `${diffHours} hours left`;
                              })()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="sharer-name">{share.sharedBy?.name}</span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleRevoke(share._id)}
                          className="btn btn-danger btn-xs"
                          title="Revoke access immediately"
                        >
                          <FiTrash2 /> Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .share-link-item {
          display: flex;
          flex-direction: column;
        }

        .share-link-item strong {
          color: var(--text-primary);
        }

        .share-link-item strong:hover {
          color: var(--primary);
        }

        .sub-file-text {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .user-info-td, .date-td {
          display: flex;
          flex-direction: column;
        }

        .user-info-td .name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-info-td .email {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .date-td span {
          font-size: 0.9rem;
        }

        .time-left {
          font-size: 0.75rem !important;
          color: var(--primary);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          margin-top: 2px;
        }

        .expired-warn {
          font-size: 0.72rem !important;
          color: var(--danger);
          font-weight: 700;
          margin-top: 2px;
        }

        .sharer-name {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
      `}} />
    </DashboardLayout>
  );
};

export default SharesPage;
