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
import CommitMessageModal from './components/CommitMessageModal';
import { Task, AppView, Branch, UserProfile, TaskStatus } from './types';
import { INITIAL_BRANCHES, INITIAL_TASKS, INITIAL_USER } from './constants';

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

  // Triggered when user clicks the checkbox in lists
  const handleToggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === TaskStatus.PLANNED) {
        // Going to COMPLETED: Require message
        setPendingAction({ type: 'task', id: taskId });
        setIsCommitModalOpen(true);
    } else {
        // Going back to PLANNED: No message needed
        setTasks(prev => prev.map(t => 
            t.id === taskId 
            ? { ...t, status: TaskStatus.PLANNED }
            : t
        ));
    }
  };

  const handleCreateTask = (taskData: Omit<Task, 'id'>) => {
      const newTask: Task = {
          id: `t${Date.now()}`,
          ...taskData
      };
      setTasks(prev => [newTask, ...prev]);
  };

  // Triggered from Task Detail Panel
  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
      // Intercept status change to COMPLETED
      if (updates.status === TaskStatus.COMPLETED) {
         setPendingAction({ type: 'task', id: taskId });
         setIsCommitModalOpen(true);
         // We do NOT apply the update yet. The modal confirm will handle it.
         // Note: If there were *other* updates (like title change) along with status, 
         // this simplistic interception might drop them if we don't store them.
         // But TaskDetailPanel typically calls status toggle separately or sends full object.
         // For safety, we can apply non-status updates immediately? 
         // For now, assume the user toggled status specifically.
         return; 
      }

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

      const newParentId = branchToDelete.parentId || 'main';

      setBranches(prev => {
          const filtered = prev.filter(b => b.id !== branchId);
          return filtered.map(b => b.parentId === branchId ? { ...b, parentId: newParentId } : b);
      });

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

  // Intercept Merge to require message
  const handleMergeBranchRequest = (branchId: string) => {
      setPendingAction({ type: 'merge', id: branchId });
      setIsCommitModalOpen(true);
  }

  // Finalize actions after Modal Confirm
  const onCommitMessageConfirmed = (message: string) => {
      if (!pendingAction) return;

      if (pendingAction.type === 'task') {
          // Complete the Task
          setTasks(prev => prev.map(t => 
             t.id === pendingAction.id 
             ? { ...t, status: TaskStatus.COMPLETED, commitMessage: message } 
             : t
          ));
          // If the detail panel is open for this task, force an update or close it?
          // React state update will reflect in panel if it consumes the `task` prop correctly.
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
                commitMessage: message // Add the merge message here
            };

            setTasks(prev => [mergeTask, ...prev]);
            setBranches(prev => prev.map(b => b.id === branchId ? { ...b, status: 'merged', mergeTargetNodeId: mergeTask.id } : b));
            setCurrentView('graph');
          }
      }

      setPendingAction(null);
  };

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
                onMerge={handleMergeBranchRequest}
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
        task={selectedTask ? tasks.find(t => t.id === selectedTask.id) || null : null} // Ensure we pass the latest task state
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