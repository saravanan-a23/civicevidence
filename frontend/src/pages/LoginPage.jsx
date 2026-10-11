import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiShield, FiAlertTriangle, FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show message if redirected from an expired session
  const showExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email format (e.g., agent@agency.gov).');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-card">
        <div className="login-header">
          <FiShield className="login-logo" />
          <h1 className="login-title">CivicEvidence</h1>
          <p className="login-subtitle">Secure Digital Evidence Management</p>
        </div>

        {showExpired && (
          <div className="session-warning">
            <FiAlertTriangle />
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                id="email-input"
                type="email"
                className="form-input icon-padded"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label className="form-label" htmlFor="password-input">Security Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                Forgot Code?
              </Link>
            </div>
            <div className="input-with-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FiLock className="input-icon" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input icon-padded"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingRight: '46px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="pass-toggle-btn"
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  zIndex: 5
                }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating...' : 'Establish Secure Connection'}
          </button>
        </form>

        <div className="login-footer">
          <span>Need system access?</span>{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Submit Access Request
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-wrapper {
          display: flex;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, hsl(222, 47%, 6%), hsl(222, 47%, 14%));
          padding: 16px;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 40px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          font-size: 3.5rem;
          color: var(--primary);
          margin-bottom: 12px;
          filter: drop-shadow(0 0 10px var(--primary-glow));
        }

        .login-title {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }

        .login-subtitle {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .session-warning {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--warning-light);
          color: var(--warning);
          padding: 12px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 24px;
          border: 1px solid rgba(245, 158, 11, 0.15);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .icon-padded {
          padding-left: 48px !important;
        }

        .login-btn {
          margin-top: 8px;
          padding: 14px;
          font-size: 1rem;
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .pass-toggle-btn:hover {
          color: var(--primary) !important;
        }
      `}} />
    </div>
  );
};

export default LoginPage;
