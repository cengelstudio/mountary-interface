import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Disk } from '../types/disk';
import { formatBytes } from '../utils/formatters';
import { formatDistanceToNow, isValid, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { API_CONFIG } from '../config';
import { io, Socket } from 'socket.io-client';
import './DiskDetail.scss';

interface FileSystemItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: string;
  path: string;
}

interface DiskStats {
  totalFiles: number;
  totalDirectories: number;
  largestFile: { name: string; size: number; path: string } | null;
  lastModifiedFile: { name: string; modifiedAt: string; path: string } | null;
  fileTypes: { [key: string]: { count: number; totalSize: number } };
  totalSpace: number;
  usedSpace: number;
  name: string;
}

const DiskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [stats, setStats] = useState<DiskStats | null>(null);

  useEffect(() => {
    const socket: Socket = io(API_CONFIG.BASE_URL);

    socket.emit('get_disk_stats', id);
    socket.emit('get_file_system', { diskId: id, path: currentPath });

    socket.on('disk_stats', (data: DiskStats) => setStats(data));
    socket.on('file_system_update', (data: { path: string; items: FileSystemItem[] }) => {
      if (data.path === currentPath) setItems(data.items);
    });

    return () => { socket.disconnect(); };
  }, [id, currentPath]);

  const handleFolderClick = (item: FileSystemItem) => {
    if (item.type === 'directory') setCurrentPath(item.path);
  };

  return (
    <div className="disk-detail">
      <div className="disk-detail__header">
        <h1>{stats?.name || 'Disk'}</h1>
        <p>Disk detayları ve dosya gezgini</p>
      </div>

      {/* Disk Stats Cards */}
      <section className="dashboard__section">
        <div className="dashboard__section-header">
          <h2>Disk İstatistikleri</h2>
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
                <div className="value">{stats ? formatBytes(stats.totalSpace) : '-'}</div>
                <div className="label">Toplam Alan</div>
              </div>
            </div>

            <div className="dashboard__stats-item dashboard__stats-item--green">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="content">
                <div className="value">{stats ? formatBytes(stats.usedSpace) : '-'}</div>
                <div className="label">Kullanılan Alan</div>
              </div>
            </div>

            <div className="dashboard__stats-item dashboard__stats-item--yellow">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="content">
                <div className="value">{stats ? formatBytes(stats.totalSpace - stats.usedSpace) : '-'}</div>
                <div className="label">Boş Alan</div>
              </div>
            </div>

            <div className="dashboard__stats-item dashboard__stats-item--red">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="content">
                <div className="value">{stats ? ((stats.usedSpace / stats.totalSpace) * 100).toFixed(1) + '%' : '-'}</div>
                <div className="label">Doluluk Oranı</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Stats */}
      <section className="dashboard__section">
        <div className="dashboard__section-header">
          <h2>Detaylı İstatistikler</h2>
        </div>
        <div className="dashboard__section-content">
          <div className="disk-stats">
            <div className="disk-stats__row">
              <div className="disk-stats__item">
                <div className="disk-stats__label">Toplam Dosya Sayısı</div>
                <div className="disk-stats__value">{stats?.totalFiles ?? '-'}</div>
              </div>
              <div className="disk-stats__item">
                <div className="disk-stats__label">Toplam Klasör Sayısı</div>
                <div className="disk-stats__value">{stats?.totalDirectories ?? '-'}</div>
              </div>
            </div>

            {stats?.largestFile && (
              <div className="disk-stats__section">
                <h3>En Büyük Dosya</h3>
                <div className="disk-stats__file-info">
                  <div className="disk-stats__file-name">{stats.largestFile.name}</div>
                  <div className="disk-stats__file-details">
                    <span>{formatBytes(stats.largestFile.size)}</span>
                    <span>•</span>
                    <span>{stats.largestFile.path}</span>
                  </div>
                </div>
              </div>
            )}

            {stats?.lastModifiedFile && (
              <div className="disk-stats__section">
                <h3>Son Değiştirilen Dosya</h3>
                <div className="disk-stats__file-info">
                  <div className="disk-stats__file-name">{stats.lastModifiedFile.name}</div>
                  <div className="disk-stats__file-details">
                    <span>
                      {(() => {
                        const dateStr = stats.lastModifiedFile.modifiedAt;
                        let dateObj = new Date(dateStr);
                        if (isNaN(dateObj.getTime())) {
                          dateObj = parse(dateStr, 'yyyy-MM-dd HH:mm:ss', new Date());
                        }
                        return isValid(dateObj)
                          ? formatDistanceToNow(dateObj, { addSuffix: true, locale: tr })
                          : '-';
                      })()}
                    </span>
                    <span>•</span>
                    <span>{stats.lastModifiedFile.path}</span>
                  </div>
                </div>
              </div>
            )}

            {stats?.fileTypes && (
              <div className="disk-stats__section">
                <h3>Dosya Türleri</h3>
                <div className="disk-stats__file-types">
                  {Object.entries(stats.fileTypes).map(([type, info]) => (
                    <div key={type} className="disk-stats__file-type">
                      <div className="disk-stats__file-type-header">
                        <span className="disk-stats__file-type-name">{type || 'Diğer'}</span>
                        <span className="disk-stats__file-type-count">{info.count} dosya</span>
                      </div>
                      <div className="disk-stats__file-type-size">
                        Toplam: {formatBytes(info.totalSize)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* File Explorer */}
      <section className="dashboard__section">
        <div className="dashboard__section-header">
          <h2>Dosya Gezgini</h2>
        </div>
        <div className="disk-detail__explorer">
          <div className="disk-detail__breadcrumbs">
            {currentPath.split('/').filter(Boolean).map((part, idx, arr) => (
              <span key={idx} onClick={() => setCurrentPath('/' + arr.slice(0, idx + 1).join('/'))}>
                {part} /
              </span>
            ))}
          </div>
          <table className="disk-detail__table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Tür</th>
                <th>Boyut</th>
                <th>Son Değişiklik</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.path} onClick={() => handleFolderClick(item)} className={item.type === 'directory' ? 'folder' : ''}>
                  <td>{item.name}</td>
                  <td>{item.type === 'directory' ? 'Klasör' : 'Dosya'}</td>
                  <td>{item.size ? formatBytes(item.size) : '-'}</td>
                  <td>
                    {item.modifiedAt
                      ? (() => {
                          let dateObj = new Date(item.modifiedAt);
                          if (isNaN(dateObj.getTime())) {
                            dateObj = parse(item.modifiedAt, 'yyyy-MM-dd HH:mm:ss', new Date());
                          }
                          return isValid(dateObj)
                            ? dateObj.toLocaleString()
                            : '-';
                        })()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DiskDetail;
