import React from 'react';
import { Disk } from '../types/disk';
import { formatBytes, formatDate } from '../utils/formatters';
import '../styles/disk-card.scss';

interface DiskCardProps {
  disk: Disk;
}

export const DiskCard: React.FC<DiskCardProps> = ({ disk }) => {
  const usedPercentage = (disk.usedSpace / disk.totalSpace) * 100;
  const freeSpace = disk.totalSpace - disk.usedSpace;

  const getProgressClass = (percentage: number) => {
    if (percentage >= 90) return 'disk-card__progress-bar-fill--high';
    if (percentage >= 70) return 'disk-card__progress-bar-fill--medium';
    return 'disk-card__progress-bar-fill--low';
  };

  return (
    <div className="disk-card" style={{ opacity: disk.connected === false || (disk.connected === undefined && !disk.isActive) ? 0.8 : 1 }}>
      <div className="disk-card__content">
        <div className="disk-card__header">
          <div className={`disk-card__header-icon ${disk.isActive ? 'disk-card__header-icon--active' : 'disk-card__header-icon--inactive'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <div className="disk-card__header-info">
            <h3>{disk.name}</h3>
            <p>{disk.connected !== undefined && disk.connected !== null ? (disk.connected ? 'Bağlı' : 'Bağlı Değil') : (disk.isActive ? 'Bağlı' : 'Bağlı Değil')}</p>
          </div>
        </div>

        <div className="disk-card__progress">
          <div className="disk-card__progress-header">
            <span>Doluluk Oranı</span>
            <span>{usedPercentage.toFixed(1)}%</span>
          </div>
          <div className="disk-card__progress-bar">
            <div
              className={`disk-card__progress-bar-fill ${getProgressClass(usedPercentage)}`}
              style={{ width: `${usedPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="disk-card__details">
          <div className="disk-card__details-row">
            <span className="disk-card__details-row-label">Kullanılan:</span>
            <span className="disk-card__details-row-value">{formatBytes(disk.usedSpace)}</span>
          </div>
          <div className="disk-card__details-row">
            <span className="disk-card__details-row-label">Boş Alan:</span>
            <span className="disk-card__details-row-value">{formatBytes(freeSpace)}</span>
          </div>
          <div className="disk-card__details-row">
            <span className="disk-card__details-row-label">Toplam:</span>
            <span className="disk-card__details-row-value">{formatBytes(disk.totalSpace)}</span>
          </div>
        </div>

        <div className="disk-card__footer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Son güncelleme: {formatDate(disk.lastUpdated)}
        </div>
      </div>
    </div>
  );
};
