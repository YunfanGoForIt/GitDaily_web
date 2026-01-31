import { Branch, Task, TaskStatus } from './types';

export const THEME_COLORS = {
  main: '#9ca3af', // Gray-400 for main timeline
  branches: [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ef4444', // red-500
  ],
};

// Helper to create dates relative to today
const today = new Date();
const daysAgo = (d: number) => new Date(today.getTime() - d * 86400000).toISOString().split('T')[0];
const daysFuture = (d: number) => new Date(today.getTime() + d * 86400000).toISOString().split('T')[0];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'main',
    name: 'Main Timeline',
    description: 'Life Timeline',
    color: THEME_COLORS.main,
    parentId: null,
    status: 'active',
    startDate: '2023-01-01',
  },
  {
    id: 'b1',
    name: 'Website Redesign',
    description: 'Overhaul the corporate website',
    color: THEME_COLORS.branches[1], // Emerald
    parentId: 'main',
    status: 'active',
    startDate: daysAgo(12), // Started 12 days ago
  },
  {
    id: 'b2',
    name: 'Mobile Opt',
    description: 'Fix mobile responsiveness',
    color: THEME_COLORS.branches[2], // Amber
    parentId: 'b1',
    status: 'active',
    startDate: daysAgo(5), // Started 5 days ago (forked from b1)
  },
  {
    id: 'b3',
    name: 'Marketing',
    description: 'Launch campaign',
    color: THEME_COLORS.branches[3], // Violet
    parentId: 'main',
    status: 'active',
    startDate: daysAgo(5), // Started 5 days ago (forked from main), parallel to b2 but diff parent
  },
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', branchId: 'main', title: 'Project Kickoff', date: daysAgo(14), status: TaskStatus.COMPLETED },
  
  // Website Redesign Branch
  { id: 't3', branchId: 'b1', title: 'Design System', date: daysAgo(10), status: TaskStatus.COMPLETED },
  { id: 't4', branchId: 'b1', title: 'Home Page Mockup', date: daysAgo(8), status: TaskStatus.COMPLETED },
  { id: 't5', branchId: 'b1', title: 'About Page', date: daysAgo(2), status: TaskStatus.PLANNED },
  
  // Mobile Opt Sub-branch
  { id: 't6', branchId: 'b2', title: 'Touch Gestures', date: daysAgo(4), status: TaskStatus.COMPLETED },
  { id: 't7', branchId: 'b2', title: 'Responsive Nav', date: daysFuture(1), status: TaskStatus.PLANNED },

  // Marketing Branch
  { id: 't8', branchId: 'b3', title: 'Ad Copy', date: daysAgo(3), status: TaskStatus.COMPLETED },
  { id: 't9', branchId: 'b3', title: 'Launch Campaign', date: daysFuture(3), status: TaskStatus.PLANNED },

  // Future Main
  { id: 't2', branchId: 'main', title: 'Q1 Review', date: daysFuture(10), status: TaskStatus.PLANNED },
];

export const INITIAL_USER = {
  name: 'Alex Johnson',
  handle: '@alexj_gitto',
  avatar: 'https://picsum.photos/200',
  bio: 'Product Designer & Frontend Developer building cool things.',
};