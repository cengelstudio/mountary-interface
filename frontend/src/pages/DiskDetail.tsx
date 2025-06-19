import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  lastModifiedFile: {
    name: string;
    modifiedAt: string;
    path: string;
    size: number;
  } | null;
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
  const navigate = useNavigate();

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

  const getFileIcon = (item: FileSystemItem) => {
    if (item.type === 'directory') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    }

    const extension = item.name.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension || '')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      );
    }

    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <div className="disk-detail">
      <div className="disk-detail__container">
        <div className="disk-detail__header">
          <h1>{stats?.name || 'Disk'}</h1>
          <p>Disk detayları ve dosya gezgini</p>
          <button
            onClick={() => navigate(-1)}
            className="disk-detail__back-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Geri Dön</span>
          </button>
        </div>

        {/* Disk Stats Cards */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Disk İstatistikleri</h2>
          </div>
          <div className="dashboard__section-content">
            <div className="disk-stats-cards">
              <div className="disk-stats-card blue">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div className="info">
                  <div className="value">{stats ? formatBytes(stats.totalSpace) : '-'}</div>
                  <div className="label">Toplam Alan</div>
                </div>
              </div>
              <div className="disk-stats-card green">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="info">
                  <div className="value">{stats ? formatBytes(stats.usedSpace) : '-'}</div>
                  <div className="label">Kullanılan Alan</div>
                </div>
              </div>
              <div className="disk-stats-card yellow">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="info">
                  <div className="value">{stats ? formatBytes(stats.totalSpace - stats.usedSpace) : '-'}</div>
                  <div className="label">Boş Alan</div>
                </div>
              </div>
              <div className="disk-stats-card red">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="info">
                  <div className="value">{stats ? ((stats.usedSpace / stats.totalSpace) * 100).toFixed(1) + '%' : '-'}</div>
                  <div className="label">Doluluk Oranı</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* File Explorer */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Dosya Gezgini</h2>
            <span className="badge">{items.length} öğe</span>
          </div>
          <div className="dashboard__section-content">
            <div className="file-explorer">
              <div className="file-explorer__breadcrumb">
                <React.Fragment>
                  <button
                    onClick={() => setCurrentPath("/")}
                    className={currentPath === "/" ? "active" : ""}
                  >
                    Root
                  </button>
                  {(() => {
                    const parts = currentPath.split("/").filter(Boolean);
                    let displayParts = parts;
                    let baseIndex = 0;
                    if (parts[0] === "Volumes" && parts.length > 2) {
                      displayParts = parts.slice(2);
                      baseIndex = 2;
                    }
                    return displayParts.map((part, index) => {
                      const fullPath = '/' + parts.slice(0, baseIndex + index + 1).join('/');
                      return (
                        <React.Fragment key={fullPath}>
                          <span className="separator">/</span>
                          <button
                            onClick={() => setCurrentPath(fullPath)}
                            className={fullPath === currentPath ? "active" : ""}
                          >
                            {part}
                          </button>
                        </React.Fragment>
                      );
                    });
                  })()}
                </React.Fragment>
              </div>
              <div className="file-explorer__header">
                <div className="file-explorer__column file-explorer__column--name">İsim</div>
                <div className="file-explorer__column file-explorer__column--size">Boyut</div>
                <div className="file-explorer__column file-explorer__column--modified">Son Değişiklik</div>
              </div>
              <div className="file-explorer__content">
                {items.map((item) => (
                  <div
                    key={item.path}
                    className="file-explorer__item"
                    onClick={() => item.type === 'directory' && handleFolderClick(item)}
                  >
                    <div className="icon">
                      {getFileIcon(item)}
                    </div>
                    <div className="file-explorer__column file-explorer__column--name">
                      {item.name}
                    </div>
                    <div className="file-explorer__column file-explorer__column--size">
                      {formatBytes(item.size || 0)}
                    </div>
                    <div className="file-explorer__column file-explorer__column--modified">
                      {item.modifiedAt ? formatDistanceToNow(new Date(item.modifiedAt), { addSuffix: true, locale: tr }) : '-'}
                    </div>
                  </div>
                ))}
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
                      <span>{formatBytes(stats.lastModifiedFile.size || 0)}</span>
                      <span>•</span>
                      <span>{stats.lastModifiedFile.path}</span>
                    </div>
                  </div>
                </div>
              )}

              {stats?.fileTypes && (
                <div className="disk-stats__categories">
                  <div className="disk-stats__category">
                    <div className="disk-stats__category-header">
                      <h3>Video Dosyaları</h3>
                      <div className="disk-stats__category-info">
                        {(() => {
                          const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv'];
                          const videoFiles = Object.entries(stats.fileTypes)
                            .filter(([ext]) => videoExts.includes(ext.toLowerCase()));
                          const totalCount = videoFiles.reduce((sum, [_, info]) => sum + info.count, 0);
                          const totalSize = videoFiles.reduce((sum, [_, info]) => sum + info.totalSize, 0);
                          return (
                            <>
                              <span>{totalCount} dosya</span>
                              <span>•</span>
                              <span>{formatBytes(totalSize)}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="disk-stats__category-tags">
                      {(() => {
                        const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv'];
                        return Object.entries(stats.fileTypes)
                          .filter(([ext]) => videoExts.includes(ext.toLowerCase()))
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 3)
                          .map(([ext, info]) => (
                            <span key={ext} className="disk-stats__tag">
                              {ext.toUpperCase()} ({info.count})
                            </span>
                          ));
                      })()}
                    </div>
                  </div>

                  <div className="disk-stats__category">
                    <div className="disk-stats__category-header">
                      <h3>Resim Dosyaları</h3>
                      <div className="disk-stats__category-info">
                        {(() => {
                          const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                          const imageFiles = Object.entries(stats.fileTypes)
                            .filter(([ext]) => imageExts.includes(ext.toLowerCase()));
                          const totalCount = imageFiles.reduce((sum, [_, info]) => sum + info.count, 0);
                          const totalSize = imageFiles.reduce((sum, [_, info]) => sum + info.totalSize, 0);
                          return (
                            <>
                              <span>{totalCount} dosya</span>
                              <span>•</span>
                              <span>{formatBytes(totalSize)}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="disk-stats__category-tags">
                      {(() => {
                        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                        return Object.entries(stats.fileTypes)
                          .filter(([ext]) => imageExts.includes(ext.toLowerCase()))
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 3)
                          .map(([ext, info]) => (
                            <span key={ext} className="disk-stats__tag">
                              {ext.toUpperCase()} ({info.count})
                            </span>
                          ));
                      })()}
                    </div>
                  </div>

                  <div className="disk-stats__category">
                    <div className="disk-stats__category-header">
                      <h3>Diğer Dosyalar</h3>
                      <div className="disk-stats__category-info">
                        {(() => {
                          const excludedExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
                          const otherFiles = Object.entries(stats.fileTypes)
                            .filter(([ext]) => !excludedExts.includes(ext.toLowerCase()));
                          const totalCount = otherFiles.reduce((sum, [_, info]) => sum + info.count, 0);
                          const totalSize = otherFiles.reduce((sum, [_, info]) => sum + info.totalSize, 0);
                          return (
                            <>
                              <span>{totalCount} dosya</span>
                              <span>•</span>
                              <span>{formatBytes(totalSize)}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="disk-stats__category-tags">
                      {(() => {
                        const excludedExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
                        return Object.entries(stats.fileTypes)
                          .filter(([ext]) => !excludedExts.includes(ext.toLowerCase()))
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 3)
                          .map(([ext, info]) => (
                            <span key={ext} className="disk-stats__tag">
                              {ext.toUpperCase()} ({info.count})
                            </span>
                          ));
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DiskDetail;
