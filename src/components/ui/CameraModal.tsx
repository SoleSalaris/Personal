import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title: string;
}

export const CameraModal = ({ isOpen, onClose, onCapture, title }: CameraModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsReady(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Por favor, verificá los permisos.');
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsReady(false);
    }
  }, [isOpen, startCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    // Physical dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Display dimensions (what the user sees)
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    // Calculate crop coordinates based on the guide overlay
    // The guide is roughly 80% width and centered in a card aspect ratio (3/2)
    const guideWidthPercent = 0.85;
    const guideAspectRatio = 1.586; // Standard ID card ratio (85.6mm / 53.98mm)
    
    const guideDisplayWidth = displayWidth * guideWidthPercent;
    const guideDisplayHeight = guideDisplayWidth / guideAspectRatio;
    
    const guideX = (displayWidth - guideDisplayWidth) / 2;
    const guideY = (displayHeight - guideDisplayHeight) / 2;

    // Map display coordinates to physical video coordinates
    const scaleX = videoWidth / displayWidth;
    const scaleY = videoHeight / displayHeight;

    const cropX = guideX * scaleX;
    const cropY = guideY * scaleY;
    const cropWidth = guideDisplayWidth * scaleX;
    const cropHeight = guideDisplayHeight * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        video,
        cropX, cropY, cropWidth, cropHeight, // source
        0, 0, cropWidth, cropHeight          // destination
      );
      
      // Resize to a manageable size if needed
      const finalCanvas = document.createElement('canvas');
      const MAX_WIDTH = 1000;
      const scale = MAX_WIDTH / cropWidth;
      finalCanvas.width = MAX_WIDTH;
      finalCanvas.height = cropHeight * scale;
      const finalCtx = finalCanvas.getContext('2d');
      finalCtx?.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height);

      onCapture(finalCanvas.toDataURL('image/jpeg', 0.85));
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
        >
          {/* Header */}
          <div className="absolute top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
            <h3 className="text-white font-medium">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-white rounded-full bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Camera Viewport */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            {error ? (
              <div className="p-6 text-center">
                <p className="text-white mb-4">{error}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-primary text-white rounded-custom font-bold"
                >
                  Volver
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Overlay Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Darkened area */}
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* Clear Guide Hole */}
                  <div 
                    className="relative w-[85%] aspect-[1.586] rounded-[24px] shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] border-2 border-white/30"
                  >
                    {/* Corners */}
                    <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-[24px]" />
                    <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-[24px]" />
                    <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-[24px]" />
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-[24px]" />
                  </div>

                  <p className="absolute top-[20%] text-white text-center font-medium bg-black/50 px-4 py-1 rounded-full text-sm">
                    Alineá tu DNI dentro del marco
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer / Controls */}
          <div className="h-32 px-8 flex items-center justify-center gap-12 bg-black">
            <button
              type="button"
              onClick={toggleCamera}
              className="w-12 h-12 flex items-center justify-center text-white rounded-full bg-white/10"
            >
              <RefreshCw className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              disabled={!isReady}
              className={cn(
                "w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1",
                !isReady && "opacity-50"
              )}
            >
              <div className="w-full h-full bg-white rounded-full active:scale-90 transition-transform flex items-center justify-center">
                <Camera className="w-8 h-8 text-black" />
              </div>
            </button>
            <div className="w-12" /> {/* Spacer to balance flip button */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
