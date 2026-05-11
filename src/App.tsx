/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  SendHorizontal, 
  Info, 
  CheckCircle2,
  Calendar,
  Clock,
  Briefcase,
  Users
} from 'lucide-react';
import { formSchema, type FormData, STEPS } from './types';
import { cn, formatters } from './lib/utils';
import { StepIndicator } from './components/ui/StepIndicator';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Chip } from './components/ui/Chip';
import { PhotoUpload } from './components/ui/PhotoUpload';
import { SignaturePad } from './components/ui/SignaturePad';
import { generatePDF, shareFile } from './lib/pdf';

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00 hs`;
});

const DEFAULT_VALUES: Partial<FormData> = {
  cantidadHijos: '0',
  estadoCivil: 'Soltero/a',
  diasLaborales: [],
  horarioSemanaRango1Desde: '',
  horarioSemanaRango1Hasta: '',
  horarioSemanaRango2Desde: '',
  horarioSemanaRango2Hasta: '',
  horarioSabadoDesde: '',
  horarioSabadoHasta: '',
};

const STORAGE_KEY = 'legajo_form_data';

export default function App() {
  const [view, setView] = useState<'welcome' | 'form' | 'success'>('welcome');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_VALUES)),
    mode: 'onTouched',
  });

  const formData = watch();
  
  // Clear data on Ctrl+R
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (view === 'form') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (err) {
        console.warn('Could not save form data to localStorage (possibly quota exceeded):', err);
      }
    }
  }, [formData, view]);

  // Clear spouse name if disabled
  useEffect(() => {
    if (!['Casado/a', 'Unión Convivencial'].includes(formData.estadoCivil) && formData.nombreConyuge) {
      setValue('nombreConyuge', '');
    }
  }, [formData.estadoCivil, setValue, formData.nombreConyuge]);

  // Handle weekday range overlaps
  useEffect(() => {
    if (formData.horarioSemanaRango1Hasta && formData.horarioSemanaRango2Desde) {
      if (formData.horarioSemanaRango2Desde <= formData.horarioSemanaRango1Hasta) {
        setValue('horarioSemanaRango2Desde', '');
        setValue('horarioSemanaRango2Hasta', '');
      }
    }
  }, [formData.horarioSemanaRango1Hasta, setValue, formData.horarioSemanaRango2Desde]);

  const nextStep = async () => {
    const fieldsByStep: (keyof FormData)[][] = [
      ['nombre', 'apellido', 'fechaNacimiento', 'dni', 'cuil', 'telefono', 'direccion', 'localidad'],
      ['documentoFrente', 'documentoDorso'],
      ['estadoCivil', 'cantidadHijos'],
      ['consorcioDireccion', 'diasLaborales', 'horarioSemanaRango1Desde', 'horarioSemanaRango1Hasta'],
      ['firma'],
    ];

    const isValid = await trigger(fieldsByStep[currentStep]);
    
    if (isValid) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        onFinalSubmit(formData);
      }
    } else {
      // Find first error and scroll to it
      const firstError = (Object.keys(errors) as (keyof FormData)[]).find(key => fieldsByStep[currentStep].includes(key));
      if (firstError) {
        const element = document.getElementsByName(firstError)[0];
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onFinalSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const pdfBlob = await generatePDF(data);
      const shared = await shareFile(pdfBlob, `Legajo_${data.apellido}_${data.nombre}.pdf`);
      
      localStorage.removeItem(STORAGE_KEY);
      setView('success');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'welcome') {
    return (
      <div className="min-h-screen w-full flex flex-col bg-surface m-0 p-0 overflow-x-hidden">
        {/* Header Section: Logo centered in green background */}
        <div className="w-full h-[50vh] bg-[#E6EDE9] flex items-center justify-center m-0 p-0">
          <div className="text-center px-0 w-full">
            <div className="text-xl font-bold text-gris-dark leading-none">
              Administración <span className="text-primary italic font-extrabold">Salaris</span> S.R.L.
            </div>
            <div className="w-full text-[9px] text-gris-light mt-1 uppercase tracking-widest font-bold mx-auto">
              Consorcios, Edificios, Barrios cerrados y Countries
            </div>
          </div>
        </div>

        {/* Content Section: Text, Info Box, and CTA */}
        <div className="flex-1 flex flex-col items-center justify-start py-12 px-6 bg-surface">
          <div className="text-center mb-10 space-y-4 w-full">
            <h1 className="text-2xl font-extrabold text-gris-dark tracking-tight leading-tight">
              Ficha de datos personales
            </h1>
            <p className="text-base text-gris-med font-medium">
              Completá el formulario para que actualicemos tu legajo.
            </p>
          </div>

          <div className="w-full h-[56px] px-6 bg-white border border-gris-divider rounded shadow-sm flex items-center gap-4 mb-12">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm font-semibold text-gris-med leading-snug">
              Vamos a pedirte foto de tu DNI.
            </p>
          </div>

          <button
            onClick={() => setView('form')}
            className="w-full h-12 bg-primary text-white rounded font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            Completar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-8 max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-verde-light flex items-center justify-center text-primary mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-gris-dark tracking-tight">
            Gracias por compartirnos tu ficha de datos
          </h1>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-gris-med font-bold mx-auto hover:text-primary transition-colors py-4 px-6 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a la ficha
          </button>
        </motion.div>
        
        <div className="absolute bottom-10 text-gris-light text-sm font-medium">
          © {new Date().getFullYear()} Administración Salaris SRL
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col m-0 p-0 overflow-x-hidden">
      <div className="w-full flex-1 flex flex-col items-center py-8 px-6" ref={formRef}>
        <div className="w-full max-w-lg mb-8">
          <StepIndicator currentStep={currentStep} />
        </div>

        <form 
          className="bg-white p-6 rounded-custom shadow-sm border border-gris-divider space-y-8 w-full max-w-lg"
          onSubmit={(e) => e.preventDefault()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {currentStep === 0 && (
                <div className="space-y-6">
                  <h2 className="font-bold text-lg text-gris-dark">Datos personales</h2>
                  <Controller
                    name="nombre"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Nombre"
                        placeholder="Ej: Juan"
                        error={errors.nombre?.message}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      />
                    )}
                  />
                  <Controller
                    name="apellido"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Apellido"
                        placeholder="Ej: Pérez"
                        error={errors.apellido?.message}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      />
                    )}
                  />
                  <Controller
                    name="fechaNacimiento"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Fecha de nacimiento"
                        placeholder="dd/mm/aaaa"
                        inputMode="numeric"
                        error={errors.fechaNacimiento?.message}
                        {...field}
                        onChange={(e) => field.onChange(formatters.date(e.target.value))}
                      />
                    )}
                  />
                  <Controller
                    name="dni"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="DNI"
                        placeholder="00.000.000"
                        inputMode="numeric"
                        error={errors.dni?.message}
                        {...field}
                        onChange={(e) => field.onChange(formatters.dni(e.target.value))}
                      />
                    )}
                  />
                  <Controller
                    name="cuil"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="CUIL"
                        placeholder="00-00000000-0"
                        inputMode="numeric"
                        error={errors.cuil?.message}
                        {...field}
                        onChange={(e) => field.onChange(formatters.cuil(e.target.value))}
                      />
                    )}
                  />
                  <Controller
                    name="telefono"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Teléfono"
                        placeholder="0000-0000"
                        prefix="11"
                        inputMode="numeric"
                        error={errors.telefono?.message}
                        {...field}
                        onChange={(e) => field.onChange(formatters.phone(e.target.value))}
                      />
                    )}
                  />
                  
                  <div className="pt-4 border-t border-gris-divider" />
                  
                  <h2 className="font-bold text-lg text-gris-dark">Domicilio</h2>
                  <Controller
                    name="direccion"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Dirección"
                        placeholder="Calle y número"
                        error={errors.direccion?.message}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z0-9\s]/g, ''))}
                      />
                    )}
                  />
                  <Controller
                    name="departamento"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Departamento (opcional)"
                        placeholder="Piso y departamento"
                        error={errors.departamento?.message}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z0-9\s]/g, ''))}
                      />
                    )}
                  />
                  <Controller
                    name="localidad"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Localidad"
                        placeholder="Ej: Martínez"
                        error={errors.localidad?.message}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      />
                    )}
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  <Controller
                    name="documentoFrente"
                    control={control}
                    render={({ field }) => (
                      <PhotoUpload
                        label="Frente del DNI"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.documentoFrente?.message}
                      />
                    )}
                  />
                  <Controller
                    name="documentoDorso"
                    control={control}
                    render={({ field }) => (
                      <PhotoUpload
                        label="Dorso del DNI"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.documentoDorso?.message}
                      />
                    )}
                  />
                  <div className="p-4 bg-surface rounded-custom space-y-3 border border-gris-divider">
                    <span className="text-xs font-black text-primary tracking-widest uppercase">TIPS</span>
                    <ul className="text-sm font-medium text-gris-med space-y-2">
                      <li className="flex gap-3">
                        <span className="text-primary">•</span>
                        Buscá un lugar con buena luz.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-primary">•</span>
                        Apoyá el DNI en una superficie.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-primary">•</span>
                        Enfocá bien el DNI con la cámara.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <Controller
                    name="estadoCivil"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Estado civil"
                        error={errors.estadoCivil?.message}
                        {...field}
                      >
                        <option value="Soltero/a">Soltero/a</option>
                        <option value="Casado/a">Casado/a</option>
                        <option value="Divorciado/a">Divorciado/a</option>
                        <option value="Viudo/a">Viudo/a</option>
                        <option value="Unión Convivencial">Unión Convivencial</option>
                      </Select>
                    )}
                  />
                  <Controller
                    name="nombreConyuge"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Nombre del cónyuge"
                        placeholder="Ej: Juan"
                        error={errors.nombreConyuge?.message}
                        {...field}
                        disabled={!['Casado/a', 'Unión Convivencial'].includes(formData.estadoCivil)}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      />
                    )}
                  />
                  <Controller
                    name="cantidadHijos"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Cantidad de hijos"
                        inputMode="numeric"
                        error={errors.cantidadHijos?.message}
                        {...field}
                        onChange={(e) => {
                           const val = e.target.value.replace(/\D/g, '');
                           field.onChange(val);
                        }}
                      />
                    )}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="font-bold text-lg text-gris-dark">Consorcio</h2>
                    <Controller
                      name="consorcioDireccion"
                      control={control}
                      render={({ field }) => (
                        <Input
                          label="Dirección"
                          placeholder="Calle y número"
                          error={errors.consorcioDireccion?.message}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z0-9\s]/g, ''))}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <h2 className="font-bold text-lg text-gris-dark">Días laborales</h2>
                    <p className="text-sm font-medium text-gris-light">Seleccioná los días que trabajás.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                        <Chip
                           key={day}
                           label={day}
                           selected={formData.diasLaborales?.includes(day)}
                           onClick={() => {
                             const current = formData.diasLaborales || [];
                             const next = current.includes(day)
                               ? current.filter(d => d !== day)
                               : [...current, day];
                             setValue('diasLaborales', next, { shouldValidate: true });
                           }}
                        />
                      ))}
                    </div>
                    {errors.diasLaborales && (
                      <span className="text-xs text-error font-medium">{errors.diasLaborales.message}</span>
                    )}
                  </div>

                  <div className="space-y-6 pt-4 border-t border-gris-divider">
                    <h2 className="font-bold text-lg text-gris-dark">Horario</h2>
                    
                    <div className="bg-surface p-4 rounded-custom space-y-8 border border-gris-divider">
                      <div className="space-y-4">
                        <h3 className="font-bold text-sm text-gris-med uppercase tracking-wider">Días de semana</h3>
                        
                        {/* Rango 1 */}
                        <div className="space-y-2">
                          <span className="block text-sm font-semibold text-gris-med">Rango 1</span>
                          <div className="flex items-center gap-3">
                            <Controller
                              name="horarioSemanaRango1Desde"
                              control={control}
                              render={({ field }) => (
                                <Select {...field}>
                                  <option value="" disabled hidden>Inicio</option>
                                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                              )}
                            />
                            <span className="text-gris-border font-bold">a</span>
                            <Controller
                              name="horarioSemanaRango1Hasta"
                              control={control}
                              render={({ field }) => (
                                <Select 
                                  disabled={!formData.horarioSemanaRango1Desde}
                                  {...field}
                                >
                                  <option value="" disabled>Fin</option>
                                  {TIME_OPTIONS.filter(t => t > formData.horarioSemanaRango1Desde).map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                              )}
                            />
                          </div>
                        </div>

                        {/* Rango 2 */}
                        <div className="space-y-2">
                          <span className="block text-sm font-semibold text-gris-med">Rango 2 (opcional)</span>
                          <div className="flex items-center gap-3">
                            <Controller
                              name="horarioSemanaRango2Desde"
                              control={control}
                              render={({ field }) => (
                                <Select 
                                  disabled={!formData.horarioSemanaRango1Hasta}
                                  {...field}
                                >
                                  <option value="" disabled hidden>Inicio</option>
                                  {TIME_OPTIONS.filter(t => t > (formData.horarioSemanaRango1Hasta || '23:59')).map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                              )}
                            />
                            <span className="text-gris-border font-bold">a</span>
                            <Controller
                              name="horarioSemanaRango2Hasta"
                              control={control}
                              render={({ field }) => (
                                <Select 
                                  disabled={!formData.horarioSemanaRango2Desde}
                                  {...field}
                                >
                                  <option value="" disabled>Fin</option>
                                  {TIME_OPTIONS.filter(t => t > (formData.horarioSemanaRango2Desde || '')).map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-gris-divider">
                        <h3 className="font-bold text-sm text-gris-med uppercase tracking-wider">Sábados</h3>
                        <div className="flex items-center gap-3">
                          <Controller
                            name="horarioSabadoDesde"
                            control={control}
                            render={({ field }) => (
                              <Select 
                                disabled={!formData.diasLaborales?.includes('Sábado')}
                                {...field}
                              >
                                <option value="" disabled hidden>Inicio</option>
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </Select>
                            )}
                          />
                          <span className="text-gris-border font-bold">a</span>
                          <Controller
                            name="horarioSabadoHasta"
                            control={control}
                            render={({ field }) => (
                              <Select 
                                disabled={!formData.diasLaborales?.includes('Sábado') || !formData.horarioSabadoDesde}
                                {...field}
                              >
                                <option value="" disabled>Fin</option>
                                {TIME_OPTIONS.filter(t => t > (formData.horarioSabadoDesde || '')).map(t => <option key={t} value={t}>{t}</option>)}
                              </Select>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 flex flex-col justify-center min-h-[40vh]">
                  <Controller
                    name="firma"
                    control={control}
                    render={({ field }) => (
                      <SignaturePad
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.firma?.message}
                      />
                    )}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </form>

        <div className="mt-8 flex gap-3 w-full max-w-lg mb-12">
          <button
            type="button"
            onClick={prevStep}
            className={cn(
              "px-6 h-12 bg-white border border-gris-border text-gris-med rounded-custom font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm shrink-0",
              currentStep === 0 && "opacity-50 !cursor-not-allowed"
            )}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-5 h-5 flex-none" />
            <span>Anterior</span>
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={isSubmitting}
            className="flex-1 h-12 bg-primary text-white rounded-custom font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 whitespace-nowrap min-w-0"
          >
            <span className="truncate">
              {currentStep === STEPS.length - 1 ? (
                isSubmitting ? 'Generando...' : 'Compartir datos'
              ) : (
                'Siguiente'
              )}
            </span>
            {currentStep === STEPS.length - 1 ? (
              <SendHorizontal className="w-5 h-5 flex-none" />
            ) : (
              <ArrowRight className="w-5 h-5 flex-none" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
