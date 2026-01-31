import React from 'react';
import { GitGraph, CheckSquare, User } from 'lucide-react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  // If we are in a sub-view of 'me' (like archive or settings), highlight 'me'
  const isMeActive = currentView === 'me' || currentView === 'archive' || currentView === 'settings';

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-lg z-50 h-20">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <button 
          onClick={() => setView('graph')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'graph' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <GitGraph size={24} />
          <span className="text-xs font-medium">Graph</span>
        </button>

        <button 
          onClick={() => setView('tasks')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'tasks' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <CheckSquare size={24} />
          <span className="text-xs font-medium">Tasks</span>
        </button>

        <button 
          onClick={() => setView('me')}
          className={`flex flex-col items-center space-y-1 ${isMeActive ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <User size={24} />
          <span className="text-xs font-medium">Me</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;