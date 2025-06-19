import React, { useEffect, useState } from 'react';
import { Disk } from '../types/disk';
import { DiskListItem } from '../components/DiskListItem';
import { formatBytes } from '../utils/formatters';
import { API_CONFIG } from '../config';
import { io, Socket } from 'socket.io-client';
import '../styles/dashboard.scss';

const Disks: React.FC = () => {
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

  return (
    <div className="dashboard">
      <div className="dashboard__container">
        <div className="dashboard__header">
          <h1>Diskler</h1>
          <p>Tüm disklerinizin durumunu ve kullanımını buradan takip edebilirsiniz.</p>
        </div>

        {/* Disk Usage Overview */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2>Disk Kullanımı</h2>
              <span className="dashboard__badge">{disks.length}</span>
            </div>
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

        {/* Disk List */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2>Tüm Diskler</h2>
              <span className="dashboard__badge">{disks.length}</span>
            </div>
          </div>
          <div className="dashboard__section-content">
            <div className="disk-list">
              {disks.map(disk => (
                <DiskListItem key={disk.id} disk={disk} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Disks;
