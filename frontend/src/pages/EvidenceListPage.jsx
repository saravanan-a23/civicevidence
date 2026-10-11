import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiSearch, FiFilter, FiUploadCloud, FiDownload, FiShare2, FiTrash2, 
  FiEye, FiRotateCcw, FiFileText, FiTag, FiFolder, FiX, FiCheck, FiLock
} from 'react-icons/fi';

const EvidenceListPage = () => {
  const { user, isAdmin, isOfficer } = useAuth();
  const [evidenceList, setEvidenceList] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [caseId, setCaseId] = useState('');
  const [sort, setSort] = useState('newest');
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadCase, setUploadCase] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Share form state
  const [shareFileId, setShareFileId] = useState('');
  const [shareFileTitle, setShareFileTitle] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('read');
  const [shareExpiry, setShareExpiry] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Drag and drop helper
  const [isDragOver, setIsDragOver] = useState(false);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const res = await api.get('/evidence', {
        params: {
          search,
          category,
          caseId,
          sort,
          page,
          includeDeleted: showDeleted ? 'true' : 'false',
        }
      });
      setEvidenceList(res.data.evidence || []);
      setPages(res.data.pages || 1);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      toast.error('Failed to load evidence catalog.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await api.get('/cases');
      setCases(res.data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [search, category, caseId, sort, showDeleted, page]);

  useEffect(() => {
    fetchCases();
  }, []);

  // Download evidence file
  const handleDownload = async (id, filename) => {
    try {
      toast.loading('Decrypting and downloading secure payload...', { id: 'downloading' });
      const response = await api.get(`/evidence/${id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('File decrypted and downloaded successfully!', { id: 'downloading' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Decryption failed. You may lack download rights.', { id: 'downloading' });
    }
  };

  // Delete evidence
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to soft-delete this evidence? Officers can restore it.')) return;
    try {
      await api.delete(`/evidence/${id}`);
      toast.success('Evidence file soft-deleted.');
      fetchEvidence();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed.');
    }
  };

  // Restore evidence
  const handleRestore = async (id) => {
    try {
      await api.post(`/evidence/${id}/restore`);
      toast.success('Evidence file restored to active state.');
      fetchEvidence();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Restore failed.');
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      if (!uploadTitle) {
        // Autopopulate title
        const nameWithoutExt = e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, "");
        setUploadTitle(nameWithoutExt);
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!uploadTitle) {
        const nameWithoutExt = e.target.files[0].name.replace(/\.[^/.]+$/, "");
        setUploadTitle(nameWithoutExt);
      }
    }
  };

  // Upload Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle) {
      toast.error('Please specify a title and select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDesc);
    formData.append('category', uploadCategory);
    formData.append('caseId', uploadCase);
    formData.append('tags', uploadTags);

    try {
      setIsUploading(true);
      toast.loading('Hashing SHA-256 and encrypting AES-256 locally...', { id: 'uploading' });
      await api.post('/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Payload encrypted and stored successfully!', { id: 'uploading' });
      
      // Reset form
      setUploadTitle('');
      setUploadDesc('');
      setUploadCategory('General');
      setUploadCase('');
      setUploadTags('');
      setSelectedFile(null);
      setIsUploadOpen(false);
      
      fetchEvidence();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.message || 'Storage upload failed.', { id: 'uploading' });
    } finally {
      setIsUploading(false);
    }
  };

  // Open Share Dialog
  const openShare = (id, title) => {
    setShareFileId(id);
    setShareFileTitle(title);
    setShareEmail('');
    setSharePermission('read');
    
    // Default expiry 7 days from now at the same time
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Format to YYYY-MM-DDTHH:MM local time
    const pad = (num) => String(num).padStart(2, '0');
    const localDateTime = `${nextWeek.getFullYear()}-${pad(nextWeek.getMonth() + 1)}-${pad(nextWeek.getDate())}T${pad(nextWeek.getHours())}:${pad(nextWeek.getMinutes())}`;
    setShareExpiry(localDateTime);
    
    setIsShareOpen(true);
  };

  // Share Submit
  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareEmail || !shareExpiry) {
      toast.error('Please input email and expiry date.');
      return;
    }

    try {
      setIsSharing(true);
      await api.post('/share', {
        evidenceId: shareFileId,
        email: shareEmail,
        permission: sharePermission,
        expiresAt: new Date(shareExpiry).toISOString(),
      });
      toast.success('Temporary sharing link created successfully!');
      setIsShareOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sharing failed.');
    } finally {
      setIsSharing(false);
    }
  };

  // Export CSV
  const exportToCSV = () => {
    if (evidenceList.length === 0) {
      toast.error('No evidence available to export.');
      return;
    }

    const headers = ['ID', 'Title', 'Category', 'Filename', 'Size (Bytes)', 'Hash (SHA-256)', 'Upload Date', 'Uploaded By'];
    const rows = evidenceList.map(item => [
      item._id,
      `"${item.title.replace(/"/g, '""')}"`,
      item.category,
      item.originalFilename,
      item.fileSize,
      item.hash,
      new Date(item.createdAt).toLocaleDateString(),
      item.uploadedBy?.name || 'Unknown'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `civicevidence_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <DashboardLayout title="Evidence Registry">
      {/* Top action row */}
      <div className="filter-panel glass-card">
        <div className="search-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by evidence title, filename..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input"
          />
        </div>

        <div className="filters-group">
          {/* Category Filter */}
          <select 
            value={category} 
            onChange={(e) => { setCategory(e.target.value); setPage(1); }} 
            className="form-input filter-select"
          >
            <option value="">All Categories</option>
            <option value="General">General</option>
            <option value="Document">Document</option>
            <option value="Image">Image</option>
            <option value="Video">Video</option>
            <option value="Audio">Audio</option>
          </select>

          {/* Cases Filter */}
          <select 
            value={caseId} 
            onChange={(e) => { setCaseId(e.target.value); setPage(1); }} 
            className="form-input filter-select"
          >
            <option value="">All Cases</option>
            {cases.map(c => (
              <option key={c._id} value={c._id}>{c.caseNumber} - {c.title}</option>
            ))}
          </select>

          {/* Sort order */}
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)} 
            className="form-input filter-select"
          >
            <option value="newest">Newest Uploads</option>
            <option value="oldest">Oldest Uploads</option>
            <option value="name">Alphabetical</option>
            <option value="size">Largest Size</option>
          </select>
        </div>

        <div className="action-buttons-wrap">
          {isAdmin && (
            <label className="toggle-deleted-label">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => { setShowDeleted(e.target.checked); setPage(1); }}
              />
              <span>View Deleted</span>
            </label>
          )}

          <button className="btn btn-secondary" onClick={exportToCSV} title="Export CSV Report">
            <FiDownload /> Export
          </button>

          <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
            <FiUploadCloud /> Upload payload
          </button>
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="loader-container">
          <div className="system-loader"></div>
          <span>Syncing secure catalog...</span>
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="glass-card empty-message-box">
          <FiFileText style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No Evidence Found</h3>
          <p>No matching secure files were located in this access tier. Change filters or upload a new file.</p>
        </div>
      ) : (
        <div className="grid-3 evidence-grid">
          {evidenceList.map(item => (
            <div key={item._id} className={`glass-card evidence-card ${item.isDeleted ? 'deleted-card' : ''}`}>
              <div className="card-top-icon">
                <FiFileText className="doc-icon" />
                <span className="file-ext">{item.originalFilename.split('.').pop().toUpperCase()}</span>
                {item.isDeleted && <span className="deleted-tag">DELETED</span>}
              </div>

              <div className="card-info">
                <h4 className="card-title-text">{item.title}</h4>
                <p className="card-filename">{item.originalFilename}</p>
                <div className="card-meta">
                  <span className="badge badge-primary">{item.category}</span>
                  <span className="card-size">{(item.fileSize / 1024).toFixed(1)} KB</span>
                </div>
                {item.caseId && (
                  <div className="card-case-badge">
                    <FiFolder /> {item.caseId.caseNumber}
                  </div>
                )}
              </div>

              <div className="card-footer-actions">
                <Link to={`/evidence/${item._id}`} className="btn btn-secondary btn-icon-only" title="View details & logs">
                  <FiEye />
                </Link>

                {!item.isDeleted ? (
                  <>
                    <button 
                      className="btn btn-secondary btn-icon-only" 
                      onClick={() => handleDownload(item._id, item.originalFilename)}
                      title="Decrypt & Download"
                    >
                      <FiDownload />
                    </button>
                    {(isAdmin || isOfficer || item.uploadedBy?._id === user?._id) && (
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        onClick={() => openShare(item._id, item.title)}
                        title="Secure Share"
                      >
                        <FiShare2 />
                      </button>
                    )}
                    {(isAdmin || item.uploadedBy?._id === user?._id) && (
                      <button 
                        className="btn btn-danger btn-icon-only" 
                        onClick={() => handleDelete(item._id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </>
                ) : (
                  isAdmin && (
                    <button 
                      className="btn btn-primary btn-icon-only" 
                      onClick={() => handleRestore(item._id)}
                      title="Restore Evidence"
                    >
                      <FiRotateCcw />
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card select-none">
            <div className="modal-header-row">
              <h3>Upload Digital Evidence (AES-256 Encrypted)</h3>
              <button className="close-modal-btn" onClick={() => setIsUploadOpen(false)}><FiX /></button>
            </div>

            <form onSubmit={handleUploadSubmit} className="modal-form">
              {/* Drag and Drop Zone */}
              <div 
                className={`drag-drop-zone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'file-selected' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <FiUploadCloud className="upload-icon" />
                {selectedFile ? (
                  <div className="selected-file-details">
                    <p className="file-name">{selectedFile.name}</p>
                    <p className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="drop-prompt">
                    <p>Drag and drop digital file here, or</p>
                    <label className="file-select-label">
                      Browse Files
                      <input type="file" onChange={handleFileSelect} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="upload-title">Evidence Title</label>
                <input
                  id="upload-title"
                  type="text"
                  className="form-input"
                  placeholder="E.g., Surveillance Footage Camera 3"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="upload-desc">Description / Notes</label>
                <textarea
                  id="upload-desc"
                  className="form-input"
                  rows={2}
                  placeholder="Provide context, details, and conditions..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="upload-category">Category</label>
                  <select
                    id="upload-category"
                    className="form-input"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
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
                  <label className="form-label" htmlFor="upload-case">Assign Case</label>
                  <select
                    id="upload-case"
                    className="form-input"
                    value={uploadCase}
                    onChange={(e) => setUploadCase(e.target.value)}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="">No Case (Standalone)</option>
                    {cases.map(c => (
                      <option key={c._id} value={c._id}>{c.caseNumber} - {c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="upload-tags">Tags (comma-separated)</label>
                <div className="input-with-icon">
                  <FiTag style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                  <input
                    id="upload-tags"
                    type="text"
                    className="form-input"
                    placeholder="E.g., weapon, fingerprints, suspect-a"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isUploading || !selectedFile}>
                {isUploading ? 'Hashing & Encrypting...' : 'Upload & Encrypt'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header-row">
              <h3>Create Secure Temporary Link</h3>
              <button className="close-modal-btn" onClick={() => setIsShareOpen(false)}><FiX /></button>
            </div>

            <form onSubmit={handleShareSubmit} className="modal-form">
              <div className="share-file-indicator">
                <FiLock /> Sharing: <strong>{shareFileTitle}</strong>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="share-email">Recipient User Email</label>
                <input
                  id="share-email"
                  type="email"
                  className="form-input"
                  placeholder="collaborator@agency.gov"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="share-perm">Access Tier</label>
                <select
                  id="share-perm"
                  className="form-input"
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                  style={{ appearance: 'auto' }}
                >
                  <option value="read">Read Only (Metadata preview)</option>
                  <option value="download">Download Access (Decrypt & Download)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="share-expiry">Expiration Date & Time</label>
                <input
                  id="share-expiry"
                  type="datetime-local"
                  className="form-input"
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSharing}>
                {isSharing ? 'Establishing link...' : 'Create Secure Share'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .filter-panel {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 16px 24px;
        }

        .search-wrap {
          flex: 1;
          min-width: 250px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          color: var(--text-muted);
        }

        .search-wrap .form-input {
          padding-left: 48px;
        }

        .filters-group {
          display: flex;
          gap: 12px;
        }

        .filter-select {
          min-width: 140px;
          appearance: auto !important;
        }

        .action-buttons-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle-deleted-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .evidence-grid {
          margin-top: 8px;
        }

        .evidence-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }

        .deleted-card {
          border: 1px dashed var(--danger);
          opacity: 0.8;
          background: rgba(239, 68, 68, 0.05);
        }

        .deleted-tag {
          position: absolute;
          top: 16px;
          right: 16px;
          background: var(--danger);
          color: #ffffff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .card-top-icon {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .doc-icon {
          font-size: 2.2rem;
          color: var(--primary);
        }

        .file-ext {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .card-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .card-title-text {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .card-filename {
          font-size: 0.8rem;
          color: var(--text-muted);
          word-break: break-all;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }

        .card-size {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .card-case-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          background: var(--bg-tertiary);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          width: fit-content;
        }

        .card-footer-actions {
          display: flex;
          gap: 8px;
          border-top: 1px solid var(--card-border);
          padding-top: 14px;
          margin-top: auto;
        }

        .btn-icon-only {
          padding: 8px 12px;
          font-size: 1.05rem;
        }

        .empty-message-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px;
          text-align: center;
        }

        .empty-message-box h3 {
          margin-bottom: 8px;
        }

        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
          font-size: 0.95rem;
          font-weight: 600;
        }

        /* Modal Styles */
        .modal-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 14px;
        }

        .close-modal-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 1.3rem;
          color: var(--text-muted);
          transition: var(--transition-fast);
          display: flex;
        }

        .close-modal-btn:hover {
          color: var(--danger);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .drag-drop-zone {
          border: 2px dashed var(--primary);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          transition: var(--transition-smooth);
        }

        .drag-drop-zone.drag-over {
          background: var(--primary-light);
          border-style: solid;
        }

        .drag-drop-zone.file-selected {
          border-color: var(--success);
          background: rgba(16, 185, 129, 0.03);
        }

        .upload-icon {
          font-size: 3rem;
          color: var(--primary);
        }

        .file-selected .upload-icon {
          color: var(--success);
        }

        .drop-prompt {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .file-select-label {
          margin-top: 8px;
          display: inline-block;
          background: var(--primary);
          color: #ffffff;
          padding: 6px 16px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
          transition: var(--transition-fast);
        }

        .file-select-label:hover {
          background: var(--primary-hover);
        }

        .selected-file-details .file-name {
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-primary);
          word-break: break-all;
        }

        .selected-file-details .file-size {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .share-file-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-tertiary);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
        }
      `}} />
    </DashboardLayout>
  );
};

export default EvidenceListPage;
