import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      personal: {
        Row: {
          id: string;
          dni: string;
          nombres: string;
          apellidos: string;
          cargo: string;
          estado: string;
          sector_id: string | null;
          turno_id: string | null;
          created_at: string;
        };
      };
      turno: {
        Row: {
          id: string;
          nombre_turno: string;
          hora_inicio: string;
          hora_fin: string;
          created_at: string;
        };
      };
      sector: {
        Row: {
          id: string;
          nombre_sector: string;
          descripcion: string;
          created_at: string;
        };
      };
      anexo: {
        Row: {
          id: string;
          nombre_anexo: string;
          sector_id: string;
          created_at: string;
        };
      };
      cabina: {
        Row: {
          id: string;
          numero_cabina: string;
          descripcion: string;
          personal_id: string | null;
          created_at: string;
        };
      };
      movilidad: {
        Row: {
          id: string;
          placa: string;
          tipo: string;
          chofer_id: string | null;
          sector_id: string | null;
          kilometraje_inicial: number;
          kilometraje_final: number;
          created_at: string;
        };
      };
      patrullaje: {
        Row: {
          id: string;
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          tipo: string;
          sector_id: string;
          anexo_id: string | null;
          personal_id: string;
          movilidad_id: string | null;
          created_at: string;
        };
      };
      supervisor: {
        Row: {
          id: string;
          personal_id: string;
          sector_id: string;
          turno_id: string;
          created_at: string;
        };
      };
      incidencia: {
        Row: {
          id: string;
          fecha: string;
          hora: string;
          descripcion: string;
          tipo_incidencia: string;
          sector_id: string;
          anexo_id: string | null;
          personal_reporta: string;
          patrullaje_id: string | null;
          estado: string;
          imagen_url: string | null;
          created_at: string;
        };
      };
      bitacora_cabina: {
        Row: {
          id: string;
          fecha: string;
          cabina_id: string;
          personal_id: string;
          observaciones: string;
          imagen_url: string | null;
          created_at: string;
        };
      };
    };
  };
};