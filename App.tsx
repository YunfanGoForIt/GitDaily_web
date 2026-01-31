import React, { useState } from 'react';
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
import { Task, AppView, Branch, UserProfile, TaskStatus } from './types';
import { INITIAL_BRANCHES, INITIAL_TASKS, INITIAL_USER } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('graph');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Application Data State
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  // Settings State
  const [branchSpacing, setBranchSpacing] = useState(1.0);

  // Handlers
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleBranchClick = (branchId: string) => {
    if (branchId === 'main') return;
    setSelectedBranchId(branchId);
    setCurrentView('branch-detail');
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
        t.id === taskId 
        ? { ...t, status: t.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED' }
        : t
    ));
  };

  const handleCreateTask = (taskData: Omit<Task, 'id'>) => {
      const newTask: Task = {
          id: `t${Date.now()}`,
          ...taskData
      };
      setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const handleDeleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleSaveBranch = (branchData: Omit<Branch, 'id' | 'status' | 'parentId'>) => {
      const newBranch: Branch = {
          id: `b${Date.now()}`,
          parentId: 'main', // Default to main
          status: 'active',
          ...branchData
      };
      setBranches(prev => [...prev, newBranch]);
  };

  const handleArchiveBranch = (branchId: string) => {
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, status: 'archived' } : b));
      setCurrentView('graph');
  };

  const handleDeleteBranch = (branchId: string) => {
      const branchToDelete = branches.find(b => b.id === branchId);
      if (!branchToDelete) return;

      // 1. Re-parent any children of this branch to prevent graph breakage
      // If the deleted branch had a parent, children move to that parent. 
      // If it was a root branch (parent=main or null), children move to main.
      const newParentId = branchToDelete.parentId || 'main';

      setBranches(prev => {
          // Remove the branch
          const filtered = prev.filter(b => b.id !== branchId);
          // Update children
          return filtered.map(b => b.parentId === branchId ? { ...b, parentId: newParentId } : b);
      });

      // 2. Delete all tasks associated with this branch
      setTasks(prev => prev.filter(t => t.branchId !== branchId));

      setCurrentView('graph');
      setSelectedBranchId(null);
  };

  const handleRestoreBranch = (branchId: string, restoreDate: string) => {
      setBranches(prev => prev.map(b => 
        b.id === branchId 
            ? { ...b, status: 'active', restoredDate: restoreDate } 
            : b
      ));
      
      // Optionally create a "Restart" marker task
      const restartTask: Task = {
          id: `restart-${Date.now()}`,
          branchId: branchId,
          title: 'Project Restarted',
          description: 'Restored from archive',
          date: restoreDate,
          status: TaskStatus.PLANNED
      };
      setTasks(prev => [restartTask, ...prev]);

      setCurrentView('graph');
  };

  const handleMergeBranch = (branchId: string) => {
      const branch = branches.find(b => b.id === branchId);
      if (!branch) return;

      const parentId = branch.parentId || 'main';
      
      // 1. Create a Merge Commit on Parent
      const mergeTask: Task = {
          id: `m${Date.now()}`,
          branchId: parentId,
          title: `Merge branch '${branch.name}'`,
          description: `Merged ${branch.name} into ${parentId}`,
          date: new Date().toISOString().split('T')[0],
          status: TaskStatus.COMPLETED,
          isMergeCommit: true
      };

      // 2. Add task
      setTasks(prev => [mergeTask, ...prev]);

      // 3. Update branch status and set target
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, status: 'merged', mergeTargetNodeId: mergeTask.id } : b));
      
      // 4. Return to graph
      setCurrentView('graph');
  }

  const handleUpdateProfile = (updatedUser: UserProfile) => {
      setUser(updatedUser);
      setCurrentView('me');
  };
  
  const handleResetData = () => {
      setTasks(INITIAL_TASKS);
      setBranches(INITIAL_BRANCHES);
      setCurrentView('me');
  };

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
          />
        );
      case 'branch-detail':
        if (!selectedBranchId) return <GraphPage tasks={tasks} branches={branches} onTaskClick={handleTaskClick} onNewBranch={() => setIsBranchModalOpen(true)} onBranchClick={handleBranchClick} branchSpacing={branchSpacing} />;
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
                onMerge={handleMergeBranch}
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
          />
        );
      case 'me':
        return (
            <MePage 
                user={user} 
                tasks={tasks}
                onNavigate={setCurrentView}
            />
        );
      case 'edit-profile':
          return (
              <EditProfilePage 
                  user={user}
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
        task={selectedTask}
        branches={branches}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
};

export default App;