import React from 'react';
import { Disk } from '../types/disk';
import { DiskListItem } from './DiskListItem';
import styles from '../styles/disk-list.module.scss';

interface DiskListProps {
  disks: Disk[];
}

export const DiskList: React.FC<DiskListProps> = ({ disks }) => {
  return (
    <div className={styles.diskList}>
      {disks.map((disk) => (
        <DiskListItem key={disk.id} disk={disk} />
      ))}
    </div>
  );
}
