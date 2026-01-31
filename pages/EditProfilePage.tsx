import React, { useState } from 'react';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { UserProfile, AppView } from '../types';

interface EditProfilePageProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
  onCancel: () => void;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ user, onSave, onCancel }) => {
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [avatar, setAvatar] = useState(user.avatar);
  const [bio, setBio] = useState(user.bio || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, handle, avatar, bio });
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="flex items-center">
            <button onClick={onCancel} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full mr-2">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        </div>
        <button 
            onClick={handleSubmit}
            className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold flex items-center hover:bg-gray-800 transition-colors"
        >
            <Save size={16} className="mr-2" />
            Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-8">
            
            {/* Avatar */}
            <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm">
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                    </div>
                </div>
                <button className="mt-3 text-blue-600 text-sm font-semibold hover:underline">Change Photo</button>
            </div>

            {/* Form */}
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Handle</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-400">@</span>
                        <input 
                            type="text" 
                            value={handle.replace('@', '')}
                            onChange={e => setHandle(`@${e.target.value}`)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                        />
                    </div>
                </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Avatar URL</label>
                    <input 
                        type="text" 
                        value={avatar}
                        onChange={e => setAvatar(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
                    <textarea 
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none resize-none"
                        placeholder="Write a short bio..."
                    />
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;