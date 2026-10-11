import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiShield, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  
  // OTP Verification state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState(''); // helper for local demo
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('All fields are required.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email format (e.g., agent@agency.gov).');
      return;
    }

    if (!passwordRegex.test(password)) {
      toast.error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&#).');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name, email, password, role);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      if (result.simulatedOtp) {
        setSimulatedCode(result.simulatedOtp);
        setShowOtpScreen(true);
      } else {
        // Admin first user case auto approved and verified
        navigate('/login');
      }
    } else {
      toast.error(result.message);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error('Please enter the verification code.');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOtp(email, otpCode);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      navigate('/login');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card glass-card">
        <div className="register-header">
          <FiShield className="register-logo" />
          <h1 className="register-title">CivicEvidence</h1>
          <p className="register-subtitle">Submit Credentials Request</p>
        </div>

        {!showOtpScreen ? (
          <form onSubmit={handleRegisterSubmit} className="register-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <div className="input-with-icon">
                <FiUser className="input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  className="form-input icon-padded"
                  placeholder="Officer Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Agency Email Address</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  id="reg-email"
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
              <label className="form-label" htmlFor="reg-password">Password (min 6 characters)</label>
              <div className="input-with-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FiLock className="input-icon" />
                <input
                  id="reg-password"
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



            <button type="submit" className="btn btn-primary register-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Registration...' : 'Request Credentials'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="register-form">
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
              <label className="form-label" htmlFor="otp-input">Verification Code</label>
              <input
                id="otp-input"
                type="text"
                className="form-input"
                placeholder="6-Digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                disabled={isSubmitting}
                required
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold' }}
              />
            </div>

            <button type="submit" className="btn btn-primary register-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Confirming OTP...' : 'Verify Identity'}
            </button>
          </form>
        )}

        <div className="register-footer">
          <span>Already registered?</span>{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Establish Secure Connection
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .register-wrapper {
          display: flex;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, hsl(222, 47%, 6%), hsl(222, 47%, 14%));
          padding: 16px;
        }

        .register-card {
          width: 100%;
          max-width: 480px;
          padding: 40px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }

        .register-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .register-logo {
          font-size: 3rem;
          color: var(--primary);
          margin-bottom: 12px;
          filter: drop-shadow(0 0 10px var(--primary-glow));
        }

        .register-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }

        .register-subtitle {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
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

        .register-btn {
          margin-top: 8px;
          padding: 14px;
          font-size: 1rem;
        }

        .otp-explanation {
          background: var(--primary-light);
          color: var(--primary);
          padding: 14px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          line-height: 1.5;
          border: 1px solid rgba(37, 99, 235, 0.15);
        }

        .check-icon {
          font-size: 1.3rem;
          flex-shrink: 0;
          margin-top: 2px;
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

        .register-footer {
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

export default RegisterPage;
