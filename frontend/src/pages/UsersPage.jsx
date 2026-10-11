import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiUsers, FiSearch, FiShield, FiUserCheck, FiUserMinus, FiClock 
} from 'react-icons/fi';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: {
          search,
          role: roleFilter,
          status: statusFilter,
        }
      });
      setUsers(res.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load user directories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const handleStatusChange = async (userId, userEmail, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = nextStatus === 'active' ? 'approve/activate' : 'deactivate';

    if (userId === currentUser._id) {
      toast.error('Security Protocol: You cannot deactivate your own Admin credentials.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${actionText} user account "${userEmail}"?`)) return;

    try {
      await api.put(`/users/${userId}/status`, { status: nextStatus });
      toast.success(`User status set to ${nextStatus}.`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
  };

  const handleRoleChange = async (userId, userEmail, nextRole) => {
    if (userId === currentUser._id) {
      toast.error('Security Protocol: You cannot demote yourself from Admin role.');
      return;
    }

    if (!window.confirm(`Are you sure you want to change user "${userEmail}" clearance level to "${nextRole.toUpperCase()}"?`)) {
      fetchUsers(); // reset UI dropdown
      return;
    }

    try {
      await api.put(`/users/${userId}/role`, { role: nextRole });
      toast.success(`User role updated to ${nextRole}.`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Role change failed.');
    }
  };

  return (
    <DashboardLayout title="Access Control Panel">
      {/* Filters box */}
      <div className="filter-panel glass-card">
        <div className="search-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="filters-group">
          {/* Role Filter */}
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)} 
            className="form-input filter-select"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="officer">Investigation Officer</option>
            <option value="user">Standard User</option>
          </select>

          {/* Status filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="form-input filter-select"
          >
            <option value="">All Statuses</option>
            <option value="active">Active / Approved</option>
            <option value="inactive">Inactive / Pending</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="glass-card flex-col">
        <h3 className="section-title"><FiUsers /> User Access Registry</h3>

        {loading ? (
          <div className="loader-container">
            <div className="system-loader"></div>
            <span>Syncing credentials catalog...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-message">No user credentials match current filters.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Clearance Level</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(item => {
                  const isSelf = item._id === currentUser._id;
                  return (
                    <tr key={item._id} className={isSelf ? 'self-tr' : ''}>
                      <td>
                        <div className="user-profile-td">
                          <div className="avatar-td">{item.name.charAt(0).toUpperCase()}</div>
                          <div className="info">
                            <strong>{item.name} {isSelf && <span className="self-label">(You)</span>}</strong>
                            <span>{item.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          value={item.role}
                          onChange={(e) => handleRoleChange(item._id, item.email, e.target.value)}
                          disabled={isSelf}
                          className="form-input role-select-td"
                        >
                          <option value="user">Standard User</option>
                          <option value="officer">Investigation Officer</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${item.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {item.status === 'active' ? 'Approved' : 'Pending Approval'}
                        </span>
                      </td>
                      <td>
                        <div className="time-td">
                          <FiClock /> {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleStatusChange(item._id, item.email, item.status)}
                          disabled={isSelf}
                          className={`btn btn-xs ${item.status === 'active' ? 'btn-outline' : 'btn-primary'}`}
                        >
                          {item.status === 'active' ? (
                            <><FiUserMinus /> Deactivate</>
                          ) : (
                            <><FiUserCheck /> Approve Account</>
                          )}
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
        .user-profile-td {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-td {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.95rem;
          border: 1px solid var(--card-border);
        }

        .user-profile-td .info {
          display: flex;
          flex-direction: column;
        }

        .user-profile-td .info strong {
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .self-label {
          font-size: 0.72rem;
          color: var(--primary);
          background: var(--primary-light);
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 6px;
        }

        .user-profile-td .info span {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .role-select-td {
          padding: 6px 12px;
          font-size: 0.85rem;
          background: var(--bg-secondary);
          width: fit-content;
          appearance: auto;
        }

        .time-td {
          font-size: 0.85rem;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .self-tr {
          background-color: rgba(37, 99, 235, 0.02) !important;
        }
      `}} />
    </DashboardLayout>
  );
};

export default UsersPage;
