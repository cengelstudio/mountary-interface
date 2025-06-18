import React, { useEffect, useState } from 'react';
import { Disk, DiskUsage } from '../types/disk';
import { DiskCard } from '../components/DiskCard';
import { formatBytes } from '../utils/formatters';
import '../styles/dashboard.scss';
import { API_CONFIG } from '../config';
import { io, Socket } from 'socket.io-client';

const Dashboard: React.FC = () => {
  const [disks, setDisks] = useState<Disk[]>([]);

  useEffect(() => {
    const socket: Socket = io(API_CONFIG.BASE_URL);
    socket.on('all_disks', (allDisks: Disk[]) => {
      setDisks(allDisks);
    });
    socket.on('disk_update', (updatedDisk: Disk) => {
      setDisks(prevDisks => {
        const exists = prevDisks.some(d => d.id === updatedDisk.id);
        if (exists) {
          return prevDisks.map(d => d.id === updatedDisk.id ? updatedDisk : d);
        } else {
          return [...prevDisks, updatedDisk];
        }
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const diskUsage = React.useMemo(() => {
    const totalDisks = disks.length;
    const totalSpace = disks.reduce((sum, d) => sum + (d.totalSpace || 0), 0);
    const usedSpace = disks.reduce((sum, d) => sum + (d.usedSpace || 0), 0);
    const unusedDisks = disks.filter(d => !d.isActive).length;
    return { totalDisks, totalSpace, usedSpace, unusedDisks };
  }, [disks]);

  const getMostUsedDisks = () => {
    return [...disks]
      .sort((a, b) => (b.usedSpace / b.totalSpace) - (a.usedSpace / a.totalSpace))
      .slice(0, 3);
  };

  const getRecentlyUpdatedDisks = () => {
    return [...disks]
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 3);
  };

  const getUnusedDisks = () => {
    // 1GB = 1_073_741_824 byte
    return disks
      .filter(disk => disk.usedSpace < 1073741824)
      .sort((a, b) => a.usedSpace - b.usedSpace)
      .slice(0, 3);
  };

  const getAllDisksSorted = () => {
    return [...disks]
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  };

  return (
    <div className="dashboard">
      <div className="dashboard__container">
        <div className="dashboard__header">
          <h1>Disk Yönetimi</h1>
          <p>Tüm disklerinizin durumunu ve kullanımını buradan takip edebilirsiniz.</p>
        </div>

        {/* Disk Usage Overview */}
        <section className="dashboard__section">
          <div className="dashboard__section-header" style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
            <h2 style={{ flex: 'none' }}>Disk Kullanımı</h2>
            <span style={{ marginLeft: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563eb', color: 'white', borderRadius: '999px', padding: '2px 12px', fontSize: 14, fontWeight: 600, height: 24, minWidth: 28, lineHeight: 1 }}>{disks.length}</span>
          </div>
          <div className="dashboard__section-content">
            <div className="dashboard__stats">
              <div className="dashboard__stats-item dashboard__stats-item--blue">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div className="content">
                  <div className="value">{diskUsage.totalDisks}</div>
                  <div className="label">Toplam Disk</div>
                </div>
              </div>

              <div className="dashboard__stats-item dashboard__stats-item--green">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="content">
                  <div className="value">{formatBytes(diskUsage.totalSpace)}</div>
                  <div className="label">Toplam Alan</div>
                </div>
              </div>

              <div className="dashboard__stats-item dashboard__stats-item--yellow">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="content">
                  <div className="value">{formatBytes(diskUsage.usedSpace)}</div>
                  <div className="label">Kullanılan Alan</div>
                </div>
              </div>

              <div className="dashboard__stats-item dashboard__stats-item--red">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="content">
                  <div className="value">{diskUsage.unusedDisks}</div>
                  <div className="label">Kullanılmayan Disk</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Unused Disks */}
        <section className="dashboard__section">
          <div className="dashboard__section-header" style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
            <h2 style={{ flex: 'none' }}>Kullanılmayan Diskler</h2>
            <span style={{ marginLeft: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563eb', color: 'white', borderRadius: '999px', padding: '2px 12px', fontSize: 14, fontWeight: 600, height: 24, minWidth: 28, lineHeight: 1 }}>{disks.length}</span>
          </div>
          <div className="dashboard__section-content">
            <div className="dashboard__grid">
              {getUnusedDisks().map(disk => (
                <DiskCard key={disk.id} disk={disk} />
              ))}
            </div>
          </div>
        </section>

        {/* Most Used Disks */}
        <section className="dashboard__section">
          <div className="dashboard__section-header" style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
            <h2 style={{ flex: 'none' }}>En Dolu Diskler</h2>
            <span style={{ marginLeft: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563eb', color: 'white', borderRadius: '999px', padding: '2px 12px', fontSize: 14, fontWeight: 600, height: 24, minWidth: 28, lineHeight: 1 }}>{disks.length}</span>
          </div>
          <div className="dashboard__section-content">
            <div className="dashboard__grid">
              {getMostUsedDisks().map(disk => (
                <DiskCard key={disk.id} disk={disk} />
              ))}
            </div>
          </div>
        </section>

        {/* Recently Updated Disks */}
        <section className="dashboard__section">
          <div className="dashboard__section-header" style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
            <h2 style={{ flex: 'none' }}>En Son Değişiklik Yapılan Diskler</h2>
            <span style={{ marginLeft: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563eb', color: 'white', borderRadius: '999px', padding: '2px 12px', fontSize: 14, fontWeight: 600, height: 24, minWidth: 28, lineHeight: 1 }}>{disks.length}</span>
          </div>
          <div className="dashboard__section-content">
            <div className="dashboard__grid">
              {getRecentlyUpdatedDisks().map(disk => (
                <DiskCard key={disk.id} disk={disk} />
              ))}
            </div>
          </div>
        </section>

        {/* All Disks */}
        <section className="dashboard__section">
          <div className="dashboard__section-header" style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
            <h2 style={{ flex: 'none' }}>Tüm Diskler</h2>
            <span style={{ marginLeft: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563eb', color: 'white', borderRadius: '999px', padding: '2px 12px', fontSize: 14, fontWeight: 600, height: 24, minWidth: 28, lineHeight: 1 }}>{disks.length}</span>
          </div>
          <div className="dashboard__section-content">
            <div className="dashboard__grid">
              {getAllDisksSorted().map(disk => (
                <DiskCard key={disk.id} disk={disk} />
              ))}
            </div>
          </div>
        </section>

        {/* Suggestions Section */}
        <section className="dashboard__section">
          <div className="dashboard__section-header" style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
            <h2 style={{ flex: 'none' }}>Öneriler</h2>
            <div className="dashboard__suggestion-icon" style={{ marginLeft: 10 }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2563eb" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="dashboard__section-content" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              background: '#f8fafc',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2563eb" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <p style={{
              fontSize: '1.125rem',
              color: '#1e40af',
              fontWeight: '500',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.5'
            }}>
              Diskleri temizledikten sonra çöp kutusunu boşaltmayı unutmayın!
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
