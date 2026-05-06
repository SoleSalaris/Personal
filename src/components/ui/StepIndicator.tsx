import { STEPS } from '@/src/types';

interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const percentage = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
          PASO {currentStep + 1} DE {STEPS.length}
        </span>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {STEPS[currentStep]}
        </h1>
      </div>
      <div className="flex gap-2 w-full h-1.5">
        {STEPS.map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 rounded-full transition-all duration-300 ${
              idx <= currentStep ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
