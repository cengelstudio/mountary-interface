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
  const [snapshots, setSnapshots] = useState<{filename: string, timestamp: string}[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [snapshotItems, setSnapshotItems] = useState<FileSystemItem[] | null>(null);
  const [snapshotPath, setSnapshotPath] = useState<string>('/');
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s: Socket = io(API_CONFIG.BASE_URL);
    setSocket(s);
    s.emit('get_disk_stats', id);
    s.emit('get_file_system', { diskId: id, path: currentPath });
    s.emit('get_snapshots', { diskId: id });

    s.on('disk_stats', (data: DiskStats) => setStats(data));
    s.on('file_system_update', (data: { path: string; items: FileSystemItem[] }) => {
      if (data.path === currentPath) setItems(data.items);
    });
    s.on('snapshots_list', (data: { snapshots: {filename: string, timestamp: string}[] }) => {
      setSnapshots(data.snapshots);
    });
    s.on('snapshot_contents', (data: { filename: string, contents: FileSystemItem[] }) => {
      setSnapshotItems(addFolderSizes(data.contents));
    });

    return () => { s.disconnect(); };
  }, [id, currentPath]);

  // Snapshot seçimi değiştiğinde içeriği çek
  useEffect(() => {
    if (selectedSnapshot && socket) {
      socket.emit('get_snapshot_contents', { diskId: id, filename: selectedSnapshot });
    } else {
      setSnapshotItems(null);
    }
  }, [selectedSnapshot, id, socket]);

  // Snapshot seçimi değiştiğinde path'i sıfırla
  useEffect(() => {
    if (selectedSnapshot) setSnapshotPath('/');
  }, [selectedSnapshot]);

  // Snapshot içeriği geldiğinde klasör boyutlarını hesapla
  function addFolderSizes(items: FileSystemItem[] | null): FileSystemItem[] {
    if (!items) return [];
    function calcSize(item: FileSystemItem): number {
      if (item.type === 'file') return item.size || 0;
      if ((item as any).contents) {
        const total = ((item as any).contents as FileSystemItem[]).reduce((sum, child) => sum + calcSize(child), 0);
        item.size = total;
        // Ayrıca alt klasörler için de uygula
        (item as any).contents = ((item as any).contents as FileSystemItem[]).map(calcFolder);
        return total;
      }
      item.size = 0;
      return 0;
    }
    function calcFolder(item: FileSystemItem): FileSystemItem {
      calcSize(item);
      return item;
    }
    return items.map(calcFolder);
  }

  // Snapshot modunda path'e göre içerik bulucu
  function findSnapshotItemsByPath(items: FileSystemItem[] | null, path: string): FileSystemItem[] {
    if (!items) return [];
    if (path === '/' || path === '') {
      // Kökteyken klasörler üstte olacak şekilde sırala
      const folders = items.filter(i => i.type === 'directory');
      const files = items.filter(i => i.type === 'file');
      return [...folders, ...files];
    }
    // path tam eşleşiyorsa, o dizinin contents'ini döndür
    function find(items: FileSystemItem[]): FileSystemItem[] | null {
      for (const item of items) {
        if (item.type === 'directory') {
          if (item.path === path) {
            const contents = (item as any).contents || [];
            const folders = contents.filter((i: FileSystemItem) => i.type === 'directory');
            const files = contents.filter((i: FileSystemItem) => i.type === 'file');
            return [...folders, ...files];
          }
          const found = find((item as any).contents || []);
          if (found) return found;
        }
      }
      return null;
    }
    return find(items) || [];
  }

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

  // Yardımcı fonksiyonlar: snapshotItems üzerinden istatistik hesaplama
  function calcStatsFromItems(items: FileSystemItem[]): {
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
    fileTypes: { [key: string]: { count: number; totalSize: number } };
    lastModifiedFile: FileSystemItem | null;
  } {
    let totalFiles = 0;
    let totalDirectories = 0;
    let totalSize = 0;
    let fileTypes: { [key: string]: { count: number; totalSize: number } } = {};
    let lastModifiedFile: FileSystemItem | null = null;
    function traverse(items: FileSystemItem[]) {
      for (const item of items) {
        if (item.type === 'file') {
          totalFiles++;
          totalSize += item.size || 0;
          const ext = item.name.split('.').pop()?.toLowerCase() || 'other';
          if (!fileTypes[ext]) fileTypes[ext] = { count: 0, totalSize: 0 };
          fileTypes[ext].count++;
          fileTypes[ext].totalSize += item.size || 0;
          if (!lastModifiedFile || (item.modifiedAt && lastModifiedFile.modifiedAt && new Date(item.modifiedAt) > new Date(lastModifiedFile.modifiedAt))) {
            lastModifiedFile = item;
          }
        } else if (item.type === 'directory' && (item as any).contents) {
          totalDirectories++;
          traverse((item as any).contents as FileSystemItem[]);
        }
      }
    }
    traverse(items);
    return { totalFiles, totalDirectories, totalSize, fileTypes, lastModifiedFile };
  }

  const snapshotStats = selectedSnapshot && snapshotItems && snapshotItems.length > 0 ? calcStatsFromItems(snapshotItems) : null;

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

        {/* Snapshot seçici */}
        <div className="disk-detail__snapshot-selector">
          <label htmlFor="snapshot-select">Snapshot:</label>
          <select
            id="snapshot-select"
            value={selectedSnapshot || ''}
            onChange={e => setSelectedSnapshot(e.target.value || null)}
          >
            <option value="">Canlı Disk</option>
            {snapshots.map(s => (
              <option key={s.filename} value={s.filename}>
                {s.timestamp}
              </option>
            ))}
          </select>
        </div>

        {/* Disk Stats Cards */}
        {!selectedSnapshot && (
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
                  <div className="content">
                    <div className="value">{formatBytes(stats?.totalSpace || 0)}</div>
                    <div className="label">Toplam Alan</div>
                  </div>
                </div>

                <div className="disk-stats-card green">
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="content">
                    <div className="value">{formatBytes(stats?.usedSpace || 0)}</div>
                    <div className="label">Kullanılan Alan</div>
                  </div>
                </div>

                <div className="disk-stats-card yellow">
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div className="content">
                    <div className="value">{stats?.totalFiles || 0}</div>
                    <div className="label">Toplam Dosya</div>
                  </div>
                </div>

                <div className="disk-stats-card red">
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div className="content">
                    <div className="value">{stats?.totalDirectories || 0}</div>
                    <div className="label">Toplam Klasör</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* File Explorer */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Dosya Gezgini</h2>
            {selectedSnapshot && (
              <div className="badge">Snapshot Görünümü</div>
            )}
          </div>
          <div className="file-explorer">
            <div className="file-explorer__header">
              <div className="breadcrumb">
                {currentPath.split('/').map((part, index, array) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="separator">/</span>}
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const newPath = array.slice(0, index + 1).join('/') || '/';
                        if (selectedSnapshot) {
                          setSnapshotPath(newPath);
                        } else {
                          setCurrentPath(newPath);
                        }
                      }}
                    >
                      {part || 'Root'}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="file-explorer__list">
              {(selectedSnapshot ? findSnapshotItemsByPath(snapshotItems, snapshotPath) : items).map((item, index) => (
                <div
                  key={index}
                  className={`item ${item.type === 'directory' ? 'directory' : ''}`}
                  onClick={() => item.type === 'directory' && handleFolderClick(item)}
                >
                  <div className="icon">
                    {getFileIcon(item)}
                  </div>
                  <div className="name">{item.name}</div>
                  <div className="size">{item.size !== undefined ? formatBytes(item.size) : '-'}</div>
                  <div className="date">
                    {item.modifiedAt ? formatDistanceToNow(new Date(item.modifiedAt), { addSuffix: true, locale: tr }) : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Stats */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Detaylı İstatistikler</h2>
          </div>
          <div className="dashboard__section-content">
            <div className="detailed-stats">
              <div className="detailed-stats__row">
                <div className="detailed-stats__item">
                  <div className="label">Toplam Dosya Sayısı</div>
                  <div className="value">
                    {selectedSnapshot
                      ? (snapshotStats ? snapshotStats.totalFiles : 0)
                      : (stats?.totalFiles ?? '-')}
                  </div>
                </div>
                <div className="detailed-stats__item">
                  <div className="label">Toplam Klasör Sayısı</div>
                  <div className="value">
                    {selectedSnapshot
                      ? (snapshotStats ? snapshotStats.totalDirectories : 0)
                      : (stats?.totalDirectories ?? '-')}
                  </div>
                </div>
              </div>

              {/* Son Değiştirilen Dosya */}
              {(selectedSnapshot ? (snapshotStats && snapshotStats.lastModifiedFile) : stats?.lastModifiedFile) && (
                <div className="detailed-stats__file-info">
                  <div className="name">
                    {selectedSnapshot
                      ? (snapshotStats?.lastModifiedFile?.name || '-')
                      : stats?.lastModifiedFile?.name}
                  </div>
                  <div className="details">
                    <span>
                      {(() => {
                        const dateStr = selectedSnapshot
                          ? snapshotStats?.lastModifiedFile?.modifiedAt
                          : stats?.lastModifiedFile?.modifiedAt;
                        if (!dateStr) return '-';
                        let dateObj = new Date(dateStr);
                        if (isNaN(dateObj.getTime())) {
                          dateObj = parse(dateStr, 'yyyy-MM-dd HH:mm:ss', new Date());
                        }
                        return isValid(dateObj)
                          ? formatDistanceToNow(dateObj, { addSuffix: true, locale: tr })
                          : '-';
                      })()}
                    </span>
                    <span className="separator">•</span>
                    <span>
                      {formatBytes(selectedSnapshot
                        ? (snapshotStats?.lastModifiedFile?.size || 0)
                        : stats?.lastModifiedFile?.size || 0)}
                    </span>
                    <span className="separator">•</span>
                    <span>
                      {selectedSnapshot
                        ? snapshotStats?.lastModifiedFile?.path
                        : stats?.lastModifiedFile?.path}
                    </span>
                  </div>
                </div>
              )}

              {/* Dosya Kategorileri */}
              {(selectedSnapshot ? !!snapshotStats : !!stats?.fileTypes) && (
                <div className="detailed-stats__categories">
                  {/* Video Dosyaları */}
                  <div className="detailed-stats__category">
                    <div className="header">
                      <h3>Video Dosyaları</h3>
                      <div className="info">
                        {(() => {
                          const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv'];
                          const fileTypes = selectedSnapshot
                            ? (snapshotStats?.fileTypes || {})
                            : (stats?.fileTypes || {});
                          const videoFiles = Object.entries(fileTypes)
                            .filter(([ext]) => videoExts.includes(ext.toLowerCase()));
                          const totalCount = videoFiles.reduce((sum, [_, info]) => sum + info.count, 0);
                          const totalSize = videoFiles.reduce((sum, [_, info]) => sum + info.totalSize, 0);
                          return (
                            <>
                              <span>{totalCount} dosya</span>
                              <span className="separator">•</span>
                              <span>{formatBytes(totalSize)}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="tags">
                      {(() => {
                        const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv'];
                        const fileTypes = selectedSnapshot
                          ? (snapshotStats?.fileTypes || {})
                          : (stats?.fileTypes || {});
                        return Object.entries(fileTypes)
                          .filter(([ext]) => videoExts.includes(ext.toLowerCase()))
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 3)
                          .map(([ext, info]) => (
                            <span key={ext} className="tag">
                              {ext.toUpperCase()} ({info.count})
                            </span>
                          ));
                      })()}
                    </div>
                  </div>

                  {/* Resim Dosyaları */}
                  <div className="detailed-stats__category">
                    <div className="header">
                      <h3>Resim Dosyaları</h3>
                      <div className="info">
                        {(() => {
                          const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                          const fileTypes = selectedSnapshot
                            ? (snapshotStats?.fileTypes || {})
                            : (stats?.fileTypes || {});
                          const imageFiles = Object.entries(fileTypes)
                            .filter(([ext]) => imageExts.includes(ext.toLowerCase()));
                          const totalCount = imageFiles.reduce((sum, [_, info]) => sum + info.count, 0);
                          const totalSize = imageFiles.reduce((sum, [_, info]) => sum + info.totalSize, 0);
                          return (
                            <>
                              <span>{totalCount} dosya</span>
                              <span className="separator">•</span>
                              <span>{formatBytes(totalSize)}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="tags">
                      {(() => {
                        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                        const fileTypes = selectedSnapshot
                          ? (snapshotStats?.fileTypes || {})
                          : (stats?.fileTypes || {});
                        return Object.entries(fileTypes)
                          .filter(([ext]) => imageExts.includes(ext.toLowerCase()))
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 3)
                          .map(([ext, info]) => (
                            <span key={ext} className="tag">
                              {ext.toUpperCase()} ({info.count})
                            </span>
                          ));
                      })()}
                    </div>
                  </div>

                  {/* Diğer Dosyalar */}
                  <div className="detailed-stats__category">
                    <div className="header">
                      <h3>Diğer Dosyalar</h3>
                      <div className="info">
                        {(() => {
                          const excludedExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
                          const fileTypes = selectedSnapshot
                            ? (snapshotStats?.fileTypes || {})
                            : (stats?.fileTypes || {});
                          const otherFiles = Object.entries(fileTypes)
                            .filter(([ext]) => !excludedExts.includes(ext.toLowerCase()));
                          const totalCount = otherFiles.reduce((sum, [_, info]) => sum + info.count, 0);
                          const totalSize = otherFiles.reduce((sum, [_, info]) => sum + info.totalSize, 0);
                          return (
                            <>
                              <span>{totalCount} dosya</span>
                              <span className="separator">•</span>
                              <span>{formatBytes(totalSize)}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="tags">
                      {(() => {
                        const excludedExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
                        const fileTypes = selectedSnapshot
                          ? (snapshotStats?.fileTypes || {})
                          : (stats?.fileTypes || {});
                        return Object.entries(fileTypes)
                          .filter(([ext]) => !excludedExts.includes(ext.toLowerCase()))
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 3)
                          .map(([ext, info]) => (
                            <span key={ext} className="tag">
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
