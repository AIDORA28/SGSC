'use client';
import type { ColumnDef } from '@/lib/reportUtils';

type AsistenciaReportRow = {
  fecha: string;
  personal_nombres: string;
  personal_apellidos: string;
  personal_dni: string;
  personal_cargo: string;
  turno_nombre: string;
  sector_nombre: string;
  estado_asistencia: string;
  parte_fisico_entregado: boolean;
  observaciones: string;
};

import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaPrint, FaCheck, FaTimes, FaCalendarAlt, FaUserMd, FaFileExcel } from 'react-icons/fa';
import { generateFilteredReport, formatters } from '@/lib/reportUtils';
import { supabase } from '@/lib/supabase';

// Interfaces para TypeScript
interface Asistencia {
  id: string;
  fecha: string;
  turno_id: string;
  sector_id: string;
  personal_id: string;
  estado_asistencia: string;
  observaciones: string | null;
  supervisor_id: string | null;
  parte_fisico_entregado: boolean;
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

interface Personal {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  sector_id: string | null;
  turno_id: string | null;
}

interface Turno {
  id: string;
  nombre_turno: string;
  hora_inicio: string;
  hora_fin: string;
}

interface Sector {
  id: string;
  nombre_sector: string;
  descripcion: string;
}

const estadosAsistencia = [
  { value: 'asistio_firmo', label: '✔️ Asistió y firmó', color: 'text-green-600' },
  { value: 'falta', label: '❌ Falta', color: 'text-red-600' },
  { value: 'descanso_semanal', label: '🌙 Descanso semanal', color: 'text-blue-600' },
  { value: 'feriado', label: '🎉 Feriado', color: 'text-purple-600' },
  { value: 'permiso_medico', label: '🤕 Permiso médico / licencia', color: 'text-orange-600' }
];

export default function AsistenciasPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsistencia, setEditingAsistencia] = useState<Asistencia | null>(null);
  
  // Filtros
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroSector, setFiltroSector] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    turno_id: '',
    sector_id: '',
    personal_id: '',
    estado_asistencia: 'asistio_firmo',
    observaciones: '',
    parte_fisico_entregado: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [personalRes, turnosRes, sectoresRes] = await Promise.all([
        supabase.from('personal').select('*').eq('estado', 'activo'),
        supabase.from('turno').select('*'),
        supabase.from('sector').select('*')
      ]);

      if (personalRes.data) setPersonal(personalRes.data);
      if (turnosRes.data) setTurnos(turnosRes.data);
      if (sectoresRes.data) setSectores(sectoresRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('asistencia')
        .select(`
          *,
          personal:personal_id (nombres, apellidos, dni, cargo),
          turno:turno_id (nombre_turno, hora_inicio, hora_fin),
          sector:sector_id (nombre_sector),
          supervisor:supervisor_id (nombres, apellidos)
        `)
        .order('fecha', { ascending: false })
        .order('hora_entrada', { ascending: false });

      if (filtroFecha) {
        query = query.eq('fecha', filtroFecha);
      }
      if (filtroTurno) {
        query = query.eq('turno_id', filtroTurno);
      }
      if (filtroSector) {
        query = query.eq('sector_id', filtroSector);
      }
      if (filtroEstado) {
        query = query.eq('estado_asistencia', filtroEstado);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAsistencias(data || []);
    } catch (error) {
      console.error('Error fetching asistencias:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroFecha, filtroTurno, filtroSector, filtroEstado]);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsistencia) {
        const { error } = await supabase
          .from('asistencia')
          .update(formData)
          .eq('id', editingAsistencia.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('asistencia')
          .insert([formData]);
        
        if (error) throw error;
      }

      setShowForm(false);
      setEditingAsistencia(null);
      resetForm();
      fetchAsistencias();
    } catch (error) {
      console.error('Error saving asistencia:', error);
      alert('Error al guardar la asistencia');
    }
  };

  const handleEdit = (asistencia: Asistencia) => {
    setEditingAsistencia(asistencia);
    setFormData({
      fecha: asistencia.fecha,
      turno_id: asistencia.turno_id,
      sector_id: asistencia.sector_id,
      personal_id: asistencia.personal_id,
      estado_asistencia: asistencia.estado_asistencia,
      observaciones: asistencia.observaciones || '',
      parte_fisico_entregado: asistencia.parte_fisico_entregado
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta asistencia?')) {
      try {
        const { error } = await supabase
          .from('asistencia')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchAsistencias();
      } catch (error) {
        console.error('Error deleting asistencia:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      turno_id: '',
      sector_id: '',
      personal_id: '',
      estado_asistencia: 'asistio_firmo',
      observaciones: '',
      parte_fisico_entregado: false
    });
  };

  const generarReportePDF = () => {
    const columns: ColumnDef<AsistenciaReportRow>[] = [
      { key: 'fecha', label: 'Fecha', format: formatters.date },
      { key: 'personal_nombres', label: 'Nombres' },
      { key: 'personal_apellidos', label: 'Apellidos' },
      { key: 'personal_dni', label: 'DNI' },
      { key: 'personal_cargo', label: 'Cargo' },
      { key: 'turno_nombre', label: 'Turno' },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'estado_asistencia', label: 'Estado', format: formatters.status },
      { key: 'parte_fisico_entregado', label: 'Parte Físico', format: formatters.boolean },
      { key: 'observaciones', label: 'Observaciones' }
    ];

    const reportData: AsistenciaReportRow[] = asistencias.map(asistencia => ({
      fecha: asistencia.fecha,
      personal_nombres: asistencia.personal?.nombres || '',
      personal_apellidos: asistencia.personal?.apellidos || '',
      personal_dni: asistencia.personal?.dni || '',
      personal_cargo: asistencia.personal?.cargo || '',
      turno_nombre: asistencia.turno?.nombre_turno || '',
      sector_nombre: asistencia.sector?.nombre_sector || '',
      estado_asistencia: asistencia.estado_asistencia,
      parte_fisico_entregado: asistencia.parte_fisico_entregado,
      observaciones: asistencia.observaciones || ''
    }));

    generateFilteredReport(
      'Reporte de Asistencias',
      reportData,
      columns,
      {
        'Fecha': filtroFecha || 'Todas',
        'Turno': turnos.find(t => t.id === filtroTurno)?.nombre_turno || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos',
        'Estado': filtroEstado || 'Todos'
      },
      'pdf'
    );
  };

  const generarReporteExcel = () => {
    const columns: ColumnDef<AsistenciaReportRow>[] = [
      { key: 'fecha', label: 'Fecha', format: formatters.date },
      { key: 'personal_nombres', label: 'Nombres' },
      { key: 'personal_apellidos', label: 'Apellidos' },
      { key: 'personal_dni', label: 'DNI' },
      { key: 'personal_cargo', label: 'Cargo' },
      { key: 'turno_nombre', label: 'Turno' },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'estado_asistencia', label: 'Estado', format: formatters.status },
      { key: 'parte_fisico_entregado', label: 'Parte Físico', format: formatters.boolean },
      { key: 'observaciones', label: 'Observaciones' }
    ];

    const reportData = asistencias.map(asistencia => ({
      fecha: asistencia.fecha,
      personal_nombres: asistencia.personal?.nombres || '',
      personal_apellidos: asistencia.personal?.apellidos || '',
      personal_dni: asistencia.personal?.dni || '',
      personal_cargo: asistencia.personal?.cargo || '',
      turno_nombre: asistencia.turno?.nombre_turno || '',
      sector_nombre: asistencia.sector?.nombre_sector || '',
      estado_asistencia: asistencia.estado_asistencia,
      parte_fisico_entregado: asistencia.parte_fisico_entregado,
      observaciones: asistencia.observaciones || ''
    }));

    generateFilteredReport(
      'Reporte de Asistencias',
      reportData,
      columns,
      {
        'Fecha': filtroFecha || 'Todas',
        'Turno': turnos.find(t => t.id === filtroTurno)?.nombre_turno || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos',
        'Estado': filtroEstado || 'Todos'
      },
      'excel'
    );
  };

  const imprimirLista = () => {
    window.print();
  };

  const getEstadoInfo = (estado: string) => {
    return estadosAsistencia.find(e => e.value === estado) || estadosAsistencia[0];
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Control de Asistencias</h1>
        <div className="flex gap-2">
          <button
            onClick={generarReportePDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <FaDownload /> Reporte PDF
          </button>
          <button
            onClick={generarReporteExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FaFileExcel /> Reporte Excel
          </button>
          <button
            onClick={imprimirLista}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <FaPrint /> Imprimir
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus /> Nueva Asistencia
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los turnos</option>
              {turnos.map((turno) => (
                <option key={turno.id} value={turno.id}>
                  {turno.nombre_turno} ({turno.hora_inicio} - {turno.hora_fin})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
            <select
              value={filtroSector}
              onChange={(e) => setFiltroSector(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los sectores</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.nombre_sector}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {estadosAsistencia.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Asistencias */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parte Físico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Cargando asistencias...
                  </td>
                </tr>
              ) : asistencias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No hay asistencias registradas
                  </td>
                </tr>
              ) : (
                asistencias.map((asistencia) => {
                  const estadoInfo = getEstadoInfo(asistencia.estado_asistencia);
                  return (
                    <tr key={asistencia.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {asistencia.personal?.nombres} {asistencia.personal?.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {asistencia.personal?.dni} - {asistencia.personal?.cargo}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(asistencia.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asistencia.turno?.nombre_turno}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asistencia.sector?.nombre_sector}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asistencia.parte_fisico_entregado ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <FaCheck /> Sí
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <FaTimes /> No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(asistencia)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(asistencia.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingAsistencia ? 'Editar Asistencia' : 'Nueva Asistencia'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
                <select
                  value={formData.turno_id}
                  onChange={(e) => setFormData({ ...formData, turno_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar turno</option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nombre_turno} ({turno.hora_inicio} - {turno.hora_fin})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                <select
                  value={formData.sector_id}
                  onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar sector</option>
                  {sectores.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.nombre_sector}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personal</label>
                <select
                  value={formData.personal_id}
                  onChange={(e) => setFormData({ ...formData, personal_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar personal</option>
                  {personal
                    .filter(p => !formData.sector_id || p.sector_id === formData.sector_id)
                    .filter(p => !formData.turno_id || p.turno_id === formData.turno_id)
                    .map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.nombres} {persona.apellidos} - {persona.cargo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Asistencia</label>
                <select
                  value={formData.estado_asistencia}
                  onChange={(e) => setFormData({ ...formData, estado_asistencia: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {estadosAsistencia.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.parte_fisico_entregado}
                    onChange={(e) => setFormData({ ...formData, parte_fisico_entregado: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    📎 Parte físico entregado
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingAsistencia ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAsistencia(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}