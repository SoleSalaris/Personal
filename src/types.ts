import { z } from 'zod';

export const formSchema = z.object({
  // Step 1: Personal Data
  nombre: z.string().min(1, 'Este campo es obligatorio').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras'),
  apellido: z.string().min(1, 'Este campo es obligatorio').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras'),
  fechaNacimiento: z.string().min(1, 'Este campo es obligatorio').regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato inválido (dd/mm/aaaa)'),
  dni: z.string().min(1, 'Este campo es obligatorio').length(10, 'El DNI debe tener 8 números'),
  cuil: z.string().min(1, 'Este campo es obligatorio').length(13, 'El CUIL debe tener 11 números'),
  telefono: z.string().min(1, 'Este campo es obligatorio').length(9, 'El teléfono debe tener 8 números'),
  direccion: z.string().min(1, 'Este campo es obligatorio').regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras y números'),
  departamento: z.string().regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo letras y números').optional(),
  localidad: z.string().min(1, 'Este campo es obligatorio').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras'),

  // Step 2: Documents
  documentoFrente: z.string().min(1, 'Este campo es obligatorio'),
  documentoDorso: z.string().min(1, 'Este campo es obligatorio'),

  // Step 3: Family
  estadoCivil: z.string().min(1, 'Este campo es obligatorio'),
  nombreConyuge: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo letras').optional(),
  cantidadHijos: z.string().min(1, 'Este campo es obligatorio').regex(/^\d+$/, 'Solo números'),

  // Step 4: Labor Data
  consorcioDireccion: z.string().min(1, 'Este campo es obligatorio'),
  diasLaborales: z.array(z.string()).min(1, 'Este campo es obligatorio'),
  horarioSemanaRango1Desde: z.string().min(1, 'Este campo es obligatorio'),
  horarioSemanaRango1Hasta: z.string().min(1, 'Este campo es obligatorio'),
  horarioSemanaRango2Desde: z.string().optional(),
  horarioSemanaRango2Hasta: z.string().optional(),
  horarioSabadoDesde: z.string().optional(),
  horarioSabadoHasta: z.string().optional(),

  // Step 5: Signature
  firma: z.string().min(1, 'Este campo es obligatorio'),
});

export type FormData = z.infer<typeof formSchema>;

export const STEPS = [
  'Datos personales',
  'Documento de identidad',
  'Datos familiares',
  'Datos laborales',
  'Firma digital'
] as const;
