
export interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
  modifiedAt?: Date;
  stateVersion: string;
  terraformVersion: string;
}