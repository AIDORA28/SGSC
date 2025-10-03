'use client';
import type { ColumnDef } from '@/lib/reportUtils';

type IncidenciaReportRow = {
  fecha: string;
  hora: string;
  tipo: string;
  sector_nombre: string;
  anexo: string;
  reportado_por: string;
  estado: string;
  descripcion: string;
};

import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaPrint, FaEye, FaExclamationTriangle, FaFileExcel } from 'react-icons/fa';
import { generateFilteredReport, formatters } from '@/lib/reportUtils';
import { supabase } from '@/lib/supabase';

// Interfaces para TypeScript
interface Incidencia {
  id: string;
  fecha: string;
  hora: string;
  tipo_incidencia: string;
  sector_id: string;
  anexo: string;
  reportado_por: string;
  estado: string;
  descripcion: string;
  personal_id: string | null;
  turno_id: string | null;
  observaciones: string | null;
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

const tiposIncidencia = [
  'Robo',
  'Hurto',
  'Accidente de tránsito',
  'Disturbio público',
  'Violencia familiar',
  'Daños a la propiedad',
  'Consumo de alcohol en vía pública',
  'Ruidos molestos',
  'Comercio ambulatorio',
  'Otros'
];

const estadosIncidencia = [
  { value: 'pendiente', label: '⏳ Pendiente', color: 'text-yellow-600' },
  { value: 'en_proceso', label: '🔄 En proceso', color: 'text-blue-600' },
  { value: 'resuelto', label: '✅ Resuelto', color: 'text-green-600' },
  { value: 'derivado_pnp', label: '👮 Derivado PNP', color: 'text-purple-600' },
  { value: 'cerrado', label: '❌ Cerrado', color: 'text-red-600' }
];

const reportadoPorOpciones = [
  'COE',
  'Serenazgo a pie',
  'Operador de móvil',
  'Motorizado',
  'Cámaras de seguridad',
  'Ciudadano',
  'Otros'
];

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncidencia, setEditingIncidencia] = useState<Incidencia | null>(null);
  const [viewMode, setViewMode] = useState(false);
  
  // Filtros
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroSector, setFiltroSector] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    tipo_incidencia: '',
    sector_id: '',
    anexo: '',
    reportado_por: '',
    estado: 'pendiente',
    descripcion: '',
    personal_id: '',
    turno_id: '',
    observaciones: ''
  });

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

  const fetchIncidencias = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('incidencia')
        .select(`
          *,
          personal:personal_id (nombres, apellidos, dni, cargo),
          turno:turno_id (nombre_turno, hora_inicio, hora_fin),
          sector:sector_id (nombre_sector)
        `)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      if (filtroFecha) {
        query = query.eq('fecha', filtroFecha);
      }
      if (filtroTipo) {
        query = query.eq('tipo_incidencia', filtroTipo);
      }
      if (filtroSector) {
        query = query.eq('sector_id', filtroSector);
      }
      if (filtroEstado) {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIncidencias(data || []);
    } catch (error) {
      console.error('Error fetching incidencias:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroFecha, filtroTipo, filtroSector, filtroEstado]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchIncidencias();
  }, [fetchIncidencias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        personal_id: formData.personal_id || null,
        turno_id: formData.turno_id || null,
        observaciones: formData.observaciones || null
      };

      if (editingIncidencia) {
        const { error } = await supabase
          .from('incidencia')
          .update(dataToSave)
          .eq('id', editingIncidencia.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('incidencia')
          .insert([dataToSave]);
        
        if (error) throw error;
      }

      setShowForm(false);
      setEditingIncidencia(null);
      setViewMode(false);
      resetForm();
      fetchIncidencias();
    } catch (error) {
      console.error('Error saving incidencia:', error);
      alert('Error al guardar la incidencia');
    }
  };

  const handleEdit = (incidencia: Incidencia) => {
    setEditingIncidencia(incidencia);
    setFormData({
      fecha: incidencia.fecha,
      hora: incidencia.hora,
      tipo_incidencia: incidencia.tipo_incidencia,
      sector_id: incidencia.sector_id,
      anexo: incidencia.anexo,
      reportado_por: incidencia.reportado_por,
      estado: incidencia.estado,
      descripcion: incidencia.descripcion,
      personal_id: incidencia.personal_id || '',
      turno_id: incidencia.turno_id || '',
      observaciones: incidencia.observaciones || ''
    });
    setViewMode(false);
    setShowForm(true);
  };

  const handleView = (incidencia: Incidencia) => {
    setEditingIncidencia(incidencia);
    setFormData({
      fecha: incidencia.fecha,
      hora: incidencia.hora,
      tipo_incidencia: incidencia.tipo_incidencia,
      sector_id: incidencia.sector_id,
      anexo: incidencia.anexo,
      reportado_por: incidencia.reportado_por,
      estado: incidencia.estado,
      descripcion: incidencia.descripcion,
      personal_id: incidencia.personal_id || '',
      turno_id: incidencia.turno_id || '',
      observaciones: incidencia.observaciones || ''
    });
    setViewMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta incidencia?')) {
      try {
        const { error } = await supabase
          .from('incidencia')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchIncidencias();
      } catch (error) {
        console.error('Error deleting incidencia:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      hora: '',
      tipo_incidencia: '',
      sector_id: '',
      anexo: '',
      reportado_por: '',
      estado: 'pendiente',
      descripcion: '',
      personal_id: '',
      turno_id: '',
      observaciones: ''
    });
  };

  const generarReportePDF = () => {
    const columns: ColumnDef<IncidenciaReportRow>[] = [
      { key: 'fecha', label: 'Fecha', format: formatters.date },
      { key: 'hora', label: 'Hora' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'anexo', label: 'Anexo' },
      { key: 'reportado_por', label: 'Reportado Por' },
      { key: 'estado', label: 'Estado', format: formatters.status },
      { key: 'descripcion', label: 'Descripción' }
    ];

    const reportData: IncidenciaReportRow[] = incidencias.map(incidencia => ({
      fecha: incidencia.fecha,
      hora: incidencia.hora,
      tipo: incidencia.tipo_incidencia,
      sector_nombre: incidencia.sector?.nombre_sector || '',
      anexo: incidencia.anexo,
      reportado_por: incidencia.reportado_por,
      estado: incidencia.estado,
      descripcion: incidencia.descripcion
    }));

    generateFilteredReport(
      'Reporte de Incidencias',
      reportData,
      columns,
      {
        'Fecha': filtroFecha,
        'Tipo': filtroTipo || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos',
        'Estado': estadosIncidencia.find(e => e.value === filtroEstado)?.label || 'Todos'
      },
      'pdf'
    );
  };

  const generarReporteExcel = () => {
    const columns: ColumnDef<IncidenciaReportRow>[] = [
      { key: 'fecha', label: 'Fecha', format: formatters.date },
      { key: 'hora', label: 'Hora' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'anexo', label: 'Anexo' },
      { key: 'reportado_por', label: 'Reportado Por' },
      { key: 'estado', label: 'Estado', format: formatters.status },
      { key: 'descripcion', label: 'Descripción' }
    ];

    const reportData: IncidenciaReportRow[] = incidencias.map(incidencia => ({
      fecha: incidencia.fecha,
      hora: incidencia.hora,
      tipo: incidencia.tipo_incidencia,
      sector_nombre: incidencia.sector?.nombre_sector || '',
      anexo: incidencia.anexo,
      reportado_por: incidencia.reportado_por,
      estado: incidencia.estado,
      descripcion: incidencia.descripcion
    }));

    generateFilteredReport(
      'Reporte de Incidencias',
      reportData,
      columns,
      {
        'Fecha': filtroFecha,
        'Tipo': filtroTipo || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos',
        'Estado': estadosIncidencia.find(e => e.value === filtroEstado)?.label || 'Todos'
      },
      'excel'
    );
  };

  const imprimirLista = () => {
    window.print();
  };

  const getEstadoInfo = (estado: string) => {
    return estadosIncidencia.find(e => e.value === estado) || estadosIncidencia[0];
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Registro de Incidencias</h1>
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
            <FaPlus /> Nueva Incidencia
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              {tiposIncidencia.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
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
              {estadosIncidencia.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Incidencias */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sector/Anexo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reportado Por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
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
                    Cargando incidencias...
                  </td>
                </tr>
              ) : incidencias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No hay incidencias registradas
                  </td>
                </tr>
              ) : (
                incidencias.map((incidencia) => {
                  const estadoInfo = getEstadoInfo(incidencia.estado);
                  return (
                    <tr key={incidencia.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(incidencia.fecha).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {incidencia.hora}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <FaExclamationTriangle className="text-orange-500" />
                          {incidencia.tipo_incidencia}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {incidencia.sector?.nombre_sector}
                        </div>
                        <div className="text-sm text-gray-500">
                          {incidencia.anexo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {incidencia.reportado_por}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {incidencia.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(incidencia)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEdit(incidencia)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(incidencia.id)}
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
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {viewMode ? 'Ver Incidencia' : editingIncidencia ? 'Editar Incidencia' : 'Nueva Incidencia'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={viewMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                  <input
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={viewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Incidencia</label>
                  <select
                    value={formData.tipo_incidencia}
                    onChange={(e) => setFormData({ ...formData, tipo_incidencia: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={viewMode}
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposIncidencia.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={viewMode}
                  >
                    {estadosIncidencia.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                  <select
                    value={formData.sector_id}
                    onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={viewMode}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Anexo</label>
                  <input
                    type="text"
                    value={formData.anexo}
                    onChange={(e) => setFormData({ ...formData, anexo: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del anexo"
                    required
                    disabled={viewMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reportado Por</label>
                <select
                  value={formData.reportado_por}
                  onChange={(e) => setFormData({ ...formData, reportado_por: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={viewMode}
                >
                  <option value="">Seleccionar</option>
                  {reportadoPorOpciones.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción detallada de la incidencia..."
                  required
                  disabled={viewMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Observaciones adicionales..."
                  disabled={viewMode}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingIncidencia(null);
                    setViewMode(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  {viewMode ? 'Cerrar' : 'Cancelar'}
                </button>
                {!viewMode && (
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    {editingIncidencia ? 'Actualizar' : 'Guardar'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}