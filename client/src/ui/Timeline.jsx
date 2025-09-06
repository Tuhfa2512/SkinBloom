import React, { useEffect, useState, useMemo } from 'react'
import API from '../auth'

export default function Timeline() {
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('chart')
  const [dateRange, setDateRange] = useState('30') // days

  useEffect(() => {
    loadTimeline()
  }, [dateRange])

  const loadTimeline = async () => {
    setLoading(true)
    try {
      const { data } = await API.get(`/timeline?days=${dateRange}`)
      setTimeline(data.timeline || [])
    } catch (error) {
      console.error('Error loading timeline:', error)
      setTimeline([])
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
  if (score >= 8) { return '#10b981' } // Green
  if (score >= 6) { return '#f59e0b' } // Yellow
  if (score >= 4) { return '#f97316' } // Orange
    return '#ef4444' // Red
  }

  const getScoreLabel = (score) => {
  if (score >= 8) { return 'Excellent' }
  if (score >= 6) { return 'Good' }
  if (score >= 4) { return 'Fair' }
    return 'Needs Attention'
  }

  const getProgressIcon = (current, previous) => {
  if (current > previous) { return '📈' }
  if (current < previous) { return '📉' }
    return '➡️'
  }

  const calculateAverage = () => {
  if (timeline.length === 0) { return 0 }
    const sum = timeline.reduce((acc, entry) => acc + (entry.score || 0), 0)
    return (sum / timeline.length).toFixed(1)
  }

  const getTrend = () => {
  if (timeline.length < 2) { return null }
    const recent = timeline.slice(-7) // Last 7 entries
    const older = timeline.slice(-14, -7) // Previous 7 entries
    
  if (recent.length === 0 || older.length === 0) { return null }
    
    const recentAvg = recent.reduce((acc, entry) => acc + entry.score, 0) / recent.length
    const olderAvg = older.reduce((acc, entry) => acc + entry.score, 0) / older.length
    
    const diff = recentAvg - olderAvg
  if (Math.abs(diff) < 0.5) { return 'stable' }
    return diff > 0 ? 'improving' : 'declining'
  }

  const trend = getTrend()

  // Aggregate multiple entries from the same calendar day (prevent overlapping bars)
  const dailyTimeline = useMemo(() => {
  if (!timeline?.length) { return [] }
    const map = new Map()
    timeline.forEach(entry => {
      const d = new Date(entry.date)
      const key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate()
      if (!map.has(key)) {
        map.set(key, { date: d, scores: [entry.score || 0], notes: [entry.notes].filter(Boolean) })
      } else {
        const obj = map.get(key)
        obj.scores.push(entry.score || 0)
  if (entry.notes) { obj.notes.push(entry.notes) }
      }
    })
    // Convert to array: use average score for the day; concatenate distinct notes
    const arr = Array.from(map.values()).map(o => ({
      date: o.date,
      score: o.scores.reduce((a,b)=>a+b,0)/o.scores.length,
      notes: o.notes.join(' | ')
    }))
    // Sort ascending by date
    arr.sort((a,b)=>a.date - b.date)
    return arr
  }, [timeline])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#6b7280' }}>Loading your progress timeline...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          Skin Progress Timeline
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#6b7280',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Track your skin health journey and see your progress over time
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Time Range:
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('chart')}
            style={{
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: viewMode === 'chart' ? '#3b82f6' : 'white',
              color: viewMode === 'chart' ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📊 Chart View
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: viewMode === 'list' ? '#3b82f6' : 'white',
              color: viewMode === 'list' ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📋 List View
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '4px'
          }}>
            {calculateAverage()}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Average Score
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: trend === 'improving' ? '#10b981' : trend === 'declining' ? '#ef4444' : '#6b7280',
            marginBottom: '4px'
          }}>
            {trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable'}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Trend
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '4px'
          }}>
            {timeline.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Total Entries
          </div>
        </div>

        {timeline.length > 0 && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #f3f4f6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: getScoreColor(timeline[timeline.length - 1]?.score || 0),
              marginBottom: '4px'
            }}>
              {timeline[timeline.length - 1]?.score || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Latest Score
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {timeline.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '60px',
          border: '1px solid #f3f4f6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📈</div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#1f2937'
          }}>
            No Progress Data Yet
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Start logging your routine and skin condition to see your progress timeline
          </p>
          <button
            onClick={() => window.location.href = '/routine'}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📝 Start Logging
          </button>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid #f3f4f6',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          {viewMode === 'chart' ? (
            // Simple Chart Visualization
            <div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '20px'
              }}>
                Progress Chart
              </h3>
              <div style={{
                position: 'relative',
                height: '280px',
                padding: '20px 0',
                borderBottom: '2px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                {/* Chart container */}
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: dailyTimeline.length > 15 ? 'flex-start' : 'center',
                  gap: dailyTimeline.length > 30 ? '2px' : dailyTimeline.length > 15 ? '4px' : '8px',
                  height: '200px',
                  overflowX: dailyTimeline.length > 15 ? 'auto' : 'visible',
                  paddingBottom: '60px' // Space for rotated labels
                }}>
                  {dailyTimeline.map((entry, index) => {
                    const height = Math.max((entry.score / 10) * 160, 4) // Minimum 4px height
                    const barWidth = dailyTimeline.length > 30 ? '12px' : 
                                   dailyTimeline.length > 15 ? '20px' : '32px'
                    
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative',
                          minWidth: barWidth,
                          width: barWidth
                        }}
                      >
                        {/* Score value on top of bar */}
                        <div style={{
                          fontSize: '10px',
                          color: '#374151',
                          fontWeight: '600',
                          marginBottom: '4px',
                          position: 'absolute',
                          top: `-${height + 20}px`,
                          whiteSpace: 'nowrap'
                        }}>
                          {entry.score.toFixed(1)}
                        </div>
                        
                        {/* Bar */}
                        <div
                          style={{
                            background: getScoreColor(entry.score),
                            width: '100%',
                            height: `${height}px`,
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                          title={`${new Date(entry.date).toLocaleDateString()}: ${entry.score.toFixed(1)}/10`}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = '0.8'
                            e.target.style.transform = 'scaleY(1.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = '1'
                            e.target.style.transform = 'scaleY(1)'
                          }}
                        />
                        
                        {/* Date label */}
                        <div style={{
                          position: 'absolute',
                          bottom: '-50px',
                          fontSize: '9px',
                          color: '#6b7280',
                          transform: 'rotate(-45deg)',
                          transformOrigin: 'center center',
                          whiteSpace: 'nowrap',
                          left: '50%',
                          marginLeft: '-15px',
                          width: '30px',
                          textAlign: 'center'
                        }}>
                          {new Date(entry.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Y-axis labels */}
                <div style={{
                  position: 'absolute',
                  left: '-10px',
                  top: '20px',
                  height: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}>
                  {[10, 8, 6, 4, 2, 0].map(value => (
                    <div key={value} style={{
                      fontSize: '10px',
                      color: '#9ca3af',
                      fontWeight: '500'
                    }}>
                      {value}
                    </div>
                  ))}
                </div>
                
                {/* Grid lines */}
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '20px',
                  right: '0',
                  height: '200px',
                  pointerEvents: 'none'
                }}>
                  {[0, 2, 4, 6, 8, 10].map(value => (
                    <div key={value} style={{
                      position: 'absolute',
                      bottom: `${(value / 10) * 200}px`,
                      left: '0',
                      right: '0',
                      height: '1px',
                      background: value === 0 ? '#e5e7eb' : '#f3f4f6',
                      opacity: 0.5
                    }} />
                  ))}
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '12px',
                  color: '#64748b'
                }}>
                  <span style={{ fontWeight: '600' }}>Score Range: 0-10</span>
                  <span>•</span>
                  <span>Higher is better</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      background: '#10b981',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ color: '#64748b' }}>Excellent (8-10)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      background: '#f59e0b',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ color: '#64748b' }}>Good (6-8)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      background: '#f97316',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ color: '#64748b' }}>Fair (4-6)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      background: '#ef4444',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ color: '#64748b' }}>Needs Attention (0-4)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // List View
            <div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '20px'
              }}>
                Progress History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {timeline.map((entry, index) => {
                  const previousEntry = timeline[index - 1]
                  const progressIcon = previousEntry ? getProgressIcon(entry.score, previousEntry.score) : '📊'
                  
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #f3f4f6'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>{progressIcon}</span>
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1f2937'
                          }}>
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {entry.notes && (
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              marginTop: '2px'
                            }}>
                              {entry.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          background: `${getScoreColor(entry.score)}20`,
                          color: getScoreColor(entry.score),
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getScoreLabel(entry.score)}
                        </span>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: getScoreColor(entry.score),
                          minWidth: '40px',
                          textAlign: 'center'
                        }}>
                          {entry.score}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
