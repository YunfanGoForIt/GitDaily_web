export enum TaskStatus {
  PLANNED = 'PLANNED', // git add (grey)
  COMPLETED = 'COMPLETED', // git commit (colored)
}

export enum TimeGranularity {
  DAY = 'Day',
  WEEK = 'Week',
  BIWEEK = '2 Weeks',
  MONTH = 'Month',
}

export type AppView = 'graph' | 'branch-detail' | 'tasks' | 'me' | 'archive' | 'settings' | 'edit-profile';

export interface Branch {
  id: string;
  name: string;
  description: string;
  color: string;
  parentId: string | null; // null means main timeline
  parentJoinNodeId?: string; // Where it branches off (Legacy, prefer startDate calculation)
  mergeTargetNodeId?: string; // If merged, which node on the parent did it merge into?
  status: 'active' | 'merged' | 'archived';
  startDate: string;
  targetDate?: string;
  restoredDate?: string; // Date when the branch was restored from archive
}

export interface Task {
  id: string;
  branchId: string;
  title: string;
  description?: string;
  date: string; // ISO Date
  status: TaskStatus;
  isMergeCommit?: boolean;
}

export interface UserStats {
  totalCommits: number;
  currentStreak: number;
  archivedCount: number;
}

export interface UserProfile {
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
}