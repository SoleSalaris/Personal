/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import { 
  User, 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  Send, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from './lib/utils';

interface FormData {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string;
  dni: string;
  cuil: string;
  domicilio: string;
  departamento: string;
  localidad: string;
  estadoCivil: 'soltero/a' | 'casado/a' | 'divorciado/a';
  nombreConyuge: string;
  cantidadHijos: string;
  diasLaborales: string[];
  horarioSemanaInicio1: string;
  horarioSemanaFin1: string;
  horarioSemanaInicio2: string;
  horarioSemanaFin2: string;
  horarioSabadoInicio: string;
  horarioSabadoFin: string;
}

const INITIAL_DATA: FormData = {
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  telefono: '',
  dni: '',
  cuil: '',
  domicilio: '',
  departamento: '',
  localidad: '',
  estadoCivil: 'soltero/a',
  nombreConyuge: '',
  cantidadHijos: '0',
  diasLaborales: [],
  horarioSemanaInicio1: '',
  horarioSemanaFin1: '',
  horarioSemanaInicio2: '',
  horarioSemanaFin2: '',
  horarioSabadoInicio: '',
  horarioSabadoFin: '',
};

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const TIME_OPTIONS = Array.from({ length: 24 }).map((_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

// Helper to format DNI: 00.000.000
const formatDNI = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
};

// Helper to format CUIL: 00-00000000-0
const formatCUIL = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
};

// Helper to format Phone: 0000-0000 (assumes prefix 11 is handled separately)
const formatPhone = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

// Helper to format Date: dd/mm/aaaa
const formatDate = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function App() {
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'firma', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Character validation
    if (['nombre', 'apellido', 'localidad', 'nombreConyuge'].includes(name)) {
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) return;
    }
    
    if (['domicilio', 'departamento'].includes(name)) {
      if (!/^[a-zA-Z0-9\s]*$/.test(value)) return;
    }

    let finalValue = value;
    if (name === 'dni') finalValue = formatDNI(value);
    if (name === 'cuil') finalValue = formatCUIL(value);
    if (name === 'telefono') finalValue = formatPhone(value);
    if (name === 'fechaNacimiento') finalValue = formatDate(value);

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    // Clear error for the field being changed
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof newErrors];
        return newErrors;
      });
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => {
      const newDays = prev.diasLaborales.includes(day)
        ? prev.diasLaborales.filter(d => d !== day)
        : [...prev.diasLaborales, day];
      
      // Clear error if at least one day is selected
      if (newDays.length > 0 && errors.diasLaborales) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.diasLaborales;
          return newErrors;
        });
      }
      
      return { ...prev, diasLaborales: newDays };
    });
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.firma;
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData | 'firma', string>> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio.';
    
    const cleanDNI = formData.dni.replace(/\D/g, '');
    if (cleanDNI.length !== 8) newErrors.dni = 'El DNI debe tener 8 números.';
    
    const cleanCUIL = formData.cuil.replace(/\D/g, '');
    if (cleanCUIL.length !== 11) newErrors.cuil = 'El CUIL debe tener 11 números.';
    
    const cleanFecha = formData.fechaNacimiento.replace(/\D/g, '');
    if (cleanFecha.length !== 8) newErrors.fechaNacimiento = 'La fecha debe tener el formato dd/mm/aaaa.';
    
    const cleanPhone = formData.telefono.replace(/\D/g, '');
    if (cleanPhone.length !== 8) newErrors.telefono = 'El teléfono debe tener 8 números.';
    
    if (!formData.domicilio.trim()) newErrors.domicilio = 'El domicilio es obligatorio.';
    if (!formData.localidad.trim()) newErrors.localidad = 'La localidad es obligatoria.';
    
    if (formData.diasLaborales.length === 0) newErrors.diasLaborales = 'Seleccione al menos un día laboral.';
    
    if (!formData.horarioSemanaInicio1 || !formData.horarioSemanaFin1) {
      newErrors.horarioSemanaInicio1 = 'El horario de días de semana es obligatorio.';
    }

    if (sigCanvas.current?.isEmpty()) {
      newErrors.firma = 'La firma es obligatoria.';
    }

    setErrors(newErrors);

    // Scroll to the first error
    const firstErrorField = Object.keys(newErrors)[0];
    if (firstErrorField) {
      const element = document.getElementsByName(firstErrorField)[0] || 
                     document.querySelector(`[data-error-anchor="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
          element.focus();
        }
      }
      return false;
    }

    return true;
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.text('Ficha de datos personales', margin, y);
    y += 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos Personales', margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${formData.nombre}`, margin, y); y += 7;
    doc.text(`Apellido: ${formData.apellido}`, margin, y); y += 7;
    doc.text(`DNI: ${formData.dni}`, margin, y); y += 7;
    doc.text(`CUIL: ${formData.cuil}`, margin, y); y += 7;
    doc.text(`Fecha de nacimiento: ${formData.fechaNacimiento}`, margin, y); y += 7;
    doc.text(`Teléfono: 11 ${formData.telefono}`, margin, y); y += 7;
    doc.text(`Domicilio: ${formData.domicilio}`, margin, y); y += 7;
    doc.text(`Departamento: ${formData.departamento || 'N/A'}`, margin, y); y += 7;
    doc.text(`Localidad: ${formData.localidad}`, margin, y); y += 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos Familiares', margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Estado civil: ${formData.estadoCivil}`, margin, y); y += 7;
    doc.text(`Nombre del cónyuge: ${formData.nombreConyuge || 'N/A'}`, margin, y); y += 7;
    doc.text(`Cantidad de hijos: ${formData.cantidadHijos || '0'}`, margin, y); y += 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos Laborales', margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Días: ${formData.diasLaborales.join(', ')}`, margin, y); y += 7;
    
    const horarioSemana = `${formData.horarioSemanaInicio1} a ${formData.horarioSemanaFin1}${formData.horarioSemanaInicio2 ? ` y ${formData.horarioSemanaInicio2} a ${formData.horarioSemanaFin2}` : ''}`;
    doc.text(`Horario días de semana: ${horarioSemana}`, margin, y); y += 7;
    
    const horarioSabado = formData.horarioSabadoInicio ? `${formData.horarioSabadoInicio} a ${formData.horarioSabadoFin}` : 'N/A';
    doc.text(`Horario sábados: ${horarioSabado}`, margin, y); y += 20;

    // Signature
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma', margin, y);
    y += 5;
    
    const sigData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (sigData) {
      doc.addImage(sigData, 'PNG', margin, y, 50, 25);
    }

    return doc;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const doc = await generatePDF();
      if (!doc) {
        setIsSubmitting(false);
        return;
      }

      const fileName = `legajo_${formData.apellido}_${formData.nombre}.pdf`.replace(/\s+/g, '_');
      const pdfBlob = doc.output('blob');
      
      // Native sharing
      if (navigator.share) {
        try {
          const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
          await navigator.share({
            files: [file],
            title: 'Legajo Personal',
            text: `Legajo de ${formData.nombre} ${formData.apellido}`,
          });
          setStatus({ 
            type: 'success', 
            message: 'Legajo compartido correctamente.' 
          });
        } catch (shareError) {
          if ((shareError as Error).name !== 'AbortError') {
            console.error('Error sharing:', shareError);
            doc.save(fileName);
            setStatus({ 
              type: 'success', 
              message: 'PDF generado para descarga (hubo un problema al compartir).' 
            });
          }
        }
      } else {
        doc.save(fileName);
        setStatus({ 
          type: 'success', 
          message: 'PDF generado y descargado (su navegador no soporta compartir).' 
        });
      }
    } catch (error) {
      console.error('Error processing form:', error);
      setStatus({ type: 'error', message: 'Error inesperado al generar el legajo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidTimes = (afterTime?: string) => {
    if (!afterTime) return TIME_OPTIONS;
    const startIndex = TIME_OPTIONS.indexOf(afterTime);
    return TIME_OPTIONS.slice(startIndex + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          <div className="bg-indigo-600 p-6 sm:p-8 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold">Ficha de datos personales</h1>
            <p className="mt-2 text-indigo-100">Completá el formulario para que actualicemos tu legajo.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8" noValidate>
            {/* Personal Data Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-100 pb-2">
                <h2 className="text-lg font-semibold uppercase tracking-wider">Datos Personales</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Nombre <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Juan"
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all placeholder:text-slate-400",
                      errors.nombre ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    )}
                  />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Apellido <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    placeholder="Ej: Perez"
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all placeholder:text-slate-400",
                      errors.apellido ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    )}
                  />
                  {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">DNI <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    placeholder="00.000.000"
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all placeholder:text-slate-400",
                      errors.dni ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    )}
                  />
                  {errors.dni && <p className="text-red-500 text-xs mt-1">{errors.dni}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">CUIL <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="cuil"
                    value={formData.cuil}
                    onChange={handleInputChange}
                    placeholder="00-00000000-0"
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all placeholder:text-slate-400",
                      errors.cuil ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    )}
                  />
                  {errors.cuil && <p className="text-red-500 text-xs mt-1">{errors.cuil}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Fecha de nacimiento <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleInputChange}
                    placeholder="dd/mm/aaaa"
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all placeholder:text-slate-400",
                      errors.fechaNacimiento ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    )}
                  />
                  {errors.fechaNacimiento && <p className="text-red-500 text-xs mt-1">{errors.fechaNacimiento}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Teléfono <span className="text-red-500">*</span></label>
                  <div className={cn(
                    "flex items-center w-full px-4 py-2 rounded-lg border focus-within:ring-2 outline-none transition-all bg-white",
                    errors.telefono ? "border-red-500 focus-within:ring-red-200" : "border-slate-300 focus-within:ring-indigo-500 focus-within:border-indigo-500"
                  )}>
                    <span className="text-slate-900 font-normal mr-1 select-none whitespace-nowrap">11 </span>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="0000-0000"
                      className="flex-1 bg-transparent outline-none border-none p-0 focus:ring-0 placeholder:text-slate-400"
                    />
                  </div>
                  {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
                </div>
              </div>

              {/* Address row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-sm font-medium text-slate-700">Domicilio <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="domicilio"
                    value={formData.domicilio}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all",
                      errors.domicilio ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    )}
                  />
                  {errors.domicilio && <p className="text-red-500 text-xs mt-1">{errors.domicilio}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Departamento</label>
                  <input
                    type="text"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Localidad <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="localidad"
                    value={formData.localidad}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all",
                      errors.localidad ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    )}
                  />
                  {errors.localidad && <p className="text-red-500 text-xs mt-1">{errors.localidad}</p>}
                </div>
              </div>
            </section>

            {/* Family Data Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-100 pb-2">
                <h2 className="text-lg font-semibold uppercase tracking-wider">Datos Familiares</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Estado civil <span className="text-red-500">*</span></label>
                  <select
                    name="estadoCivil"
                    value={formData.estadoCivil}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                  >
                    <option value="soltero/a">Soltero/a</option>
                    <option value="casado/a">Casado/a</option>
                    <option value="divorciado/a">Divorciado/a</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-sm font-medium text-slate-700">Nombre del cónyuge</label>
                  <input
                    type="text"
                    name="nombreConyuge"
                    disabled={formData.estadoCivil === 'soltero/a'}
                    value={formData.nombreConyuge}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Cantidad de hijos</label>
                  <input
                    type="number"
                    min="0"
                    name="cantidadHijos"
                    value={formData.cantidadHijos}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Work Data Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-100 pb-2">
                <h2 className="text-lg font-semibold uppercase tracking-wider">Datos Laborales</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2" data-error-anchor="diasLaborales">
                  <label className="text-sm font-medium text-slate-700">
                    Días laborales <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-400 font-normal mt-[-4px] mb-2">Seleccioná los que correspondan</p>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {DIAS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all border w-full sm:w-auto",
                          formData.diasLaborales.includes(day)
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : cn(
                                "bg-white text-slate-600 border-slate-300 hover:border-indigo-400",
                                errors.diasLaborales && "border-red-400"
                              )
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {errors.diasLaborales && <p className="text-red-500 text-xs mt-1">{errors.diasLaborales}</p>}
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">
                      Horario días de semana <span className="text-red-500">*</span>
                    </label>
                    <div className={cn(
                      "grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border transition-colors",
                      errors.horarioSemanaInicio1 ? "border-red-300" : "border-slate-200"
                    )}>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rango 1</p>
                        <div className="flex items-center gap-2">
                          <select
                            name="horarioSemanaInicio1"
                            value={formData.horarioSemanaInicio1}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                          >
                            <option value="">Inicio</option>
                            {TIME_OPTIONS.map(time => <option key={`s1-i-${time}`} value={time}>{time}</option>)}
                          </select>
                          <span className="text-slate-400 font-medium">a</span>
                          <select
                            name="horarioSemanaFin1"
                            value={formData.horarioSemanaFin1}
                            onChange={handleInputChange}
                            disabled={!formData.horarioSemanaInicio1}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white disabled:bg-slate-100"
                          >
                            <option value="">Fin</option>
                            {getValidTimes(formData.horarioSemanaInicio1).map(time => <option key={`s1-f-${time}`} value={time}>{time}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rango 2 (Opcional)</p>
                        <div className="flex items-center gap-2">
                          <select
                            name="horarioSemanaInicio2"
                            value={formData.horarioSemanaInicio2}
                            onChange={handleInputChange}
                            disabled={!formData.horarioSemanaFin1}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white disabled:bg-slate-100"
                          >
                            <option value="">Inicio</option>
                            {getValidTimes(formData.horarioSemanaFin1).map(time => <option key={`s2-i-${time}`} value={time}>{time}</option>)}
                          </select>
                          <span className="text-slate-400 font-medium">a</span>
                          <select
                            name="horarioSemanaFin2"
                            value={formData.horarioSemanaFin2}
                            onChange={handleInputChange}
                            disabled={!formData.horarioSemanaInicio2}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white disabled:bg-slate-100"
                          >
                            <option value="">Fin</option>
                            {getValidTimes(formData.horarioSemanaInicio2).map(time => <option key={`s2-f-${time}`} value={time}>{time}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    {errors.horarioSemanaInicio1 && <p className="text-red-500 text-xs mt-1">{errors.horarioSemanaInicio1}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">
                      Horario sábados
                    </label>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 max-w-sm">
                        <select
                          name="horarioSabadoInicio"
                          value={formData.horarioSabadoInicio}
                          onChange={handleInputChange}
                          disabled={!formData.diasLaborales.includes('Sábado')}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Inicio</option>
                          {TIME_OPTIONS.map(time => <option key={`sat-i-${time}`} value={time}>{time}</option>)}
                        </select>
                        <span className="text-slate-400 font-medium">a</span>
                        <select
                          name="horarioSabadoFin"
                          value={formData.horarioSabadoFin}
                          onChange={handleInputChange}
                          disabled={!formData.horarioSabadoInicio || !formData.diasLaborales.includes('Sábado')}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Fin</option>
                          {getValidTimes(formData.horarioSabadoInicio).map(time => <option key={`sat-f-${time}`} value={time}>{time}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Signature Section */}
            <section className="space-y-4" data-error-anchor="firma">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <h2 className="text-lg font-semibold uppercase tracking-wider">Firma digital <span className="text-red-500">*</span></h2>
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-medium"
                >
                  <Trash2 size={14} /> Limpiar
                </button>
              </div>
              <p className="text-xs text-slate-500 italic">Firmá con el dedo dentro del recuadro.</p>
              <div className={cn(
                "border-2 border-dashed rounded-xl bg-slate-50 overflow-hidden transition-colors",
                errors.firma ? "border-red-400" : "border-slate-300"
              )}>
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    className: "w-full h-48 cursor-crosshair"
                  }}
                />
              </div>
              {errors.firma && <p className="text-red-500 text-xs mt-1">{errors.firma}</p>}
            </section>

            {/* Status Messages */}
            {status && status.type === 'success' && (
              <div className="p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 bg-green-50 text-green-800 border border-green-200">
                <CheckCircle2 className="shrink-0" size={20} />
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}
            
            {status && status.type === 'error' && !Object.keys(errors).length && (
              <div className="p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 bg-red-50 text-red-800 border border-red-200">
                <AlertCircle className="shrink-0" size={20} />
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Procesando...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Compartir Legajo
                </>
              )}
            </button>
          </form>
        </div>
        
        <footer className="mt-8 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Administración Salaris SRL</p>
        </footer>
      </div>
    </div>
  );
}
