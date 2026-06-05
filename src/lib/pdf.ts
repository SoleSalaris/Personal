import { jsPDF } from 'jspdf';
import { FormData } from '../types';

export const generatePDF = async (data: FormData) => {
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 71, 35); // Primary Green
  doc.text('Ficha de datos personales', 20, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()} hs`, 20, y);

  y += 15;
  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 10;

  const addField = (label: string, value: string | undefined) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(value || '-', 70, y);
    y += 8;
  };

  const addSection = (title: string) => {
    y += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 71, 35);
    doc.text(title, 20, y);
    y += 10;
    doc.setFontSize(11);
  };

  addSection('Datos Personales');
  addField('Nombre', data.nombre);
  addField('Apellido', data.apellido);
  addField('Fecha de Nacimiento', data.fechaNacimiento);
  addField('DNI', data.dni);
  addField('CUIL', data.cuil);
  addField('Teléfono', `11 ${data.telefono}`);
  addField('Dirección', data.direccion);
  addField('Departamento', data.departamento);
  addField('Localidad', data.localidad);

  addSection('Datos Familiares');
  addField('Estado Civil', data.estadoCivil);
  addField('Cónyuge', data.nombreConyuge);
  addField('Cantidad de Hijos', data.cantidadHijos);

  addSection('Datos Laborales');
  addField('Consorcio', data.consorcioDireccion);
  addField('Días que trabaja', data.diasLaborales.join(', '));
  addField('Horario L-V', `${data.horarioSemanaRango1Desde} a ${data.horarioSemanaRango1Hasta}${data.horarioSemanaRango2Desde ? ` / ${data.horarioSemanaRango2Desde} a ${data.horarioSemanaRango2Hasta}` : ''}`);
  if (data.horarioSabadoRango1Desde) {
    addField('Horario Sábados', `${data.horarioSabadoRango1Desde} a ${data.horarioSabadoRango1Hasta}${data.horarioSabadoRango2Desde ? ` / ${data.horarioSabadoRango2Desde} a ${data.horarioSabadoRango2Hasta}` : ''}`);
  }

  // Photos and Signature on a new page
  doc.addPage();
  y = 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 71, 35);
  doc.text('Documentos y Firma', 20, y);
  
  y += 15;
  doc.setFontSize(11);
  doc.setTextColor(50);
  doc.text('Frente del DNI:', 20, y);
  y += 5;
  doc.addImage(data.documentoFrente, 'JPEG', 20, y, 140, 85);
  
  y += 95;
  doc.text('Dorso del DNI:', 20, y);
  y += 5;
  doc.addImage(data.documentoDorso, 'JPEG', 20, y, 140, 85);
  
  y += 100;
  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  doc.setTextColor(50);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma del trabajador:', 20, y);
  y += 5;
  doc.addImage(data.firma, 'PNG', 20, y, 60, 30);

  return doc.output('blob');
};

export const shareFile = async (blob: Blob, name: string) => {
  const file = new File([blob], name, { type: 'application/pdf' });
  
  if (navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Legajo Digital',
        text: 'Legajo digital compartido desde la app de Administración Salaris.',
      });
      return true;
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      return false;
    }
  } else {
    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    return false;
  }
};
