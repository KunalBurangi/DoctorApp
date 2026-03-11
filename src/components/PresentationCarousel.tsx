import { useState, useEffect, useCallback } from 'react';
import type { GlobalImage } from '../db';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface Props {
  images: GlobalImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PresentationCarousel({ images, initialIndex = 0, isOpen, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUI, setShowUI] = useState(true);

  // Sync index when opened with a new initialIndex
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(false);
      setShowUI(true);
    }
  }, [isOpen, initialIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Slideshow Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && isOpen) {
      interval = setInterval(() => {
        handleNext();
      }, 3000); // 3 seconds per slide
    }
    return () => clearInterval(interval);
  }, [isPlaying, isOpen, handleNext]);

  // UI Inactivity Timeout
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isOpen) {
      const resetUI = () => {
        setShowUI(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setShowUI(false), 3000);
      };
      
      window.addEventListener('mousemove', resetUI);
      window.addEventListener('touchstart', resetUI);
      window.addEventListener('keydown', resetUI);
      
      resetUI(); // Init timeout

      return () => {
        window.removeEventListener('mousemove', resetUI);
        window.removeEventListener('touchstart', resetUI);
        window.removeEventListener('keydown', resetUI);
        clearTimeout(timeout);
      };
    }
  }, [isOpen]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, onClose]);

  // Touch handlers for swipe (Android/Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStart - endX;

    if (Math.abs(diff) > 50) { // threshold
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
    setTouchStart(null);
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-300 ${showUI ? '' : 'cursor-none'}`}>
      {/* Top Controls */}
      <div className={`absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-4">
          <span className="text-white/80 font-medium text-sm sm:text-base tracking-wider">
            {currentIndex + 1} / {images.length}
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors text-sm"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" fill="currentColor" />}
            {isPlaying ? 'Pause' : 'Play Slideshow'}
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all shadow-lg active:scale-95"
          aria-label="Close presentation"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Main Image View */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden outline-none select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={images[currentIndex].id} // Force re-render for animation on change
          src={URL.createObjectURL(images[currentIndex].imageBlob)}
          alt="Medical presentation"
          className="max-w-full max-h-full object-contain select-none pointer-events-none animate-in fade-in zoom-in-95 duration-500"
        />
      </div>

      {/* Side Navigation Overlays */}
      <button
        onClick={handlePrevious}
        disabled={currentIndex === 0}
        className={`absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 sm:p-5 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md text-white transition-all transform active:scale-90 z-20 ${
          currentIndex === 0 || !showUI ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:shadow-xl hover:scale-110'
        }`}
      >
        <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
      </button>

      <button
        onClick={handleNext}
        className={`absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 sm:p-5 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md text-white transition-all transform active:scale-90 z-20 ${
          (currentIndex === images.length - 1 && !isPlaying) || !showUI ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:shadow-xl hover:scale-110'
        }`}
      >
        <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
      </button>

      {/* Bottom Thumbnail Strip (Optional but nice) */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[90vw] overflow-x-auto flex items-center gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hide-scrollbar z-20 transition-all duration-300 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setCurrentIndex(idx)}
            className={`relative flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-xl overflow-hidden transition-all duration-300 ${
              currentIndex === idx 
                ? 'ring-2 ring-white scale-110 shadow-lg z-10' 
                : 'opacity-50 hover:opacity-100 cursor-pointer'
            }`}
          >
            <img 
              src={URL.createObjectURL(img.imageBlob)} 
              alt={`Thumbnail ${idx + 1}`} 
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
