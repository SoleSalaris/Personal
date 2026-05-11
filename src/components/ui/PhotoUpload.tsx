import { Upload, Camera as CameraIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useState } from 'react';
import { CameraModal } from './CameraModal';

interface PhotoUploadProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export const PhotoUpload = ({ label, value, onChange, error }: PhotoUploadProps) => {
  const [preview, setPreview] = useState(value);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleCapture = (imageData: string) => {
    setPreview(imageData);
    onChange(imageData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const result = canvas.toDataURL('image/jpeg', 0.8);
          setPreview(result);
          onChange(result);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const inputId = `upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const openCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only use custom camera if mediaDevices is supported and it's not a generic file upload
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsCameraOpen(true);
    } else {
      document.getElementById(inputId)?.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gris-med">{label}</label>
      <div
        className={cn(
          "relative group w-full aspect-video rounded-custom border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 overflow-hidden",
          error ? "border-error bg-error/5" : "border-gris-border bg-surface hover:bg-gris-divider/50",
          preview && "border-solid border-gris-divider"
        )}
        onClick={openCamera}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-contain" />
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-primary mb-2">
              <CameraIcon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gris-light text-center">
              Tomar foto guía
            </span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <span className="text-xs text-error font-medium">{error}</span>}

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
        title={label}
      />
    </div>
  );
};
