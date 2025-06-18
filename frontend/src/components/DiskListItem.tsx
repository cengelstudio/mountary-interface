import React from 'react';
import { Disk } from '../types/disk';
import { formatBytes } from '../utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface DiskListItemProps {
  disk: Disk;
}

export const DiskListItem: React.FC<DiskListItemProps> = ({ disk }) => {
  const navigate = useNavigate();
  const usedPercentage = (disk.usedSpace / disk.totalSpace) * 100;

  const getProgressClass = (percentage: number) => {
    if (percentage >= 90) return 'progress-bar--high';
    if (percentage >= 70) return 'progress-bar--medium';
    return 'progress-bar--low';
  };

  const handleClick = () => {
    navigate(`/disk/${disk.id}`);
  };

  return (
    <div
      className={`disk-list-item ${!disk.isActive ? 'disk-list-item--inactive' : ''}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="disk-list-item__icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      </div>

      <div className="disk-list-item__main">
        <div className="disk-list-item__name">{disk.name}</div>
        <div className={`disk-list-item__status ${!disk.isActive ? 'disk-list-item__status--inactive' : ''}`}>
          {disk.isActive ? 'Bağlı' : 'Bağlı Değil'}
        </div>
      </div>

      <div className="disk-list-item__space">
        <span className="disk-list-item__used">{formatBytes(disk.usedSpace)}</span>
        <span className="disk-list-item__divider">/</span>
        <span className="disk-list-item__total">{formatBytes(disk.totalSpace)}</span>
      </div>

      <div className="disk-list-item__progress">
        <div className={`progress-bar ${getProgressClass(usedPercentage)}`}>
          <div
            className="progress-bar__fill"
            style={{ width: `${usedPercentage}%` }}
          />
        </div>
        <div className="disk-list-item__percent">{usedPercentage.toFixed(1)}%</div>
      </div>

      <div className="disk-list-item__details">
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDistanceToNow(new Date(disk.lastUpdated), { addSuffix: true, locale: tr })}
        </span>
      </div>
    </div>
  );
};
