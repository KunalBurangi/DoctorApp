import { useState } from 'react';
import type { Doctor } from '../db';
import { dbParams } from '../db';
import { X, UserPlus, Stethoscope, Phone } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (doctor: Doctor) => void;
}

export default function AddDoctorModal({ isOpen, onClose, onAdded }: Props) {
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialization) return;
    
    setIsSubmitting(true);
    try {
      const newDoctor: Doctor = {
        id: crypto.randomUUID(),
        name,
        specialization,
        contact,
        createdAt: Date.now()
      };
      await dbParams.addDoctor(newDoctor);
      onAdded(newDoctor);
      onClose();
      // reset form
      setName('');
      setSpecialization('');
      setContact('');
    } catch (error) {
      console.error('Failed to add doctor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Add New Doctor</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Doctor Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Dr. Jane Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Specialization *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Stethoscope className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Cardiologist, Neurologist..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contact Info (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Phone or Email"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? 'Saving...' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
