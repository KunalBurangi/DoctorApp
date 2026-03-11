import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Doctor, DoctorImage } from '../db';
import { dbParams } from '../db';
import { ArrowLeft, Upload, User, Stethoscope, Phone, Image as ImageIcon, Play, Trash2 } from 'lucide-react';
import PresentationCarousel from '../components/PresentationCarousel';

export default function DoctorDetails() {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [images, setImages] = useState<DoctorImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Carousel State
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (doctorId: string) => {
    setIsLoading(true);
    try {
      const doc = await dbParams.getDoctor(doctorId);
      if (doc) {
        setDoctor(doc);
        const docsImgs = await dbParams.getDoctorImages(doctorId);
        setImages(docsImgs.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !doctor) return;

    setIsLoading(true);
    const newImages: DoctorImage[] = [];
    
    // Process files
    for (const file of Array.from(e.target.files)) {
      if (!file.type.startsWith('image/')) continue;
      
      const newImg: DoctorImage = {
        id: crypto.randomUUID(),
        doctorId: doctor.id,
        imageBlob: file,
        createdAt: Date.now()
      };
      await dbParams.addDoctorImage(newImg);
      newImages.push(newImg);
    }

    setImages(prev => [...newImages, ...prev].sort((a, b) => b.createdAt - a.createdAt));
    setIsLoading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading && !doctor) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-20 px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Doctor not found</h2>
        <Link to="/" className="text-indigo-600 mt-4 inline-block hover:underline">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Header / Nav */}
      <div className="mb-8 flex items-center gap-4">
        <Link 
          to="/"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      {/* Doctor Profile Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-800/20 flex flex-shrink-0 items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
          <User className="w-12 h-12 sm:w-16 sm:h-16" />
        </div>

        <div className="flex-1 space-y-3 z-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {doctor.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base font-medium">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
              <Stethoscope className="w-4 h-4" />
              {doctor.specialization}
            </span>
            {doctor.contact && (
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 px-3 py-1 rounded-full">
                <Phone className="w-4 h-4" />
                {doctor.contact}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Records & Images Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white inline-flex items-center gap-2">
            Medical Records & Scans
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {images.length} {images.length === 1 ? 'document' : 'documents'} uploaded
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {images.length > 0 && (
            <button 
              onClick={() => {
                setCarouselInitialIndex(0);
                setIsCarouselOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md active:scale-95 group"
            >
              <Play className="w-4 h-4 text-white dark:text-gray-900 group-hover:scale-110 transition-transform" fill="currentColor" />
              Present
            </button>
          )}

          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-100 dark:border-indigo-500/20 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Add Images
          </button>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {images.map((img, idx) => (
            <div 
              key={img.id} 
              onClick={() => {
                setCarouselInitialIndex(idx);
                setIsCarouselOpen(true);
              }}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-zinc-700/50"
            >
              <img 
                src={URL.createObjectURL(img.imageBlob)} 
                alt="Medical scan" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)} // Clean up memory
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300" fill="currentColor" />
              </div>
              
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  if(confirm("Are you sure you want to delete this image?")) {
                    await dbParams.deleteDoctorImage(img.id);
                    setImages(prev => prev.filter(i => i.id !== img.id));
                  }
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10 border border-white/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-gray-200 dark:border-zinc-800 border-dashed">
          <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No images yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6 text-sm">
            Upload prescriptions, x-rays, or test results to keep them securely organized.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1.5"
          >
            Click here to upload
          </button>
        </div>
      )}
      
      <PresentationCarousel 
        images={images}
        initialIndex={carouselInitialIndex}
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
      />
    </div>
  );
}
