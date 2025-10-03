'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaUserTag, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

interface Sector {
  id_sector: number;
  nombre_sector: string;
}

interface Turno {
  id_turno: number;
  nombre_turno: string;
}

export default function RegisterUserForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    dni: '',
    nombres: '',
    apellidos: '',
    cargo: 'sereno',
    sector_id: '',
    turno_id: '',
    role: 'sereno'
  });

  const [sectores, setSectores] = useState<Sector[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar sectores y turnos al montar el componente
  useEffect(() => {
    loadSectoresAndTurnos();
  }, []);

  const loadSectoresAndTurnos = async () => {
    try {
      // Cargar sectores
      const { data: sectoresData, error: sectoresError } = await supabase
        .from('sector')
        .select('id_sector, nombre_sector')
        .order('nombre_sector');

      if (sectoresError) throw sectoresError;
      setSectores(sectoresData || []);

      // Cargar turnos
      const { data: turnosData, error: turnosError } = await supabase
        .from('turno')
        .select('id_turno, nombre_turno')
        .order('nombre_turno');

      if (turnosError) throw turnosError;
      setTurnos(turnosData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar sectores y turnos');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.dni || !formData.nombres || !formData.apellidos) {
      setError('Todos los campos obligatorios deben ser completados');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.dni.length !== 8) {
      setError('El DNI debe tener 8 dígitos');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: formData.role,
            dni: formData.dni,
            nombres: formData.nombres,
            apellidos: formData.apellidos
          }
        }
      });

      if (authError) throw authError;

      // 2. Insertar datos en la tabla personal
      const { error: personalError } = await supabase
        .from('personal')
        .insert({
          dni: formData.dni,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          cargo: formData.cargo,
          estado: 'activo',
          sector_id: formData.sector_id ? parseInt(formData.sector_id) : null,
          turno_id: formData.turno_id ? parseInt(formData.turno_id) : null
        });

      if (personalError) throw personalError;

      setSuccess(`Usuario ${formData.nombres} ${formData.apellidos} creado exitosamente. Se ha enviado un email de confirmación a ${formData.email}`);
      
      // Limpiar formulario
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        dni: '',
        nombres: '',
        apellidos: '',
        cargo: 'sereno',
        sector_id: '',
        turno_id: '',
        role: 'sereno'
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear usuario';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
        <FaUser className="mr-2" />
        Registrar Nuevo Usuario
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos de autenticación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaEnvelope className="inline mr-1" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaIdCard className="inline mr-1" />
              DNI *
            </label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              maxLength={8}
              pattern="[0-9]{8}"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaLock className="inline mr-1" />
              Contraseña *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaLock className="inline mr-1" />
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Datos personales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombres *
            </label>
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellidos *
            </label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Datos laborales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaUserTag className="inline mr-1" />
              Cargo
            </label>
            <select
              name="cargo"
              value={formData.cargo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sereno">Sereno</option>
              <option value="supervisor">Supervisor</option>
              <option value="chofer">Chofer</option>
              <option value="cámara">Operador de Cámara</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaMapMarkerAlt className="inline mr-1" />
              Sector
            </label>
            <select
              name="sector_id"
              value={formData.sector_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar sector</option>
              {sectores.map((sector) => (
                <option key={sector.id_sector} value={sector.id_sector}>
                  {sector.nombre_sector}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaClock className="inline mr-1" />
              Turno
            </label>
            <select
              name="turno_id"
              value={formData.turno_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar turno</option>
              {turnos.map((turno) => (
                <option key={turno.id_turno} value={turno.id_turno}>
                  {turno.nombre_turno}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol del Sistema
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sereno">Sereno</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando usuario...' : 'Crear Usuario'}
        </button>
      </form>
    </div>
  );
}