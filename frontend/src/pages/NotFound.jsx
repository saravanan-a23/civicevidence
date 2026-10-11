import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="error-page-wrapper">
      <div className="error-card glass-card">
        <FiAlertTriangle className="error-icon-warn" />
        <h1 className="error-title-warn">404</h1>
        <h3 className="error-subtitle">Dossier File Not Found</h3>
        <p className="error-text">
          The requested system node, case directory, or file resource does not exist in this database index.
        </p>
        <Link to="/dashboard" className="btn btn-primary error-btn">
          Return to Portal
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .error-page-wrapper {
          display: flex;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, hsl(222, 47%, 6%), hsl(222, 47%, 14%));
          padding: 16px;
        }

        .error-card {
          width: 100%;
          max-width: 460px;
          padding: 40px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .error-icon-warn {
          font-size: 4rem;
          color: var(--warning);
          filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.2));
        }

        .error-title-warn {
          font-size: 4.5rem;
          font-weight: 800;
          letter-spacing: -2px;
          background: var(--gradient-warning);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }

        .error-subtitle {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .error-text {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .error-btn {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
        }
      `}} />
    </div>
  );
};

export default NotFound;
