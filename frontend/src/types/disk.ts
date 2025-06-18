export interface Disk {
  id: string;
  name: string;
  totalSpace: number;
  usedSpace: number;
  lastUpdated: string;
  isActive: boolean;
  connected?: boolean | null;
}

export interface DiskUsage {
  totalDisks: number;
  totalSpace: number;
  usedSpace: number;
  unusedDisks: number;
}
