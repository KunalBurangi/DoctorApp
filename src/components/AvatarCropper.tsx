import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Check } from 'lucide-react';

interface Props {
  imageFile: File;
  isOpen: boolean;
  onClose: () => void;
  onCropped: (blob: Blob) => void;
}

export default function AvatarCropper({ imageFile, isOpen, onClose, onCropped }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialPinchScale, setInitialPinchScale] = useState(1);

  const CROP_SIZE = 280;

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      const newImg = new Image();
      newImg.onload = () => {
        setImg(newImg);
        // Fit image so the shorter side fills the crop area
        const fitScale = CROP_SIZE / Math.min(newImg.width, newImg.height);
        setScale(fitScale);
        setOffset({ x: 0, y: 0 });
      };
      newImg.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Draw preview
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Save state for clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = (CROP_SIZE - drawW) / 2 + offset.x;
    const drawY = (CROP_SIZE - drawH) / 2 + offset.y;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }, [img, scale, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse/touch drag
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Pinch to zoom (touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialPinchDist(dist);
      setInitialPinchScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = initialPinchScale * (dist / initialPinchDist);
      setScale(Math.max(0.1, Math.min(5, newScale)));
    }
  };

  const handleTouchEnd = () => {
    setInitialPinchDist(null);
  };

  // Wheel zoom (desktop)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  // Save cropped result
  const handleSave = () => {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = 512; // High-res output
    outputCanvas.height = 512;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx || !img) return;

    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2);
    ctx.clip();

    const outputScale = 512 / CROP_SIZE;
    const drawW = img.width * scale * outputScale;
    const drawH = img.height * scale * outputScale;
    const drawX = (512 - drawW) / 2 + offset.x * outputScale;
    const drawY = (512 - drawH) / 2 + offset.y * outputScale;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    outputCanvas.toBlob(blob => {
      if (blob) onCropped(blob);
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 z-10 border border-gray-200 dark:border-zinc-700 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-4">
          Crop Profile Photo
        </h3>

        {/* Crop Area */}
        <div className="flex justify-center mb-4">
          <div
            className="relative rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border-4 border-indigo-500/30 shadow-inner cursor-grab active:cursor-grabbing touch-none"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <canvas ref={canvasRef} width={CROP_SIZE} height={CROP_SIZE} className="w-full h-full" />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setScale(prev => Math.max(0.1, prev - 0.15))}
            className="p-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
          >
            <ZoomOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-32 accent-indigo-600"
          />
          <button
            onClick={() => setScale(prev => Math.min(5, prev + 0.15))}
            className="p-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
          >
            <ZoomIn className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mb-4">
          Drag to reposition • Pinch or scroll to zoom
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
