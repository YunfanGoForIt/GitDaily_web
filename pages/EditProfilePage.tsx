import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, Save, Upload, X } from 'lucide-react';
import { UserProfile } from '../types';

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      setIsUploading(false);
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      setIsUploading(false);
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      alert('Failed to read file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatar('');
  };

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
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm bg-gray-100">
                        {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Camera size={32} />
                            </div>
                        )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUploading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Upload className="text-white" size={24} />
                        )}
                    </div>
                    {avatar && (
                        <button
                            onClick={handleRemoveAvatar}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    onClick={handleAvatarClick}
                    className="mt-3 text-blue-600 text-sm font-semibold hover:underline"
                >
                    {avatar ? 'Change Photo' : 'Upload Photo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF. Max 5MB.</p>
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