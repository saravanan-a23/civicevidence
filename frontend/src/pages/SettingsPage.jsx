import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiLock, FiUser, FiSettings, FiShield, FiDatabase, FiCpu, FiCheck, FiEye, FiEyeOff
} from 'react-icons/fi';

const SettingsPage = () => {
  const { user, isAdmin } = useAuth();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Visibility toggles state
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&#).');
      return;
    }

    try {
      setIsUpdating(true);
      
      const response = await api.put('/users/change-password', {
        currentPassword,
        newPassword
      });
      
      toast.success(response.data.message || 'Security password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update security credentials.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout title="System Configurations & Profile">
      <div className="grid-2 settings-grid">
        
        {/* Left Column: Profile & Credentials change */}
        <div className="settings-column flex-col">
          {/* User profile dossier */}
          <div className="glass-card flex-col">
            <h3 className="section-title"><FiUser /> Investigator Profile</h3>
            <div className="profile-details-grid">
              <div className="detail-line">
                <span className="label">Full Name:</span>
                <span className="val">{user?.name}</span>
              </div>
              <div className="detail-line">
                <span className="label">Agency Email:</span>
                <span className="val">{user?.email}</span>
              </div>
              <div className="detail-line">
                <span className="label">Clearance Role:</span>
                <span className="badge badge-primary">{user?.role?.toUpperCase()}</span>
              </div>
              <div className="detail-line">
                <span className="label">Account Status:</span>
                <span className="badge badge-success">ACTIVE / APPROVED</span>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="glass-card flex-col">
            <h3 className="section-title"><FiLock /> Change Security Code</h3>
            
            <form onSubmit={handlePasswordChange} className="settings-form">
              <div className="form-group">
                <label className="form-label" htmlFor="curr-pass">Current Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="curr-pass"
                    type={showCurrentPass ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingRight: '46px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="pass-toggle-btn"
                  >
                    {showCurrentPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-pass">New Security Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="new-pass"
                    type={showNewPass ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingRight: '46px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="pass-toggle-btn"
                  >
                    {showNewPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="conf-pass">Confirm New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="conf-pass"
                    type={showConfirmPass ? 'text' : 'password'}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingRight: '46px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="pass-toggle-btn"
                  >
                    {showConfirmPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                {isUpdating ? 'Updating Credentials...' : 'Save New Credentials'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Cryptography & System info */}
        <div className="settings-column flex-col">
          {/* Cryptography Parameters */}
          <div className="glass-card flex-col">
            <h3 className="section-title"><FiCpu /> Cryptographic Parameters</h3>
            <div className="config-details-grid">
              <div className="detail-line">
                <span className="label">Cipher Algorithm</span>
                <span className="val-code">AES-256-CBC</span>
              </div>
              <div className="detail-line">
                <span className="label">Key Derivation Function</span>
                <span className="val-code">PBKDF2 / SHA-256</span>
              </div>
              <div className="detail-line">
                <span className="label">Master Encryption Key</span>
                <span className="val-status-ok"><FiCheck /> ACTIVE & RECOGNIZED</span>
              </div>
              <div className="detail-line">
                <span className="label">Key Length</span>
                <span className="val-code">256 Bits</span>
              </div>
              <div className="detail-line">
                <span className="label">Initialization Vector (IV)</span>
                <span className="val-code">128 Bits Random per file</span>
              </div>
            </div>
            <div className="info-text-box">
              <FiShield className="shield" />
              <p>
                All evidence payloads are encrypted in-memory before disk serialization. Metadata (hashes, IVs, and master-encrypted file keys) are separated from target payload binary storage objects.
              </p>
            </div>
          </div>

          {/* Storage parameters */}
          <div className="glass-card flex-col">
            <h3 className="section-title"><FiDatabase /> Storage Infrastructure</h3>
            <div className="config-details-grid">
              <div className="detail-line">
                <span className="label">Storage Mode:</span>
                <span className="val badge badge-info">LOCAL BACKEND FALLBACK</span>
              </div>
              <div className="detail-line">
                <span className="label">Encrypted Files Directory:</span>
                <span className="val-path">CivicEvidence/backend/uploads/</span>
              </div>
              <div className="detail-line">
                <span className="label">Database Server:</span>
                <span className="val-path">MongoDB Local Instance / Atlas Sandbox</span>
              </div>
              <div className="detail-line">
                <span className="label">Cloud AWS S3 Readiness:</span>
                <span className="val-status-ok">CONFIGURED FOR AUTO-DETECT</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .profile-details-grid, .config-details-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-line {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 10px;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .detail-line:last-child {
          border-bottom: none;
        }

        .detail-line .label {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .detail-line .val {
          font-size: 0.95rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .val-code {
          font-family: monospace;
          background: var(--bg-tertiary);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          color: var(--primary);
        }

        .val-status-ok {
          color: var(--success);
          font-weight: 700;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .val-path {
          font-family: monospace;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .info-text-box {
          background: var(--primary-light);
          color: var(--primary);
          padding: 16px;
          border-radius: var(--radius-sm);
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border: 1px solid rgba(37, 99, 235, 0.15);
        }

        .info-text-box .shield {
          font-size: 1.4rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .info-text-box p {
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--primary);
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pass-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 8px;
          transition: var(--transition-fast);
        }
        
        .pass-toggle-btn:hover {
          color: var(--primary);
        }
      `}} />
    </DashboardLayout>
  );
};

export default SettingsPage;
