import { useState, useEffect, useRef } from 'react';
import { dbParams } from '../db';
import type { GlobalImage } from '../db';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';

export default function ImageLibrary() {
  const [images, setImages] = useState<GlobalImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    const imgs = await dbParams.getAllImages();
    setImages(imgs.sort((a, b) => b.createdAt - a.createdAt));
    setIsLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    setIsLoading(true);

    for (const file of Array.from(e.target.files)) {
      if (!file.type.startsWith('image/')) continue;
      const newImg: GlobalImage = {
        id: crypto.randomUUID(),
        imageBlob: file,
        name: file.name,
        createdAt: Date.now(),
      };
      await dbParams.addGlobalImage(newImg);
    }

    await loadImages();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this image? It will be removed from all doctors.')) {
      await dbParams.deleteGlobalImage(id);
      setImages(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Image Library
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {images.length} {images.length === 1 ? 'image' : 'images'} uploaded. Select images per doctor from this shared library.
          </p>
        </div>
        <div>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-md active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Upload Images
          </button>
        </div>
      </div>

      {isLoading && images.length === 0 ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {images.map(img => (
            <div
              key={img.id}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-zinc-700/50"
            >
              <img
                src={URL.createObjectURL(img.imageBlob)}
                alt={img.name}
                className="w-full h-full object-cover"
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-xs font-medium truncate">{img.name}</p>
              </div>
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-all z-10 border border-white/20"
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
            Upload images to your shared library. You can then link them to any doctor.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1.5"
          >
            Click here to upload
          </button>
        </div>
      )}
    </div>
  );
}
