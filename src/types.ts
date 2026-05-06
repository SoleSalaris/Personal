import { z } from 'zod';

export const formSchema = z.object({
  // Step 1: Personal Data
  nombre: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio').regex(/^[a-zA-Z\s]+$/, 'Solo letras'),
  apellido: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio').regex(/^[a-zA-Z\s]+$/, 'Solo letras'),
  fechaNacimiento: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio').regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato inválido (dd/mm/aaaa)'),
  dni: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio').length(10, 'El DNI debe tener 8 números'),
  cuil: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio').length(13, 'El CUIL debe tener 11 números'),
  telefono: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio').length(9, 'El teléfono debe tener 8 números'),
  direccion: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio').regex(/^[a-zA-Z0-9\s]+$/, 'Solo letras y números'),
  departamento: z.string().regex(/^[a-zA-Z0-9\s]*$/, 'Solo letras y números').optional(),
  localidad: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio').regex(/^[a-zA-Z\s]+$/, 'Solo letras'),

  // Step 2: Documents
  documentoFrente: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio'),
  documentoDorso: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio'),

  // Step 3: Family
  estadoCivil: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio'),
  nombreConyuge: z.string().regex(/^[a-zA-Z\s]*$/, 'Solo letras').optional(),
  cantidadHijos: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio').regex(/^\d+$/, 'Solo números'),

  // Step 4: Labor Data
  consorcioDireccion: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio'),
  diasLaborales: z.array(z.string(), { required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio'),
  horarioSemanaRango1Desde: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio'),
  horarioSemanaRango1Hasta: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio'),
  horarioSemanaRango2Desde: z.string().optional(),
  horarioSemanaRango2Hasta: z.string().optional(),
  horarioSabadoDesde: z.string().optional(),
  horarioSabadoHasta: z.string().optional(),

  // Step 5: Signature
  firma: z.string({ required_error: 'Este campo es obligatorio', invalid_type_error: 'Este campo es obligatorio' }).min(1, 'Este campo es obligatorio'),
});

export type FormData = z.infer<typeof formSchema>;

export const STEPS = [
  'Datos personales',
  'Documento de identidad',
  'Datos familiares',
  'Datos laborales',
  'Firma digital'
] as const;
