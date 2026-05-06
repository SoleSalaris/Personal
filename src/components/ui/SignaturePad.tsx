import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SignaturePadProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export const SignaturePad = ({ value, onChange, error }: SignaturePadProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    onChange('');
  };

  const onEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      onChange(dataUrl);
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gris-med">Firmá con el dedo dentro del recuadro.</p>
      <div 
        className={cn(
          "w-full h-80 rounded-custom border border-dashed bg-white overflow-hidden transition-all",
          error ? "border-error bg-error/5" : "border-gris-border focus-within:border-primary"
        )}
      >
        <SignatureCanvas
          ref={sigCanvas}
          onEnd={onEnd}
          penColor="#004721"
          canvasProps={{
            className: 'w-full h-full cursor-crosshair',
          }}
        />
      </div>
      <button
        type="button"
        onClick={clear}
        className="flex items-center gap-2 text-gris-light hover:text-error transition-colors text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
        Limpiar
      </button>
      {error && <span className="text-xs text-error font-medium">{error}</span>}
    </div>
  );
};
