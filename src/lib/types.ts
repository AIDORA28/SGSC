// Tipos compartidos del dominio SGSC para reutilización entre módulos
// Mantener una sola fuente de verdad para interfaces comunes

export interface Turno {
  id: string;
  nombre_turno: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface Sector {
  id: string;
  nombre_sector: string;
  descripcion: string;
}

// Representa los campos comunes utilizados en la mayoría de los módulos
export interface PersonalBasic {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  sector_id: string | null;
  turno_id: string | null;
}

export interface Cabina {
  id: string;
  nombre_cabina: string;
  ubicacion: string;
  numero_camaras: number;
  anexo_id: string;
}

export interface BitacoraCabina {
  id: string;
  fecha: string;
  turno_id: string;
  cabina_id: string;
  personal_id: string;
  hora_revision: string;
  estado_camara: string;
  estado_monitor: string;
  estado_grabacion: string;
  observaciones: string | null;
  incidencias_detectadas: string | null;
  acciones_tomadas: string | null;
  supervisor_id: string | null;
  created_at: string;
  // Datos relacionados
  personal?: {
    nombres: string;
    apellidos: string;
    dni: string;
    cargo: string;
  };
  turno?: {
    nombre_turno: string;
    hora_inicio: string;
    hora_fin: string;
  };
  cabina?: {
    nombre_cabina: string;
    ubicacion: string;
    numero_camaras: number;
  };
  supervisor?: {
    nombres: string;
    apellidos: string;
  };
}

export interface Movilidad {
  id: string;
  fecha: string;
  turno_id: string;
  sector_id: string;
  personal_id: string;
  vehiculo_placa: string;
  kilometraje_inicial: number;
  kilometraje_final: number | null;
  combustible_inicial: number;
  combustible_final: number | null;
  destino: string;
  motivo_traslado: string;
  hora_salida: string;
  hora_retorno: string | null;
  observaciones: string | null;
  estado_vehiculo_salida: string;
  estado_vehiculo_retorno: string | null;
  supervisor_id: string | null;
  created_at: string;
  // Datos relacionados
  personal?: {
    nombres: string;
    apellidos: string;
    dni: string;
    cargo: string;
  };
  turno?: {
    nombre_turno: string;
    hora_inicio: string;
    hora_fin: string;
  };
  sector?: {
    nombre_sector: string;
  };
  supervisor?: {
    nombres: string;
    apellidos: string;
  };
}

export interface Patrullaje {
  id: string;
  fecha: string;
  turno_id: string;
  sector_id: string;
  personal_id: string;
  hora_inicio: string;
  hora_fin: string | null;
  ruta_patrullaje: string;
  observaciones: string | null;
  incidencias_encontradas: string | null;
  estado_patrullaje: string;
  supervisor_id: string | null;
  created_at: string;
  // Datos relacionados
  personal?: {
    nombres: string;
    apellidos: string;
    dni: string;
    cargo: string;
  };
  turno?: {
    nombre_turno: string;
    hora_inicio: string;
    hora_fin: string;
  };
  sector?: {
    nombre_sector: string;
  };
  supervisor?: {
    nombres: string;
    apellidos: string;
  };
}