import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head: string[][];
      body: (string | number | boolean | null)[][];
      startY?: number;
      styles?: Record<string, unknown>;
      headStyles?: Record<string, unknown>;
      alternateRowStyles?: Record<string, unknown>;
      margin?: { top?: number; right?: number; bottom?: number; left?: number };
      tableWidth?: 'auto' | 'wrap' | number;
      columnStyles?: Record<string, unknown>;
    }) => jsPDF;
  }
}

// Tipos para los datos de reportes
export interface ReportData {
  title: string;
  headers: string[];
  data: (string | number | boolean | null)[][];
  metadata?: {
    generatedBy?: string;
    generatedAt?: string;
    filters?: string;
    totalRecords?: number;
  };
}

// Definición de columnas genéricas por tipo de dato de la fila
export type ColumnDef<T extends Record<string, unknown>> = {
  [K in keyof T]: {
    key: K;
    label?: string;
    header?: string;
    format?: (value: T[K]) => string;
  }
}[keyof T];

// Configuración de estilos para PDF
const pdfStyles = {
  head: {
    fillColor: [41, 128, 185],
    textColor: 255,
    fontStyle: 'bold',
    fontSize: 10
  },
  body: {
    fontSize: 9,
    textColor: 50
  },
  alternateRow: {
    fillColor: [245, 245, 245]
  }
};

/**
 * Genera un reporte en formato PDF
 */
