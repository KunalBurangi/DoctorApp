import { useState, useEffect } from 'react';
import type { GlobalImage } from '../db';
import { dbParams } from '../db';
import { X, Check, Image as ImageIcon } from 'lucide-react';

interface Props {
  doctorId: string;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void; // callback to refresh parent
}

export default function ImagePickerModal({ doctorId, isOpen, onClose, onChanged }: Props) {
  const [allImages, setAllImages] = useState<GlobalImage[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    const [imgs, ids] = await Promise.all([
      dbParams.getAllImages(),
      dbParams.getDoctorLinkedImageIds(doctorId),
    ]);
    setAllImages(imgs.sort((a, b) => b.createdAt - a.createdAt));
    setLinkedIds(ids);
    setIsLoading(false);
  };

  const toggleLink = async (imageId: string) => {
    if (linkedIds.has(imageId)) {
      await dbParams.unlinkImageFromDoctor(doctorId, imageId);
      setLinkedIds(prev => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    } else {
      await dbParams.linkImageToDoctor(doctorId, imageId);
      setLinkedIds(prev => new Set(prev).add(imageId));
    }
    onChanged();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col z-10 border border-gray-200 dark:border-zinc-700 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Images</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tap to link or unlink images. {linkedIds.size} selected.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : allImages.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {allImages.map(img => {
                const isLinked = linkedIds.has(img.id);
                return (
                  <button
                    key={img.id}
                    onClick={() => toggleLink(img.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all duration-200 ${
                      isLinked
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-[0.97]'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <img
                      src={URL.createObjectURL(img.imageBlob)}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                    {isLinked && (
                      <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 text-gray-400">
                <ImageIcon className="w-7 h-7" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No images in your library yet. Upload images from the Image Library page first.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all active:scale-[0.98]"
          >
            Done ({linkedIds.size} selected)
          </button>
        </div>
      </div>
    </div>
  );
}
