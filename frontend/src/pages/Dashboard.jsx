import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { API_URL } from '../config';
import { 
  TrendingUp, TrendingDown, Clock, Download, 
  Activity, BarChart2, Award, Zap 
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  // Config & State
  const [mode, setMode] = useState('sandbox');
  const [refreshInterval, setRefreshInterval] = useState(2000); // 2s default
  const [isOnline, setIsOnline] = useState(true);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Market Data State
  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);

  // Animation triggers
  const [spotFlash, setSpotFlash] = useState('');
  const [futFlash, setFutFlash] = useState('');

  const intervalRef = useRef(null);

  // Fetch Quotes from Proxy Backend
  const fetchQuotes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/market/quotes?mode=${mode}`);
      if (!response.ok) {
        throw new Error('Failed to load market data');
      }
      
      const resData = await response.json();
      setIsOnline(true);
      setWarning(resData.warning || '');
      
      if (resData.data) {
        setPrevData(data);
        setData(resData.data);
      }
      setError('');
    } catch (err) {
      setIsOnline(false);
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  // Ticker Flashing Triggers
  useEffect(() => {
    if (data && prevData) {
      if (data.spotPrice > prevData.spotPrice) {
        setSpotFlash('flash-up');
      } else if (data.spotPrice < prevData.spotPrice) {
        setSpotFlash('flash-down');
      }

      if (data.futuresPrice > prevData.futuresPrice) {
        setFutFlash('flash-up');
      } else if (data.futuresPrice < prevData.futuresPrice) {
        setFutFlash('flash-down');
      }

      // Reset flash classes after animation completes (1s)
      const timer = setTimeout(() => {
        setSpotFlash('');
        setFutFlash('');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [data]);

  // Interval manager
  useEffect(() => {
    fetchQuotes(); // Initial load

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchQuotes, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mode, refreshInterval]);

  // Format Helper: Numbers
  const formatNum = (num) => {
    if (num === undefined || num === null) return '0.00';
    return Number(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format Helper: Timestamp
  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--:--';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Format Helper: Date for downloads
  const formatDateString = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export CSV Helper (Will connect to Stage 4 export logic)
  const handleExport = () => {
    if (!data) return;

    const timestamp = new Date(data.lastUpdated);
    const dateFormatted = timestamp.toISOString().split('T')[0];
    
    // Time formatting with AM/PM
    const timeFormatted = timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).replace(/[\s:]/g, '-');

    const filename = `Market_Data_${dateFormatted}_${timeFormatted}.csv`;

    const csvContent = [
      ['Market Data Report', 'Task 2 Real-Time Dashboard'],
      ['Exported At', timestamp.toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['NIFTY Spot Price', data.spotPrice],
      ['NIFTY Futures Price', data.futuresPrice],
      ['Open', data.open],
      ['High', data.high],
      ['Low', data.low],
      ['Close', data.close],
      ['Volume', data.volume],
      ['VWAP', data.vwap],
      ['Advances', data.advances],
      ['Declines', data.declines],
      ['Unchanged', data.unchanged],
      ['Market Breadth Ratio (A/D)', (data.advances / (data.declines || 1)).toFixed(2)]
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Derived metrics
  const changeVal = data ? parseFloat((data.spotPrice - data.close).toFixed(2)) : 0;
  const changePct = data ? parseFloat(((changeVal / data.close) * 100).toFixed(2)) : 0;
  const isUp = changeVal >= 0;
  const premium = data ? parseFloat((data.futuresPrice - data.spotPrice).toFixed(2)) : 0;

  return (
    <div className="dashboard-wrapper">
      <Header 
        mode={mode} 
        setMode={setMode} 
        refreshInterval={refreshInterval} 
        setRefreshInterval={setRefreshInterval} 
        isOnline={isOnline}
        warning={warning}
      />

      <main className="container main-content">
        {/* Connection/Error notifications */}
        {error && (
          <div className="error-alert">
            <Zap size={18} />
            <span>Connection Error: {error}. Trying to reconnect...</span>
          </div>
        )}

        {/* Dashboard Title & Last Updated Time */}
        <div className="page-heading">
          <div>
            <h1>Market Overview</h1>
            <p className="subtext">Real-time tracking of NIFTY indices and breadth metrics.</p>
          </div>

          <div className="update-status">
            <Clock size={16} />
            <span>Last tick: {data ? formatTime(data.lastUpdated) : '--:--:--'}</span>
            <button className="btn btn-secondary btn-icon" onClick={fetchQuotes} disabled={loading}>
              Manual Update
            </button>
            <button className="btn btn-primary" onClick={handleExport} disabled={!data}>
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <Activity className="pulse-icon" size={48} />
            <h3>Initializing Data Streams...</h3>
            <p>Connecting to market feeds and setting up indices...</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Widget 1: Spot Price Card */}
            <div className={`glass-panel metric-card ${spotFlash}`}>
              <div className="card-header">
                <h3>NIFTY 50 Index</h3>
                <span className="badge-tag">Spot</span>
              </div>
              <div className="card-body">
                <h2 className="price-text">{formatNum(data.spotPrice)}</h2>
                <div className={`change-indicator ${isUp ? 'up' : 'down'}`}>
                  {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{isUp ? '+' : ''}{formatNum(changeVal)} ({formatNum(changePct)}%)</span>
                </div>
              </div>
              <div className="card-footer">
                <div className="info-row">
                  <span>Prev. Close</span>
                  <strong>{formatNum(data.close)}</strong>
                </div>
              </div>
            </div>

            {/* Widget 2: Futures Price Card */}
            <div className={`glass-panel metric-card ${futFlash}`}>
              <div className="card-header">
                <h3>NIFTY Futures</h3>
                <span className="badge-tag">FUT</span>
              </div>
              <div className="card-body">
                <h2 className="price-text">{formatNum(data.futuresPrice)}</h2>
                <div className="futures-spread">
                  <span>Premium / Spread:</span>
                  <strong className={premium >= 0 ? 'text-up' : 'text-down'}>
                    +{formatNum(premium)} pts
                  </strong>
                </div>
              </div>
              <div className="card-footer">
                <div className="info-row">
                  <span>Basis Premium</span>
                  <strong>{formatNum((premium / data.spotPrice * 100))}%</strong>
                </div>
              </div>
            </div>

            {/* Widget 3: Market Stats Card */}
            <div className="glass-panel metric-card">
              <div className="card-header">
                <h3>Volume & VWAP</h3>
                <BarChart2 size={18} className="icon-muted" />
              </div>
              <div className="card-body">
                <div className="metric-row">
                  <div className="metric-sub">
                    <span className="label">VWAP</span>
                    <h2>{formatNum(data.vwap)}</h2>
                  </div>
                  <div className="metric-sub">
                    <span className="label">Volume</span>
                    <h2>{(data.volume / 1000000).toFixed(2)}M</h2>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <div className="info-row">
                  <span>Activity Status</span>
                  <strong className="text-up">Active Trading</strong>
                </div>
              </div>
            </div>

            {/* Widget 4: Market Breadth Card */}
            <div className="glass-panel metric-card breadth-card">
              <div className="card-header">
                <h3>NIFTY Breadth (50 Stocks)</h3>
                <Activity size={18} className="icon-muted" />
              </div>
              <div className="card-body">
                <div className="breadth-stats">
                  <div className="breadth-item up">
                    <span className="label">Advances</span>
                    <strong>{data.advances}</strong>
                  </div>
                  <div className="breadth-item flat">
                    <span className="label">Unchanged</span>
                    <strong>{data.unchanged}</strong>
                  </div>
                  <div className="breadth-item down">
                    <span className="label">Declines</span>
                    <strong>{data.declines}</strong>
                  </div>
                </div>
                
                {/* Horizontal ratio progress bar */}
                <div className="breadth-bar">
                  <div className="bar-segment advances" style={{ width: `${(data.advances/50)*100}%` }} title={`Advances: ${data.advances}`}></div>
                  <div className="bar-segment unchanged" style={{ width: `${(data.unchanged/50)*100}%` }} title={`Unchanged: ${data.unchanged}`}></div>
                  <div className="bar-segment declines" style={{ width: `${(data.declines/50)*100}%` }} title={`Declines: ${data.declines}`}></div>
                </div>
              </div>
              <div className="card-footer">
                <div className="info-row">
                  <span>A/D Ratio</span>
                  <strong>{(data.advances / (data.declines || 1)).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OHLC Table Panel */}
        {data && !loading && (
          <div className="glass-panel table-panel">
            <div className="panel-header">
              <h2>OHLC Session Data</h2>
              <p>Key intraday range statistics for the NIFTY Spot Index.</p>
            </div>
            <div className="table-responsive">
              <table className="ohlc-table">
                <thead>
                  <tr>
                    <th>Open Price</th>
                    <th>High (Day Max)</th>
                    <th>Low (Day Min)</th>
                    <th>Prev. Close</th>
                    <th>Intraday Range (Spread)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatNum(data.open)}</td>
                    <td className="text-up">{formatNum(data.high)}</td>
                    <td className="text-down">{formatNum(data.low)}</td>
                    <td>{formatNum(data.close)}</td>
                    <td>{formatNum(data.high - data.low)} pts</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Slider track visualization of current Spot price relative to High/Low */}
            <div className="session-progress">
              <span className="label">Daily Price Track (Low to High)</span>
              <div className="slider-track">
                <div className="slider-range-bar" style={{
                  left: '0%',
                  width: '100%'
                }}></div>
                <div className="slider-pointer" style={{
                  left: `${((data.spotPrice - data.low) / ((data.high - data.low) || 1)) * 100}%`
                }} title={`Current: ${data.spotPrice}`}>
                  <span className="pointer-label">{formatNum(data.spotPrice)}</span>
                </div>
              </div>
              <div className="track-bounds">
                <span>Low: {formatNum(data.low)}</span>
                <span>High: {formatNum(data.high)}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
