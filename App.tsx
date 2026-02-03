import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation';
import GraphPage from './pages/GraphPage';
import TasksPage from './pages/TasksPage';
import MePage from './pages/MePage';
import ArchivePage from './pages/ArchivePage';
import SettingsPage from './pages/SettingsPage';
import BranchDetailPage from './pages/BranchDetailPage';
import EditProfilePage from './pages/EditProfilePage';
import NewBranchModal from './components/NewBranchModal';
import NewTaskModal from './components/NewTaskModal';
import TaskDetailPanel from './components/TaskDetailPanel';
import CommitMessageModal from './components/CommitMessageModal';
import { Task, AppView, Branch, UserProfile, TaskStatus, TimeGranularity } from './types';
import { branchApi, taskApi, userApi } from './src/services/api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('graph');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Commit Message Modal State
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'task' | 'merge', id: string } | null>(null);

  // Application Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Settings State
  const [branchSpacing, setBranchSpacing] = useState(1.0);
  const [granularity, setGranularity] = useState<TimeGranularity>(TimeGranularity.DAY);
  const [heatmapCellSize, setHeatmapCellSize] = useState(18);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== Data Fetching ====================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [branchesData, tasksData, userData] = await Promise.all([
        branchApi.getAll(),
        taskApi.getAll(),
        userApi.getProfile(),
      ]);
      setBranches(branchesData);
      setTasks(tasksData);
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please check if the API server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== Handlers ====================
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleBranchClick = (branchId: string) => {
    if (branchId === 'main') return;
    setSelectedBranchId(branchId);
    setCurrentView('branch-detail');
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === TaskStatus.PLANNED) {
      setPendingAction({ type: 'task', id: taskId });
      setIsCommitModalOpen(true);
    } else {
      // Going back to PLANNED
      try {
        await taskApi.update(taskId, { status: TaskStatus.PLANNED });
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, status: TaskStatus.PLANNED } : t
        ));
      } catch (err) {
        console.error('Failed to update task:', err);
      }
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      const newTask: Task = {
        id: `t${Date.now()}`,
        ...taskData
      };
      await taskApi.create(newTask);
      setTasks(prev => [newTask, ...prev]);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleCreateTaskFromTable = async (taskData: { title: string; date: string; description?: string; branchId: string }) => {
    console.log('[DEBUG] handleCreateTaskFromTable called with:', taskData);
    try {
      const newTask: Task = {
        id: `t${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...taskData,
        status: TaskStatus.PLANNED
      };
      console.log('[DEBUG] Creating task:', newTask);

      await taskApi.create(newTask);
      console.log('[DEBUG] Task created successfully');

      setTasks(prev => {
        const updated = [newTask, ...prev];
        console.log('[DEBUG] setTasks called, new count:', updated.length);
        return updated;
      });
    } catch (err) {
      console.error('[DEBUG] Failed to create task:', err);
      throw err;
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (updates.status === TaskStatus.COMPLETED) {
      setPendingAction({ type: 'task', id: taskId });
      setIsCommitModalOpen(true);
      return;
    }

    try {
      await taskApi.update(taskId, updates);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.delete(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleSaveBranch = async (branchData: Omit<Branch, 'id' | 'status' | 'parentId'>) => {
    try {
      const newBranch: Branch = {
        id: `b${Date.now()}`,
        parentId: 'main',
        status: 'active',
        ...branchData
      };
      await branchApi.create(newBranch);
      setBranches(prev => [...prev, newBranch]);
    } catch (err) {
      console.error('Failed to create branch:', err);
    }
  };

  const handleArchiveBranch = async (branchId: string) => {
    try {
      await branchApi.update(branchId, { status: 'archived' });
      setBranches(prev => prev.map(b =>
        b.id === branchId ? { ...b, status: 'archived' } : b
      ));
      setCurrentView('graph');
    } catch (err) {
      console.error('Failed to archive branch:', err);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    const branchToDelete = branches.find(b => b.id === branchId);
    if (!branchToDelete) return;

    const newParentId = branchToDelete.parentId || 'main';

    try {
      await branchApi.delete(branchId);
      setBranches(prev => {
        const filtered = prev.filter(b => b.id !== branchId);
        return filtered.map(b => b.parentId === branchId ? { ...b, parentId: newParentId } : b);
      });
      setTasks(prev => prev.filter(t => t.branchId !== branchId));
      setCurrentView('graph');
      setSelectedBranchId(null);
    } catch (err) {
      console.error('Failed to delete branch:', err);
    }
  };

  const handleRestoreBranch = async (branchId: string, restoreDate: string) => {
    try {
      await branchApi.update(branchId, { status: 'active', restoredDate });

      const restartTask: Task = {
        id: `restart-${Date.now()}`,
        branchId: branchId,
        title: 'Project Restarted',
        description: 'Restored from archive',
        date: restoreDate,
        status: TaskStatus.PLANNED
      };
      await taskApi.create(restartTask);

      setBranches(prev => prev.map(b =>
        b.id === branchId ? { ...b, status: 'active', restoredDate } : b
      ));
      setTasks(prev => [restartTask, ...prev]);
      setCurrentView('graph');
    } catch (err) {
      console.error('Failed to restore branch:', err);
    }
  };

  const handleMergeBranchRequest = (branchId: string) => {
    setPendingAction({ type: 'merge', id: branchId });
    setIsCommitModalOpen(true);
  };

  const onCommitMessageConfirmed = async (message: string) => {
    if (!pendingAction) return;

    if (pendingAction.type === 'task') {
      // Complete the Task - set completion date to today
      const today = new Date().toISOString().split('T')[0];
      try {
        await taskApi.update(pendingAction.id, {
          status: TaskStatus.COMPLETED,
          commitMessage: message,
          date: today  // Update to actual completion date
        });
        setTasks(prev => prev.map(t =>
          t.id === pendingAction.id
            ? { ...t, status: TaskStatus.COMPLETED, commitMessage: message, date: today }
            : t
        ));
      } catch (err) {
        console.error('Failed to complete task:', err);
      }
    } else if (pendingAction.type === 'merge') {
      // Perform Merge
      const branchId = pendingAction.id;
      const branch = branches.find(b => b.id === branchId);
      if (branch) {
        const parentId = branch.parentId || 'main';

        const mergeTask: Task = {
          id: `m${Date.now()}`,
          branchId: parentId,
          title: `Merge branch '${branch.name}'`,
          description: `Merged ${branch.name} into ${parentId}`,
          date: new Date().toISOString().split('T')[0],
          status: TaskStatus.COMPLETED,
          isMergeCommit: true,
          commitMessage: message
        };

        try {
          await taskApi.create(mergeTask);
          await branchApi.update(branchId, { status: 'merged', mergeTargetNodeId: mergeTask.id });

          setTasks(prev => [mergeTask, ...prev]);
          setBranches(prev => prev.map(b =>
            b.id === branchId ? { ...b, status: 'merged', mergeTargetNodeId: mergeTask.id } : b
          ));
          setCurrentView('graph');
        } catch (err) {
          console.error('Failed to merge branch:', err);
        }
      }
    }

    setPendingAction(null);
  };

  const handleUpdateProfile = async (updatedUser: UserProfile) => {
    try {
      await userApi.updateProfile(updatedUser);
      setUser(updatedUser);
      setCurrentView('me');
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleResetData = () => {
    // In API mode, we just reload from server
    fetchData();
    setCurrentView('me');
  };

  // ==================== Render ====================
  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Make sure the API server is running:
            <br />
            <code className="bg-gray-100 px-2 py-1 rounded">npm run server</code>
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'graph':
        return (
          <GraphPage
            tasks={tasks}
            branches={branches}
            onTaskClick={handleTaskClick}
            onNewBranch={() => setIsBranchModalOpen(true)}
            onBranchClick={handleBranchClick}
            branchSpacing={branchSpacing}
            granularity={granularity}
            setGranularity={setGranularity}
          />
        );
      case 'branch-detail':
        if (!selectedBranchId) return (
          <GraphPage
            tasks={tasks}
            branches={branches}
            onTaskClick={handleTaskClick}
            onNewBranch={() => setIsBranchModalOpen(true)}
            onBranchClick={handleBranchClick}
            branchSpacing={branchSpacing}
            granularity={granularity}
            setGranularity={setGranularity}
          />
        );
        return (
          <BranchDetailPage
            branchId={selectedBranchId}
            tasks={tasks}
            branches={branches}
            onBack={() => setCurrentView('graph')}
            onTaskClick={handleTaskClick}
            onToggleTask={handleToggleTask}
            onArchive={handleArchiveBranch}
            onDelete={handleDeleteBranch}
            onMerge={handleMergeBranchRequest}
            onNewTask={() => { setIsTaskModalOpen(true); }}
            onCreateTask={handleCreateTaskFromTable}
            onUpdateTask={handleUpdateTask}
            branchSpacing={branchSpacing}
          />
        );
      case 'tasks':
        return (
          <TasksPage
            tasks={tasks}
            branches={branches}
            onNewTask={() => { setIsTaskModalOpen(true); }}
            onToggleTask={handleToggleTask}
            onTaskClick={handleTaskClick}
            onCreateTask={handleCreateTaskFromTable}
            onUpdateTask={handleUpdateTask}
            granularity={granularity}
            setGranularity={setGranularity}
          />
        );
      case 'me':
        return (
          <MePage
            user={user!}
            tasks={tasks}
            onNavigate={setCurrentView}
            heatmapCellSize={heatmapCellSize}
          />
        );
      case 'edit-profile':
        return (
          <EditProfilePage
            user={user!}
            onSave={handleUpdateProfile}
            onCancel={() => setCurrentView('me')}
          />
        );
      case 'archive':
        return (
          <ArchivePage
            branches={branches}
            onNavigate={setCurrentView}
            onRestore={handleRestoreBranch}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            onNavigate={setCurrentView}
            onResetData={handleResetData}
            branchSpacing={branchSpacing}
            onBranchSpacingChange={setBranchSpacing}
            heatmapCellSize={heatmapCellSize}
            onHeatmapCellSizeChange={setHeatmapCellSize}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      {/* View Container */}
      <div className="flex-1 overflow-hidden relative">
        {renderView()}
      </div>

      {/* Navigation */}
      {currentView !== 'branch-detail' && currentView !== 'edit-profile' && (
        <Navigation currentView={currentView} setView={setCurrentView} />
      )}

      {/* Modals & Panels */}
      <NewBranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onSave={handleSaveBranch}
      />
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        branches={branches}
        currentBranchId={selectedBranchId || undefined}
        onSave={handleCreateTask}
      />

      <TaskDetailPanel
        isOpen={isTaskDetailOpen}
        onClose={() => { setIsTaskDetailOpen(false); setSelectedTask(null); }}
        task={selectedTask ? tasks.find(t => t.id === selectedTask.id) || null : null}
        branches={branches}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* Commit Message Modal */}
      <CommitMessageModal
        isOpen={isCommitModalOpen}
        onClose={() => { setIsCommitModalOpen(false); setPendingAction(null); }}
        onConfirm={onCommitMessageConfirmed}
        title={pendingAction?.type === 'merge' ? "Merge Branch Reflection" : "Task Completion Reflection"}
      />
    </div>
  );
};

export default App;
