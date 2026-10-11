import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiFolder, 
  FiBriefcase, 
  FiUsers, 
  FiDatabase, 
  FiActivity, 
  FiUploadCloud,
  FiClock, 
  FiLock,
  FiFileText,
  FiCheckCircle
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const DashboardPage = () => {
  const { user, isAdmin, isOfficer } = useAuth();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [userEvidence, setUserEvidence] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (isAdmin || isOfficer) {
          const response = await api.get('/analytics');
          setAnalyticsData(response.data);
        } else {
          // Standard User: load their evidence files list
          const response = await api.get('/evidence?limit=5');
          setUserEvidence(response.data.evidence || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard parameters.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin, isOfficer]);

  if (loading) {
    return (
      <DashboardLayout title="System Dashboard">
        <div className="loader-container">
          <div className="system-loader"></div>
          <span>Loading secure parameters...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Render Standard User Dashboard
  if (!isAdmin && !isOfficer) {
    return (
      <DashboardLayout title="My Investigator Sandbox">
        <div className="welcome-banner glass-card">
          <div className="welcome-text">
            <h2>Welcome back, {user?.name}</h2>
            <p>You have access to view and manage your authorized case materials and secure uploads.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/evidence')}>
            <FiUploadCloud /> Upload Evidence
          </button>
        </div>

        <div className="grid-2">
          {/* Recent Uploads */}
          <div className="glass-card flex-col">
            <h3 className="section-title"><FiFileText /> My Recent Uploads</h3>
            <div className="list-container">
              {userEvidence.length === 0 ? (
                <div className="empty-message">No files uploaded yet. Click upload to store evidence securely.</div>
              ) : (
                userEvidence.map(item => (
                  <div key={item._id} className="list-item">
                    <div className="item-left">
                      <FiLock className="item-icon-security" />
                      <div className="item-details">
                        <Link to={`/evidence/${item._id}`} className="item-link">{item.title}</Link>
                        <span>{item.originalFilename} • {(item.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <span className="item-time">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Secure Instructions */}
          <div className="glass-card flex-col">
            <h3 className="section-title"><FiShieldAlertIcon /> Standard Access Protocol</h3>
            <div className="guidelines-list">
              <div className="guideline-item">
                <FiCheckCircle className="check" />
                <div>
                  <strong>End-to-End Encryption</strong>
                  <p>All files are automatically hashed (SHA-256) and encrypted (AES-256) before leaving this browser sandbox.</p>
                </div>
              </div>
              <div className="guideline-item">
                <FiCheckCircle className="check" />
                <div>
                  <strong>Chain of Custody</strong>
                  <p>Every view, download, or edit is registered permanently on the system audit logs.</p>
                </div>
              </div>
              <div className="guideline-item">
                <FiCheckCircle className="check" />
                <div>
                  <strong>Shared Permissions</strong>
                  <p>To view items shared by other officers, click on <em>Shared Links</em> on the sidebar.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render Admin / Officer Dashboard
  const { summary, categories, cases, monthlyUploads, recentActivities } = analyticsData || {};

  return (
    <DashboardLayout title="System Administration Dashboard">
      {/* Counters Grid */}
      <div className="grid-4">
        <div className="glass-card counter-card">
          <div className="counter-icon-wrap primary">
            <FiFileText />
          </div>
          <div className="counter-info">
            <span className="counter-label">Evidence Files</span>
            <h2 className="counter-val">{summary?.totalEvidence}</h2>
          </div>
        </div>

        <div className="glass-card counter-card">
          <div className="counter-icon-wrap success">
            <FiBriefcase />
          </div>
          <div className="counter-info">
            <span className="counter-label">Active Cases</span>
            <h2 className="counter-val">{summary?.totalCases}</h2>
          </div>
        </div>

        <div className="glass-card counter-card">
          <div className="counter-icon-wrap warning">
            <FiUsers />
          </div>
          <div className="counter-info">
            <span className="counter-label">System Users</span>
            <h2 className="counter-val">{summary?.totalUsers}</h2>
          </div>
        </div>

        <div className="glass-card counter-card">
          <div className="counter-icon-wrap danger">
            <FiDatabase />
          </div>
          <div className="counter-info">
            <span className="counter-label">Encrypted Storage</span>
            <h2 className="counter-val">{summary?.totalStorageMb} MB</h2>
          </div>
        </div>
      </div>

      {/* Visualizations Row */}
      <div className="grid-3 charts-row">
        {/* Upload Timeline Area Chart */}
        <div className="glass-card chart-card span-2">
          <h3 className="chart-title">Upload Trends (Last 6 Months)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyUploads || []}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="uploads" name="Uploads Count" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evidence Category Pie Chart */}
        <div className="glass-card chart-card">
          <h3 className="chart-title">Evidence by Type</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categories || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                  fontSize={10}
                >
                  {(categories || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2 logs-section">
        {/* Cases Distribution Bar Chart */}
        <div className="glass-card chart-card">
          <h3 className="chart-title">Case Status Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cases || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="status" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]}>
                  {(cases || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'open' ? '#3B82F6' : entry.status === 'closed' ? '#10B981' : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Activity Feed */}
        <div className="glass-card flex-col">
          <h3 className="section-title"><FiActivity /> System Chain of Custody Feed</h3>
          <div className="list-container activity-feed">
            {recentActivities?.length === 0 ? (
              <div className="empty-message">No activities logged yet.</div>
            ) : (
              recentActivities?.map(log => (
                <div key={log._id} className="activity-item">
                  <span className={`status-marker ${log.status}`}></span>
                  <div className="activity-details">
                    <p>
                      <strong>{log.user ? log.user.name : 'SYSTEM'}</strong> {log.details}
                    </p>
                    <div className="activity-meta">
                      <span>{log.ipAddress}</span>
                      <span>•</span>
                      <span><FiClock /> {new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Quick Icons stubs
const FiShieldAlertIcon = () => <FiUsers style={{ color: 'var(--primary)' }} />;

export default DashboardPage;
