import { supabase } from './supabase';
import { Sector, Turno, PersonalBasic as Personal, Cabina, Movilidad } from './types';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Cache storage
const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL values (in milliseconds)
const DEFAULT_TTL = {
  SECTORS: 5 * 60 * 1000, // 5 minutes
  TURNOS: 5 * 60 * 1000, // 5 minutes
  PERSONAL: 2 * 60 * 1000, // 2 minutes
  VEHICULOS: 3 * 60 * 1000, // 3 minutes
  CABINAS: 5 * 60 * 1000, // 5 minutes
  STATIC_DATA: 10 * 60 * 1000, // 10 minutes for rarely changing data
};

// Cache utility functions
export const cacheUtils = {
  // Set data in cache
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL.STATIC_DATA): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  // Get data from cache
  get<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }

    return entry.data as T;
  },

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return false;
    }

    return true;
  },

  // Clear specific cache entry
  clear(key: string): void {
    cache.delete(key);
  },

  // Clear all cache
  clearAll(): void {
    cache.clear();
  },

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  },
};

// Cached data fetchers
export const cachedFetchers = {
  // Fetch sectors with caching
  async getSectors(): Promise<Sector[]> {
    const cacheKey = 'sectors';
    const cached = cacheUtils.get<Sector[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('sector')
        .select('*')
        .order('nombre_sector', { ascending: true });

      if (error) throw error;

      const result = (data ?? []) as Sector[];
      cacheUtils.set<Sector[]>(cacheKey, result, DEFAULT_TTL.SECTORS);
      return result;
    } catch (error) {
      console.error('Error fetching sectors:', error);
      return [];
    }
  },

  // Fetch turnos with caching
  async getTurnos(): Promise<Turno[]> {
    const cacheKey = 'turnos';
    const cached = cacheUtils.get<Turno[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('turno')
        .select('*')
        .order('nombre_turno', { ascending: true });

      if (error) throw error;

      const result = (data ?? []) as Turno[];
      cacheUtils.set<Turno[]>(cacheKey, result, DEFAULT_TTL.TURNOS);
      return result;
    } catch (error) {
      console.error('Error fetching turnos:', error);
      return [];
    }
  },

  // Fetch personal with caching
  async getPersonal(): Promise<Personal[]> {
    const cacheKey = 'personal';
    const cached = cacheUtils.get<Personal[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('personal')
        .select(`
          *,
          sector:sector_id (nombre_sector),
          turno:turno_id (nombre_turno, hora_inicio, hora_fin)
        `)
        .order('nombres', { ascending: true });

      if (error) throw error;

      const result = (data ?? []) as Personal[];
      cacheUtils.set<Personal[]>(cacheKey, result, DEFAULT_TTL.PERSONAL);
      return result;
    } catch (error) {
      console.error('Error fetching personal:', error);
      return [];
    }
  },

  // Fetch vehiculos with caching
  async getVehiculos(): Promise<Movilidad[]> {
    const cacheKey = 'vehiculos';
    const cached = cacheUtils.get<Movilidad[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('vehiculo')
        .select('*')
        .order('placa', { ascending: true });

      if (error) throw error;

      const result = (data ?? []) as Movilidad[];
      cacheUtils.set<Movilidad[]>(cacheKey, result, DEFAULT_TTL.VEHICULOS);
      return result;
    } catch (error) {
      console.error('Error fetching vehiculos:', error);
      return [];
    }
  },

  // Fetch cabinas with caching
  async getCabinas(): Promise<Cabina[]> {
    const cacheKey = 'cabinas';
    const cached = cacheUtils.get<Cabina[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('cabina')
        .select('*')
        .order('nombre_cabina', { ascending: true });

      if (error) throw error;

      const result = (data ?? []) as Cabina[];
      cacheUtils.set<Cabina[]>(cacheKey, result, DEFAULT_TTL.CABINAS);
      return result;
    } catch (error) {
      console.error('Error fetching cabinas:', error);
      return [];
    }
  },

  // Fetch supervisors (personal with supervisor role)
  async getSupervisors(): Promise<Personal[]> {
    const cacheKey = 'supervisors';
    const cached = cacheUtils.get<Personal[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('personal')
        .select('id, nombres, apellidos, cargo')
        .in('cargo', ['Supervisor', 'Jefe de turno', 'Coordinador'])
        .eq('estado', 'activo')
        .order('nombres', { ascending: true });

      if (error) throw error;

      const result = (data ?? []) as Personal[];
      cacheUtils.set<Personal[]>(cacheKey, result, DEFAULT_TTL.PERSONAL);
      return result;
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      return [];
    }
  },
};

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate related caches when data changes
  onSectorChange() {
    cacheUtils.clear('sectors');
    cacheUtils.clear('personal'); // Personal includes sector data
  },

  onTurnoChange() {
    cacheUtils.clear('turnos');
    cacheUtils.clear('personal'); // Personal includes turno data
  },

  onPersonalChange() {
    cacheUtils.clear('personal');
    cacheUtils.clear('supervisors');
  },

  onVehiculoChange() {
    cacheUtils.clear('vehiculos');
  },

  onCabinaChange() {
    cacheUtils.clear('cabinas');
  },

  // Clear all related caches
  clearAll() {
    cacheUtils.clearAll();
  },
};

// Hook for cache management in React components
export const useCacheManager = () => {
  return {
    cacheUtils,
    cachedFetchers,
    cacheInvalidation,
    
    // Preload common data
    async preloadCommonData() {
      try {
        await Promise.all([
          cachedFetchers.getSectors(),
          cachedFetchers.getTurnos(),
          cachedFetchers.getPersonal(),
        ]);
      } catch (error) {
        console.error('Error preloading common data:', error);
      }
    },

    // Get cache statistics
    getCacheStats() {
      return cacheUtils.getStats();
    },
  };
};

// Export default cache instance
const dataCache = {
  cacheUtils,
  cachedFetchers,
  cacheInvalidation,
  useCacheManager,
  DEFAULT_TTL,
};

export default dataCache;