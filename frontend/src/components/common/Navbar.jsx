import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon, FiShield } from 'react-icons/fi';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <h2 className="navbar-title">{title || 'CivicEvidence Portal'}</h2>
      </div>

      <div className="navbar-right">
        {/* Connection status indicator */}
        <div className="system-status-indicator">
          <span className="status-dot"></span>
          <span className="status-text">SECURE SHELL</span>
        </div>

        {/* Theme Toggle */}
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme mode">
          {isDarkMode ? <FiSun /> : <FiMoon />}
        </button>

        {/* User Identity Badge */}
        <div className="user-identity-badge">
          <FiShield className="shield-icon" />
          <span className="user-role-badge">{user?.role?.toUpperCase()}</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--card-border);
          position: sticky;
          top: 0;
          background: rgba(var(--bg-primary), 0.8);
          backdrop-filter: blur(10px);
          z-index: 10;
        }

        .navbar-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .system-status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--card-border);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--success);
          letter-spacing: 0.5px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 8px var(--success);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 12px var(--success); }
          100% { transform: scale(0.95); opacity: 0.8; }
        }

        .theme-toggle-btn {
          background: var(--bg-secondary);
          border: 1px solid var(--card-border);
          color: var(--text-primary);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.1rem;
          transition: var(--transition-fast);
        }

        .theme-toggle-btn:hover {
          background: var(--bg-tertiary);
          transform: rotate(15deg);
        }

        .user-identity-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--primary-light);
          color: var(--primary);
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 0.8rem;
          border: 1px solid rgba(37, 99, 235, 0.15);
        }

        .shield-icon {
          font-size: 0.95rem;
        }

        @media (max-width: 576px) {
          .system-status-indicator {
            display: none;
          }
        }
      `}} />
    </header>
  );
};

export default Navbar;
