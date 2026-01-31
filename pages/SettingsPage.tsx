import React from 'react';
import { ArrowLeft, Moon, Trash2, Bell, Shield, Sliders } from 'lucide-react';
import { AppView } from '../types';

interface SettingsPageProps {
  onNavigate: (view: AppView) => void;
  onResetData: () => void;
  branchSpacing: number;
  onBranchSpacingChange: (val: number) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, onResetData, branchSpacing, onBranchSpacingChange }) => {
  return (
    <div className="h-full bg-gray-50 flex flex-col p-6 overflow-y-auto no-scrollbar">
       {/* Header */}
       <div className="flex items-center mb-8">
        <button 
          onClick={() => onNavigate('me')}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full mr-2"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-6">
        
        {/* Graph Layout Section */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Graph Layout</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-50">
                <div className="flex items-center mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-3">
                        <Sliders size={18} />
                    </div>
                    <span className="text-gray-700 font-medium">Branch Spacing</span>
                    <span className="ml-auto text-xs text-gray-400 font-mono">{Math.round(branchSpacing * 100)}%</span>
                </div>
                <div className="px-1">
                    <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.1"
                        value={branchSpacing}
                        onChange={(e) => onBranchSpacingChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>Compact</span>
                        <span>Normal</span>
                        <span>Wide</span>
                    </div>
                </div>
             </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Appearance</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 mr-3">
                        <Moon size={18} />
                    </div>
                    <span className="text-gray-700 font-medium">Dark Mode</span>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                    <input type="checkbox" className="peer absolute w-0 h-0 opacity-0" />
                    <label className="block overflow-hidden h-6 rounded-full bg-gray-200 cursor-pointer peer-checked:bg-blue-500 transition-colors"></label>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
             </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Notifications</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600 mr-3">
                        <Bell size={18} />
                    </div>
                    <span className="text-gray-700 font-medium">Daily Reminders</span>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                    <input type="checkbox" defaultChecked className="peer absolute w-0 h-0 opacity-0" />
                    <label className="block overflow-hidden h-6 rounded-full bg-gray-200 cursor-pointer peer-checked:bg-blue-500 transition-colors"></label>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
             </div>
          </div>
        </section>

        {/* Data Section */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Data</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <button 
                onClick={() => {
                   if(confirm('Are you sure you want to reset all data to default?')) {
                       onResetData();
                   }
                }}
                className="w-full p-4 flex items-center text-left hover:bg-red-50 transition-colors"
             >
                <div className="p-2 bg-red-100 rounded-lg text-red-600 mr-3">
                    <Trash2 size={18} />
                </div>
                <div>
                     <span className="text-red-600 font-medium block">Reset All Data</span>
                     <span className="text-red-400 text-xs">Restore application to initial state</span>
                </div>
             </button>
          </div>
        </section>

         {/* Privacy Section */}
         <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">About</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600 mr-3">
                        <Shield size={18} />
                    </div>
                    <span className="text-gray-700 font-medium">Version</span>
                </div>
                <span className="text-gray-400 text-sm">v1.0.3 Production</span>
             </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsPage;