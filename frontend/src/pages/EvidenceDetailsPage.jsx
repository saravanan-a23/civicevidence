import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiFileText, FiDownload, FiArrowLeft, FiClock, FiActivity, FiTag, 
  FiFolder, FiLock, FiInfo, FiRefreshCw, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';

const EvidenceDetailsPage = () => {
  const { id } = useParams();
  const { user, isAdmin, isOfficer } = useAuth();
  const navigate = useNavigate();

  const [evidence, setEvidence] = useState(null);
  const [versions, setVersions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  // Edit metadata state
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/evidence/${id}`);
      setEvidence(res.data.evidence);
      setVersions(res.data.versions || []);

      // Populate edit form
      setTitle(res.data.evidence.title);
      setDescription(res.data.evidence.description || '');
      setCategory(res.data.evidence.category);
      setTags(res.data.evidence.tags?.join(', ') || '');

      // Fetch audit logs for this evidence target ID
      const auditRes = await api.get(`/audit?search=${id}`);
      setAuditLogs(auditRes.data.logs || []);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Evidence file not found or unauthorized access.');
      navigate('/evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDownload = async () => {
    try {
      toast.loading('Decrypting secure file stream...', { id: 'downloading' });
      const response = await api.get(`/evidence/${id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', evidence.originalFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('File decrypted successfully!', { id: 'downloading' });
      fetchData(); // reload audits for download log entry
    } catch (error) {
      toast.error('Download failed. Unauthorized permission tier.', { id: 'downloading' });
    }
  };

  const handleUpdateMetadata = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/evidence/${id}`, {
        title,
        description,
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast.success('Metadata updated successfully.');
      setIsEditing(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed.');
    }
  };

  const handleRollback = async (versionId, verNum) => {
    if (!window.confirm(`Are you sure you want to rollback to version ${verNum}? A new version snapshot of the current state will be created.`)) return;

    try {
      setRollbackLoading(true);
      await api.post(`/evidence/${id}/rollback`, { versionId });
      toast.success(`Successfully rolled back to version ${verNum}.`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rollback failed.');
    } finally {
      setRollbackLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Evidence Dossier">
        <div className="loader-container">
          <div className="system-loader"></div>
          <span>Loading secure parameters...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Evidence: ${evidence.title}`}>
      {/* Back button link */}
      <div>
        <Link to="/evidence" className="btn btn-secondary back-nav-btn">
          <FiArrowLeft /> Back to Registry
        </Link>
      </div>

      <div className="grid-2 dossier-layout">
        {/* Left Side: Metadata and Edit form */}
        <div className="dossier-column flex-col">
          <div className="glass-card dossier-card">
            <div className="card-header-row">
              <h3>Dossier Metadata</h3>
              {(isAdmin || isOfficer || evidence.uploadedBy?._id === user?._id) && (
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'Cancel Edit' : 'Edit Metadata'}
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="metadata-dossier-list">
                <div className="meta-row">
                  <span className="meta-label">Original Filename</span>
                  <span className="meta-value">{evidence.originalFilename}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Category</span>
                  <span className="badge badge-primary">{evidence.category}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">File Type</span>
                  <span className="meta-value">{evidence.fileType}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">File Size</span>
                  <span className="meta-value">{(evidence.fileSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Secure SHA-256 Hash</span>
                  <span className="meta-value hash-code">{evidence.hash}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Storage Link</span>
                  <span className="meta-value">{evidence.encryptedFileURL}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Uploaded By</span>
                  <span className="meta-value">{evidence.uploadedBy?.name} ({evidence.uploadedBy?.role})</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Upload Date</span>
                  <span className="meta-value">{new Date(evidence.createdAt).toLocaleString()}</span>
                </div>
                {evidence.description && (
                  <div className="meta-row desc-row">
                    <span className="meta-label">Dossier Notes</span>
                    <p className="meta-desc">{evidence.description}</p>
                  </div>
                )}
                {evidence.tags && evidence.tags.length > 0 && (
                  <div className="tags-container">
                    {evidence.tags.map(t => (
                      <span key={t} className="tag-badge"><FiTag /> {t}</span>
                    ))}
                  </div>
                )}

                <div className="action-buttons-pane">
                  <button className="btn btn-primary" onClick={handleDownload}>
                    <FiDownload /> Decrypt & Download Payload
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateMetadata} className="edit-form-content">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-title">Evidence Title</label>
                  <input
                    id="edit-title"
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-desc">Description / Notes</label>
                  <textarea
                    id="edit-desc"
                    className="form-input"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-cat">Category</label>
                  <select
                    id="edit-cat"
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="General">General</option>
                    <option value="Document">Document</option>
                    <option value="Image">Image</option>
                    <option value="Video">Video</option>
                    <option value="Audio">Audio</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-tags">Tags (comma-separated)</label>
                  <input
                    id="edit-tags"
                    type="text"
                    className="form-input"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Save Metadata</button>
              </form>
            )}
          </div>

          {/* Versions Timeline */}
          <div className="glass-card dossier-card flex-col">
            <h3><FiRefreshCw /> Version Control History</h3>
            {versions.length === 0 ? (
              <div className="empty-message-inline">
                <FiInfo /> Currently on Version 1 (Base Version). No revisions uploaded.
              </div>
            ) : (
              <div className="versions-timeline">
                <div className="version-box current">
                  <span className="ver-badge badge-primary">Current Version</span>
                  <div className="ver-details">
                    <span>Uploaded on {new Date(evidence.createdAt).toLocaleDateString()}</span>
                    <span>Hash: {evidence.hash.slice(0, 16)}...</span>
                  </div>
                </div>

                {versions.map(v => (
                  <div key={v._id} className="version-box historical">
                    <div className="version-box-header">
                      <span className="ver-badge badge-secondary">Version {v.version}</span>
                      {(isAdmin || isOfficer) && (
                        <button 
                          className="btn btn-secondary btn-xs" 
                          onClick={() => handleRollback(v._id, v.version)}
                          disabled={rollbackLoading}
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                    <div className="ver-details">
                      <span><strong>Changes:</strong> {v.changes}</span>
                      <span>By: {v.updatedBy?.name} ({v.updatedBy?.role}) • {new Date(v.timestamp).toLocaleDateString()}</span>
                      <span>Hash: {v.hash.slice(0, 16)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Immutable Audit logs */}
        <div className="dossier-column flex-col">
          <div className="glass-card dossier-card">
            <h3><FiActivity /> Chain of Custody Audit Trail</h3>
            <div className="audit-timeline-list">
              {auditLogs.length === 0 ? (
                <div className="empty-message-inline">No chain of custody logs found.</div>
              ) : (
                <div className="timeline">
                  {auditLogs.map(log => (
                    <div key={log._id} className="timeline-item">
                      <div className={`timeline-marker ${log.status === 'success' ? 'success' : 'danger'}`}></div>
                      <div className="timeline-info">
                        {new Date(log.timestamp).toLocaleString()} • IP: {log.ipAddress}
                      </div>
                      <div className="timeline-content">
                        <strong>{log.user ? log.user.name : 'SYSTEM'}</strong> performed action <strong>{log.action}</strong>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {log.details}
                        </p>
                        <span className="device-tag">{log.device}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .back-nav-btn {
          width: fit-content;
          margin-bottom: 8px;
        }

        .dossier-layout {
          align-items: flex-start;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 12px;
        }

        .metadata-dossier-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 10px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .meta-row.desc-row {
          flex-direction: column;
          border-bottom: none;
        }

        .meta-label {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .meta-value {
          font-size: 0.95rem;
          color: var(--text-primary);
          text-align: right;
        }

        .hash-code {
          font-family: monospace;
          font-size: 0.8rem;
          word-break: break-all;
          max-width: 60%;
        }

        .meta-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          background: var(--bg-tertiary);
          padding: 12px;
          border-radius: var(--radius-sm);
          margin-top: 6px;
          line-height: 1.6;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 600;
        }

        .action-buttons-pane {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--card-border);
        }

        .action-buttons-pane button {
          width: 100%;
        }

        .empty-message-inline {
          padding: 16px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Versions timeline */
        .versions-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .version-box {
          background: var(--bg-tertiary);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .version-box.current {
          border-left: 4px solid var(--primary);
        }

        .version-box.historical {
          border-left: 4px solid var(--text-muted);
        }

        .version-box-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ver-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          width: fit-content;
        }

        .ver-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .btn-xs {
          padding: 4px 8px;
          font-size: 0.75rem;
          border-radius: 4px;
        }

        /* Audits List styling */
        .audit-timeline-list {
          max-height: 700px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .device-tag {
          display: inline-block;
          font-size: 0.72rem;
          color: var(--text-muted);
          background: var(--bg-primary);
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 4px;
        }
      `}} />
    </DashboardLayout>
  );
};

export default EvidenceDetailsPage;