export const generatePDFReport = (reportData: ReportData): void => {
  const doc = new jsPDF();
  
  // Configurar fuente
  doc.setFont('helvetica');
  
  // Título del reporte
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text(reportData.title, 20, 20);
  
  // Información de metadata
  let yPosition = 35;
  if (reportData.metadata) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    
    if (reportData.metadata.generatedAt) {
      doc.text(`Fecha de generación: ${reportData.metadata.generatedAt}`, 20, yPosition);
      yPosition += 7;
    }
    
    if (reportData.metadata.generatedBy) {
      doc.text(`Generado por: ${reportData.metadata.generatedBy}`, 20, yPosition);
      yPosition += 7;
    }
    
    if (reportData.metadata.filters) {
      doc.text(`Filtros aplicados: ${reportData.metadata.filters}`, 20, yPosition);
      yPosition += 7;
    }
    
    if (reportData.metadata.totalRecords) {
      doc.text(`Total de registros: ${reportData.metadata.totalRecords}`, 20, yPosition);
      yPosition += 10;
    }
  }
  
  // Tabla de datos
  doc.autoTable({
    head: [reportData.headers],
    body: reportData.data,
    startY: yPosition,
    styles: pdfStyles.body,
    headStyles: pdfStyles.head,
    alternateRowStyles: pdfStyles.alternateRow,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    tableWidth: 'auto',
    columnStyles: {
      // Ajustar ancho de columnas automáticamente
    }
  });
  
  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Sistema de Gestión de Seguridad Ciudadana (SGSC)`,
      20,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Descargar el archivo
  const fileName = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Genera un reporte en formato Excel
 */
export const generateExcelReport = (reportData: ReportData): void => {
  // Crear un nuevo libro de trabajo
  const workbook = XLSX.utils.book_new();
  
  // Preparar los datos con encabezados
  const worksheetData = [reportData.headers, ...reportData.data];
  
  // Crear la hoja de trabajo
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Configurar el ancho de las columnas
  const columnWidths = reportData.headers.map((header, index) => {
    const maxLength = Math.max(
      header.length,
      ...reportData.data.map(row => String(row[index] || '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });
  worksheet['!cols'] = columnWidths;
  
  // Aplicar estilos a los encabezados
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2980B9" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
  
  // Crear hoja de metadata si existe
  if (reportData.metadata) {
    const metadataData = [
      ['Información del Reporte'],
      ['Título', reportData.title],
      ['Fecha de generación', reportData.metadata.generatedAt || new Date().toLocaleString()],
      ['Generado por', reportData.metadata.generatedBy || 'Sistema SGSC'],
      ['Filtros aplicados', reportData.metadata.filters || 'Ninguno'],
      ['Total de registros', reportData.metadata.totalRecords || reportData.data.length]
    ];
    
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Información');
  }
  
  // Descargar el archivo
  const fileName = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Formatea datos para reportes
 */
export const formatDataForReport = <T extends Record<string, unknown>>(
  data: T[],
  columns: ColumnDef<T>[]
): { headers: string[]; data: (string | number | boolean | null)[][] } => {
  const headers = columns.map((col: ColumnDef<T>) => col.label ?? col.header ?? String(col.key));
  const formattedData = data.map((item: T) =>
    columns.map((col: ColumnDef<T>) => {
      const value = item[col.key];
      const out = col.format ? col.format(value) : (value as string | number | boolean | null) ?? '';
      return out;
    })
  );
  
  return { headers, data: formattedData };
};

/**
 * Utilidades para formatear fechas y valores comunes
 */
export const formatters = {
  date: (value: string) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('es-PE');
  },
  
  datetime: (value: string) => {
    if (!value) return '';
    return new Date(value).toLocaleString('es-PE');
  },
  
  currency: (value: number) => {
    if (typeof value !== 'number') return '';
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  },
  
  boolean: (value: boolean) => {
    return value ? 'Sí' : 'No';
  },
  
  status: (value: string) => {
    const statusMap: { [key: string]: string } = {
      'activo': 'Activo',
      'inactivo': 'Inactivo',
      'pendiente': 'Pendiente',
      'completado': 'Completado',
      'en_progreso': 'En Progreso',
      'resuelto': 'Resuelto',
      'derivado_pnp': 'Derivado PNP',
      'operativo': 'Operativo',
      'mantenimiento': 'Mantenimiento',
      'fuera_servicio': 'Fuera de Servicio'
    };
    return statusMap[value] || value;
  }
};

/**
 * Genera reportes con filtros aplicados
 */
export function generateFilteredReport<T extends Record<string, unknown>>(
  options: {
    title: string;
    data: T[];
    columns: ColumnDef<T>[];
    filters: Record<string, unknown>;
    format?: 'pdf' | 'excel';
  }
): void;
export function generateFilteredReport<T extends Record<string, unknown>>(
  title: string,
  data: T[],
  columns: ColumnDef<T>[],
  filters: Record<string, unknown>,
  format?: 'pdf' | 'excel'
): void;
export function generateFilteredReport<T extends Record<string, unknown>>(
  optionsOrTitle:
    | {
        title: string;
        data: T[];
        columns: ColumnDef<T>[];
        filters: Record<string, unknown>;
        format?: 'pdf' | 'excel';
      }
    | string,
  data?: T[],
  columns?: ColumnDef<T>[],
  filters?: Record<string, unknown>,
  format: 'pdf' | 'excel' = 'pdf'
): void {
  const opts = typeof optionsOrTitle === 'string'
    ? { title: optionsOrTitle, data: data!, columns: columns!, filters: filters!, format }
    : { ...optionsOrTitle, format: optionsOrTitle.format ?? 'pdf' };
  const { title, data: rows, columns: cols, filters: flt, format: fmt } = opts;
  const { headers, data: formattedData } = formatDataForReport<T>(rows, cols);
  
  // Crear descripción de filtros
  const filterDescriptions = Object.entries(flt)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ');
  
  const reportData: ReportData = {
    title,
    headers,
    data: formattedData,
    metadata: {
      generatedAt: new Date().toLocaleString('es-PE'),
      generatedBy: 'Sistema SGSC',
      filters: filterDescriptions || 'Ninguno',
      totalRecords: rows.length
    }
  };
  
  if (fmt === 'pdf') {
    generatePDFReport(reportData);
  } else {
    generateExcelReport(reportData);
  }
}