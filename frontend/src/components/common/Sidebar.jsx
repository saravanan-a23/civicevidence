import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiGrid, 
  FiFileText, 
  FiBriefcase, 
  FiShare2, 
  FiActivity, 
  FiBarChart2, 
  FiUsers, 
  FiSettings, 
  FiLogOut,
  FiShield
} from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiGrid />, roles: ['admin', 'officer', 'user'] },
    { path: '/evidence', label: 'Evidence Files', icon: <FiFileText />, roles: ['admin', 'officer', 'user'] },
    { path: '/cases', label: 'Case Management', icon: <FiBriefcase />, roles: ['admin', 'officer', 'user'] },
    { path: '/shares', label: 'Shared Links', icon: <FiShare2 />, roles: ['admin', 'officer', 'user'] },
    { path: '/audit-logs', label: 'Audit Trail', icon: <FiActivity />, roles: ['admin', 'officer'] },
    { path: '/analytics', label: 'Analytics', icon: <FiBarChart2 />, roles: ['admin', 'officer'] },
    { path: '/users', label: 'User Controls', icon: <FiUsers />, roles: ['admin'] },
    { path: '/settings', label: 'Settings', icon: <FiSettings />, roles: ['admin', 'officer', 'user'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar-container">
      <div className="sidebar-header">
        <FiShield className="logo-icon" />
        <span className="logo-text">CivicEvidence</span>
      </div>

      <nav className="sidebar-nav">
        {filteredItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="link-icon">{item.icon}</span>
            <span className="link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-preview">
          <div className="avatar-placeholder">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <div className="username-tag">{user?.name}</div>
            <div className="role-tag">{user?.role}</div>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={logout}>
          <FiLogOut />
          <span>Sign Out</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar-container {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--card-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          padding: 24px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }

        .logo-icon {
          font-size: 1.8rem;
          color: var(--primary);
        }

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.35rem;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-weight: 500;
          transition: var(--transition-fast);
        }

        .sidebar-link:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .sidebar-link.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .link-icon {
          font-size: 1.2rem;
          display: flex;
        }

        .sidebar-footer {
          margin-top: auto;
          border-top: 1px solid var(--card-border);
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .user-profile-preview {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--gradient-primary);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
        }

        .username-tag {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .role-tag {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .sidebar-logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: var(--danger);
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          width: 100%;
          text-align: left;
        }

        .sidebar-logout-btn:hover {
          background: var(--danger-light);
        }

        @media (max-width: 768px) {
          .sidebar-container {
            display: none; /* Hide on mobile/tablet for overlay/hamburger if needed */
          }
        }
      `}} />
    </aside>
  );
};

export default Sidebar;
