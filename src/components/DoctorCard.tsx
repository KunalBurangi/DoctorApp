import type { Doctor } from '../db';
import { User, Stethoscope, ChevronRight, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: Props) {
  return (
    <Link 
      to={`/doctor/${doctor.id}`}
      className="group block bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-zinc-800 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-300 overflow-hidden"
    >
      <div className="p-5 flex items-start gap-4">
        {/* Avatar Placeholder */}
        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-800/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 group-hover:scale-105 transition-transform duration-300">
          <User className="w-7 h-7" />
        </div>
        
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {doctor.name}
          </h3>
          
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Stethoscope className="w-4 h-4 text-indigo-500/70" />
            <span className="truncate">{doctor.specialization}</span>
          </div>

          {doctor.contact && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Phone className="w-4 h-4 text-purple-500/70" />
              <span className="truncate">{doctor.contact}</span>
            </div>
          )}
        </div>

        <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </div>
    </Link>
  );
}
