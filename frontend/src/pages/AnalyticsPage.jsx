import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiBarChart2, FiDatabase, FiAward, FiBriefcase, FiTrendingUp, FiDownload
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load system intelligence reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="System Intelligence Dashboard">
        <div className="loader-container">
          <div className="system-loader"></div>
          <span>Synthesizing system metadata reports...</span>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, categories, cases, monthlyUploads, officerActivity } = data || {};

  return (
    <DashboardLayout title="System Intelligence Dossier">
      {/* Counters summary */}
      <div className="grid-3">
        <div className="glass-card stat-card-long">
          <div className="stat-left">
            <FiDatabase className="stat-icon info" />
            <div className="stat-label-wrap">
              <span>Secure Storage Used</span>
              <h2>{summary?.totalStorageMb} MB</h2>
            </div>
          </div>
          <div className="stat-right">
            <span>Bytes: {summary?.totalStorageBytes.toLocaleString()} B</span>
          </div>
        </div>

        <div className="glass-card stat-card-long">
          <div className="stat-left">
            <FiBriefcase className="stat-icon warning" />
            <div className="stat-label-wrap">
              <span>Case-Linked Files Ratio</span>
              <h2>{(((summary?.totalEvidence || 0) / (summary?.totalCases || 1))).toFixed(1)} files/case</h2>
            </div>
          </div>
          <div className="stat-right">
            <span>Cases: {summary?.totalCases}</span>
          </div>
        </div>

        <div className="glass-card stat-card-long">
          <div className="stat-left">
            <FiBarChart2 className="stat-icon success" />
            <div className="stat-label-wrap">
              <span>Monthly upload velocity</span>
              <h2>{monthlyUploads?.[monthlyUploads.length - 1]?.uploads || 0} payloads</h2>
            </div>
          </div>
          <div className="stat-right">
            <span>Target: 50 max</span>
          </div>
        </div>
      </div>

      {/* Main timeline trends */}
      <div className="glass-card chart-card-large flex-col">
        <div className="chart-header">
          <h3 className="chart-title">Data Storage Timeline & Velocity Growth</h3>
          <p>Encrypted data payload footprint tracking (Megabytes) over the preceding six months</p>
        </div>

        <div className="chart-large-wrapper">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={monthlyUploads || []}>
              <defs>
                <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} unit=" MB" />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="sizeMb" name="Encrypted Footprint" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSize)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution charts grid */}
      <div className="grid-2">
        {/* Categories Bar Chart */}
        <div className="glass-card chart-card">
          <h3 className="chart-title">Evidence Category Footprint Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categories || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                <YAxis dataKey="category" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }} />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} name="Payloads count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Officer Activities */}
        <div className="glass-card flex-col">
          <h3 className="section-title"><FiAward /> Active Lead Officers Rank</h3>
          
          <div className="officer-list-rank">
            {officerActivity?.length === 0 ? (
              <div className="empty-message">No active officer records mapped.</div>
            ) : (
              officerActivity?.map((officer, index) => (
                <div key={officer.email} className="officer-rank-item">
                  <div className="rank-left">
                    <span className={`rank-num num-${index + 1}`}>{index + 1}</span>
                    <div className="officer-meta">
                      <span className="name">{officer.name}</span>
                      <span className="email">{officer.email}</span>
                    </div>
                  </div>
                  <span className="uploads-count-badge">
                    <strong>{officer.count}</strong> uploads
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .stat-card-long {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
        }

        .stat-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .stat-icon.info { background: var(--info-light); color: var(--info); }
        .stat-icon.warning { background: var(--warning-light); color: var(--warning); }
        .stat-icon.success { background: var(--success-light); color: var(--success); }

        .stat-label-wrap {
          display: flex;
          flex-direction: column;
        }

        .stat-label-wrap span {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
        }

        .stat-label-wrap h2 {
          font-size: 1.6rem;
          color: var(--text-primary);
        }

        .stat-right {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 700;
        }

        .chart-card-large {
          padding: 32px;
        }

        .chart-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .chart-header p {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .chart-large-wrapper {
          width: 100%;
          margin-top: 16px;
        }

        /* Officer lists rank styling */
        .officer-list-rank {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .officer-rank-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          border: 1px solid var(--card-border);
        }

        .rank-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .rank-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .rank-num.num-1 { background: var(--warning-light); color: var(--warning); }
        .rank-num.num-2 { background: var(--primary-light); color: var(--primary); }
        .rank-num.num-3 { background: var(--info-light); color: var(--info); }
        .rank-num.num-4, .rank-num.num-5 { background: var(--bg-primary); color: var(--text-secondary); }

        .officer-meta {
          display: flex;
          flex-direction: column;
        }

        .officer-meta .name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .officer-meta .email {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .uploads-count-badge {
          font-size: 0.85rem;
          color: var(--text-secondary);
          background: var(--bg-secondary);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 1px solid var(--card-border);
        }
      `}} />
    </DashboardLayout>
  );
};

export default AnalyticsPage;
