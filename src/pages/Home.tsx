import { useState, useEffect } from 'react';
import type { Doctor } from '../db';
import { dbParams } from '../db';
import AddDoctorModal from '../components/AddDoctorModal';
import DoctorCard from '../components/DoctorCard';
import { Plus, UserPlus, FileHeart, ChevronRight } from 'lucide-react';

export default function Home() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await dbParams.getDoctors();
      // Sort newest first
      setDoctors(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorAdded = (newDoctor: Doctor) => {
    setDoctors(prev => [newDoctor, ...prev]);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            My Doctors
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <FileHeart className="w-4 h-4" />
            Manage your medical professionals
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-lg shadow-indigo-500/25 focus:ring-4 focus:ring-indigo-500/30 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Add Doctor
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 border-dashed">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4 text-indigo-500 dark:text-indigo-400">
            <UserPlus className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Doctors Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            Keep track of your medical professionals by adding them here. Their details and images will be stored securely on your device.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1.5"
          >
            Add your first doctor <ChevronRight className="w-4 h-4 inline" />
          </button>
        </div>
      )}

      <AddDoctorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={handleDoctorAdded}
      />
    </div>
  );
}
