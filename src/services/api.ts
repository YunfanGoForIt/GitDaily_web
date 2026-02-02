/**
 * GitDaily API Service
 * 前端数据访问层
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// snake_case to camelCase 转换
function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = snakeToCamel(obj[key]);
    }
    return result;
  }
  return obj;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return snakeToCamel(data);
}

// ==================== Branch API ====================
export const branchApi = {
  getAll: () => fetchApi<Branch[]>('/branches'),
  getById: (id: string) => fetchApi<Branch>(`/branches/${id}`),
  create: (branch: Omit<Branch, 'id' | 'status' | 'parentId'>) =>
    fetchApi('/branches', {
      method: 'POST',
      body: JSON.stringify(branch),
    }),
  update: (id: string, updates: Partial<Branch>) =>
    fetchApi(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: string) =>
    fetchApi(`/branches/${id}`, { method: 'DELETE' }),
};

// ==================== Task API ====================
export const taskApi = {
  getAll: () => fetchApi<Task[]>('/tasks'),
  getById: (id: string) => fetchApi<Task>(`/tasks/${id}`),
  getByBranch: (branchId: string) => fetchApi<Task[]>(`/tasks/branch/${branchId}`),
  create: (task: Omit<Task, 'id'>) =>
    fetchApi('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  update: (id: string, updates: Partial<Task>) =>
    fetchApi(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: string) =>
    fetchApi(`/tasks/${id}`, { method: 'DELETE' }),
};

// ==================== User API ====================
export const userApi = {
  getProfile: () => fetchApi<UserProfile>('/user/profile'),
  updateProfile: (user: UserProfile) =>
    fetchApi('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(user),
    }),
};

// ==================== Admin API ====================
export const adminApi = {
  createBackup: () =>
    fetchApi<{ success: boolean; backupPath: string }>('/admin/backup', {
      method: 'POST',
    }),
  upgrade: () =>
    fetchApi<{ success: boolean; backupPath: string; migrationsApplied: number }>(
      '/admin/upgrade',
      { method: 'POST' }
    ),
  getStatus: () => fetchApi<DatabaseStatus>('/status'),
};

// 类型定义
interface Branch {
  id: string;
  name: string;
  description: string;
  color: string;
  parentId: string | null;
  status: 'active' | 'merged' | 'archived';
  startDate: string;
  targetDate?: string;
  mergeTargetNodeId?: string;
  restoredDate?: string;
}

interface Task {
  id: string;
  branchId: string;
  title: string;
  description?: string;
  date: string;
  status: 'PLANNED' | 'COMPLETED';
  isMergeCommit?: boolean;
  commitMessage?: string;
}

interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
}

interface DatabaseStatus {
  version: string;
  path: string;
  size: number;
  branch_count: number;
  task_count: number;
  user_count: number;
}

// 导出类型供其他组件使用
export type { Branch, Task, UserProfile, DatabaseStatus };
