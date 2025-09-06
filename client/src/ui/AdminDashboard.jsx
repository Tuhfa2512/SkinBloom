import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../auth';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDermatologists: 0,
    totalTickets: 0,
    totalProducts: 0
  });
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadDashboardData();
    if (activeTab === 'categories') {
      loadCategoryData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      // Mock data for now
      setStats({
        totalUsers: 150,
        totalDermatologists: 12,
        totalTickets: 45,
        totalProducts: 89
      });
      
      setRecentUsers([
        { id: 1, name: 'John Doe', role: 'user', joinedAt: '2024-01-15' },
        { id: 2, name: 'Dr. Smith', role: 'dermatologist', joinedAt: '2024-01-14' },
        { id: 3, name: 'Jane Wilson', role: 'user', joinedAt: '2024-01-13' }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryData = async () => {
    try {
      const [categoriesRes, statsRes] = await Promise.all([
        API.get('/admin/categories'),
        API.get('/admin/categories/stats')
      ]);
      
      setCategories(categoriesRes.data.categories);
      setCategoryStats(statsRes.data.categoryStats);
    } catch (error) {
      console.error('Error loading category data:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await API.post('/admin/categories', {
        categoryName: newCategoryName.trim()
      });
      
      alert(response.data.message);
      setNewCategoryName('');
      loadCategoryData();
    } catch (error) {
      alert('Error adding category: ' + error.response?.data?.error);
    }
  };

  const renderOverview = () => (
    <div>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
          <h3 style={{ color: 'var(--primary-color)', fontSize: '24px', margin: 0 }}>
            {stats.totalUsers}
          </h3>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0 0' }}>Total Users</p>
        </div>

        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👨‍⚕️</div>
          <h3 style={{ color: 'var(--primary-color)', fontSize: '24px', margin: 0 }}>
            {stats.totalDermatologists}
          </h3>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0 0' }}>Dermatologists</p>
        </div>

        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎫</div>
          <h3 style={{ color: 'var(--primary-color)', fontSize: '24px', margin: 0 }}>
            {stats.totalTickets}
          </h3>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0 0' }}>Support Tickets</p>
        </div>

        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧴</div>
          <h3 style={{ color: 'var(--primary-color)', fontSize: '24px', margin: 0 }}>
            {stats.totalProducts}
          </h3>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0 0' }}>Products</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ color: 'var(--text-color)', marginBottom: '20px' }}>
          Recent Users
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', color: 'var(--text-color)' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: 'var(--text-color)' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: 'var(--text-color)' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 0', color: 'var(--text-color)' }}>{user.name}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: user.role === 'dermatologist' ? '#e0f2fe' : '#f3e8ff',
                      color: user.role === 'dermatologist' ? '#0369a1' : '#7c3aed'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', color: 'var(--muted)' }}>{user.joinedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div>
      {/* Add Category Form */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--text-color)', marginBottom: '20px' }}>
          Add New Category
        </h2>
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name (e.g., Anti-Aging)"
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Add Category
          </button>
        </form>
        <p style={{ color: 'var(--muted)', marginTop: '12px', fontSize: '14px' }}>
          Note: New categories require a schema update. This will provide instructions.
        </p>
      </div>

      {/* Category Statistics */}
      {categoryStats.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--text-color)', marginBottom: '20px' }}>
            Category Statistics
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: 'var(--text-color)' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: 'var(--text-color)' }}>Products</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: 'var(--text-color)' }}>Active</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: 'var(--text-color)' }}>Featured</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: 'var(--text-color)' }}>Avg Price</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: 'var(--text-color)' }}>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map(stat => (
                  <tr key={stat._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 0', color: 'var(--text-color)', fontWeight: '600' }}>
                      {stat._id}
                    </td>
                    <td style={{ padding: '12px 0', color: 'var(--text-color)' }}>
                      {stat.count}
                    </td>
                    <td style={{ padding: '12px 0', color: 'var(--text-color)' }}>
                      {stat.activeCount}
                    </td>
                    <td style={{ padding: '12px 0', color: 'var(--text-color)' }}>
                      {stat.featuredCount}
                    </td>
                    <td style={{ padding: '12px 0', color: 'var(--text-color)' }}>
                      ${stat.avgPrice?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '12px 0', color: 'var(--text-color)' }}>
                      {stat.avgRating?.toFixed(1) || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Current Categories */}
      {categories.length > 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ color: 'var(--text-color)', marginBottom: '20px' }}>
            Available Categories ({categories.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {categories.map(category => (
              <div
                key={category.name}
                style={{
                  padding: '12px 16px',
                  background: 'var(--card-background)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: 'var(--text-color)', fontWeight: '500' }}>
                  {category.name}
                </span>
                <span style={{
                  background: 'var(--primary-color)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {category.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          color: 'var(--text-color)',
          fontSize: '32px',
          marginBottom: '8px'
        }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '16px' }}>
          Welcome back, {user?.name}! Here's what's happening on SkinBloom.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '16px'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'categories', label: 'Categories', icon: '🏷️' },
            { id: 'products', label: 'Products', icon: '🧴' },
            { id: 'users', label: 'Users', icon: '👥' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'categories' && renderCategories()}
      {activeTab === 'products' && (
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <h2>Product Management</h2>
          <p>Product management features coming soon...</p>
        </div>
      )}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <h2>User Management</h2>
          <p>User management features coming soon...</p>
        </div>
      )}
    </div>
  );
}
