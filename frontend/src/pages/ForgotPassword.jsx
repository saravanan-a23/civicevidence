import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiShield, FiKey, FiEye, FiEyeOff } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: request, 2: reset
  const [simulatedCode, setSimulatedCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required.');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email format (e.g., agent@agency.gov).');
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPassword(email);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      if (result.simulatedOtp) {
        setSimulatedCode(result.simulatedOtp);
      }
      setStep(2);
    } else {
      toast.error(result.message);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error('All fields are required.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&#).');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(email, otp, newPassword);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      navigate('/login');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card glass-card">
        <div className="forgot-header">
          <FiShield className="forgot-logo" />
          <h1 className="forgot-title">CivicEvidence</h1>
          <p className="forgot-subtitle">Secure Password Reset</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestSubmit} className="forgot-form">
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Enter Registered Email</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  id="forgot-email"
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

            <button type="submit" className="btn btn-primary forgot-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Requesting Code...' : 'Request Security Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="forgot-form">
            <div style={{
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FiMail style={{ fontSize: '1.2rem', flexShrink: 0 }} />
              <span>A 6-digit verification code has been dispatched to <strong>{email}</strong>. Please check your inbox.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-otp">Security Code (OTP)</label>
              <div className="input-with-icon">
                <FiKey className="input-icon" />
                <input
                  id="reset-otp"
                  type="text"
                  className="form-input icon-padded"
                  placeholder="6-Digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-password">New Security Password</label>
              <div className="input-with-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FiLock className="input-icon" />
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input icon-padded"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <button type="submit" className="btn btn-primary forgot-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting Password...' : 'Verify & Reset Password'}
            </button>
          </form>
        )}

        <div className="forgot-footer">
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Back to Secure Sign In
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .forgot-wrapper {
          display: flex;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, hsl(222, 47%, 6%), hsl(222, 47%, 14%));
          padding: 16px;
        }

        .forgot-card {
          width: 100%;
          max-width: 440px;
          padding: 40px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }

        .forgot-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .forgot-logo {
          font-size: 3rem;
          color: var(--primary);
          margin-bottom: 12px;
          filter: drop-shadow(0 0 10px var(--primary-glow));
        }

        .forgot-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }

        .forgot-subtitle {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .forgot-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
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

        .forgot-btn {
          margin-top: 8px;
          padding: 14px;
          font-size: 1rem;
        }

        .simulated-otp-box {
          background: var(--success-light);
          color: var(--success);
          border: 1px dashed var(--success);
          padding: 12px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .otp-val {
          font-size: 1.3rem;
          letter-spacing: 2px;
        }

        .forgot-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 0.9rem;
        }

        .pass-toggle-btn:hover {
          color: var(--primary) !important;
        }
      `}} />
    </div>
  );
};

export default ForgotPassword;
