'use client';
import type { ColumnDef } from '@/lib/reportUtils';

type PatrullajeReportRow = {
  fecha: string;
  personal_nombres: string;
  personal_apellidos: string;
  personal_dni: string;
  turno_nombre: string;
  sector_nombre: string;
  ruta: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  observaciones: string;
};

import { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaRoute, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import ReportActionBar from '@/components/ReportActionBar';
import { generateFilteredReport, formatters } from '@/lib/reportUtils';
import { supabase } from '@/lib/supabase';
import { cachedFetchers, cacheInvalidation } from '@/lib/dataCache';
import type { Patrullaje, PersonalBasic as Personal, Turno, Sector } from '@/lib/types';

// Tipos importados desde '@/lib/types'

const estadosPatrullaje = [
  { value: 'en_curso', label: '🔄 En curso', color: 'text-blue-600' },
  { value: 'completado', label: '✅ Completado', color: 'text-green-600' },
  { value: 'interrumpido', label: '⚠️ Interrumpido', color: 'text-orange-600' },
  { value: 'cancelado', label: '❌ Cancelado', color: 'text-red-600' }
];

const rutasPatrullaje = [
  'Perímetro completo',
  'Sector Norte',
  'Sector Sur',
  'Sector Este',
  'Sector Oeste',
  'Área administrativa',
  'Área de producción',
  'Almacenes',
  'Estacionamientos',
  'Accesos principales',
  'Ruta personalizada'
];

export default function PatrullajesPage() {
  const [patrullajes, setPatrullajes] = useState<Patrullaje[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatrullaje, setEditingPatrullaje] = useState<Patrullaje | null>(null);
  
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
    hora_inicio: '',
    hora_fin: '',
    ruta_patrullaje: '',
    observaciones: '',
    incidencias_encontradas: '',
    estado_patrullaje: 'en_curso'
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Declarar primero la función memoizada para evitar "used before declaration"
  const fetchPatrullajes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('patrullaje')
        .select(`
          *,
          personal:personal_id (nombres, apellidos, dni, cargo),
          turno:turno_id (nombre_turno, hora_inicio, hora_fin),
          sector:sector_id (nombre_sector),
          supervisor:supervisor_id (nombres, apellidos)
        `)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

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
        query = query.eq('estado_patrullaje', filtroEstado);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPatrullajes(data || []);
    } catch (error) {
      console.error('Error fetching patrullajes:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroFecha, filtroTurno, filtroSector, filtroEstado]);

  useEffect(() => {
    fetchPatrullajes();
  }, [fetchPatrullajes]);

  const fetchData = async () => {
    try {
      const [personalData, turnosData, sectoresData] = await Promise.all([
        cachedFetchers.getPersonal(),
        cachedFetchers.getTurnos(),
        cachedFetchers.getSectors()
      ]);

      setPersonal(personalData);
      setTurnos(turnosData);
      setSectores(sectoresData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  

  // Efecto unificado arriba para escuchar cambios en filtros vía fetchPatrullajes memoizado

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        hora_fin: formData.hora_fin || null,
        observaciones: formData.observaciones || null,
        incidencias_encontradas: formData.incidencias_encontradas || null
      };

      if (editingPatrullaje) {
        const { error } = await supabase
          .from('patrullaje')
          .update(dataToSave)
          .eq('id', editingPatrullaje.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('patrullaje')
          .insert([dataToSave]);
        
        if (error) throw error;
      }

      // Invalidate cache after data changes
      cacheInvalidation.onPersonalChange();

      setShowForm(false);
      setEditingPatrullaje(null);
      resetForm();
      fetchPatrullajes();
    } catch (error) {
      console.error('Error saving patrullaje:', error);
      alert('Error al guardar el patrullaje');
    }
  };

  const handleEdit = (patrullaje: Patrullaje) => {
    setEditingPatrullaje(patrullaje);
    setFormData({
      fecha: patrullaje.fecha,
      turno_id: patrullaje.turno_id,
      sector_id: patrullaje.sector_id,
      personal_id: patrullaje.personal_id,
      hora_inicio: patrullaje.hora_inicio,
      hora_fin: patrullaje.hora_fin || '',
      ruta_patrullaje: patrullaje.ruta_patrullaje,
      observaciones: patrullaje.observaciones || '',
      incidencias_encontradas: patrullaje.incidencias_encontradas || '',
      estado_patrullaje: patrullaje.estado_patrullaje
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este patrullaje?')) {
      try {
        const { error } = await supabase
          .from('patrullaje')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Invalidate cache after data changes
        cacheInvalidation.onPersonalChange();
        
        fetchPatrullajes();
      } catch (error) {
        console.error('Error deleting patrullaje:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      turno_id: '',
      sector_id: '',
      personal_id: '',
      hora_inicio: '',
      hora_fin: '',
      ruta_patrullaje: '',
      observaciones: '',
      incidencias_encontradas: '',
      estado_patrullaje: 'en_curso'
    });
  };

  const generarReportePDF = () => {
    const columns: ColumnDef<PatrullajeReportRow>[] = [
      { key: 'fecha', label: 'Fecha', format: formatters.date },
      { key: 'personal_nombres', label: 'Nombres' },
      { key: 'personal_apellidos', label: 'Apellidos' },
      { key: 'personal_dni', label: 'DNI' },
      { key: 'turno_nombre', label: 'Turno' },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'ruta', label: 'Ruta' },
      { key: 'hora_inicio', label: 'Hora Inicio' },
      { key: 'hora_fin', label: 'Hora Fin' },
      { key: 'estado', label: 'Estado', format: formatters.status },
      { key: 'observaciones', label: 'Observaciones' }
    ];

    const reportData: PatrullajeReportRow[] = patrullajes.map(patrullaje => ({
      fecha: patrullaje.fecha,
      personal_nombres: patrullaje.personal?.nombres || '',
      personal_apellidos: patrullaje.personal?.apellidos || '',
      personal_dni: patrullaje.personal?.dni || '',
      turno_nombre: patrullaje.turno?.nombre_turno || '',
      sector_nombre: patrullaje.sector?.nombre_sector || '',
      ruta: patrullaje.ruta_patrullaje,
      hora_inicio: patrullaje.hora_inicio,
      hora_fin: patrullaje.hora_fin || '',
      estado: patrullaje.estado_patrullaje,
      observaciones: patrullaje.observaciones || ''
    }));

    generateFilteredReport(
      'Reporte de Patrullajes',
      reportData,
      columns,
      {
        'Fecha': filtroFecha,
        'Turno': turnos.find(t => t.id === filtroTurno)?.nombre_turno || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos',
        'Estado': estadosPatrullaje.find(e => e.value === filtroEstado)?.label || 'Todos'
      },
      'pdf'
    );
  };

  const generarReporteExcel = () => {
    const columns: ColumnDef<PatrullajeReportRow>[] = [
      { key: 'fecha', label: 'Fecha', format: formatters.date },
      { key: 'personal_nombres', label: 'Nombres' },
      { key: 'personal_apellidos', label: 'Apellidos' },
      { key: 'personal_dni', label: 'DNI' },
      { key: 'turno_nombre', label: 'Turno' },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'ruta', label: 'Ruta' },
      { key: 'hora_inicio', label: 'Hora Inicio' },
      { key: 'hora_fin', label: 'Hora Fin' },
      { key: 'estado', label: 'Estado', format: formatters.status },
      { key: 'observaciones', label: 'Observaciones' }
    ];

    const reportData: PatrullajeReportRow[] = patrullajes.map(patrullaje => ({
      fecha: patrullaje.fecha,
      personal_nombres: patrullaje.personal?.nombres || '',
      personal_apellidos: patrullaje.personal?.apellidos || '',
      personal_dni: patrullaje.personal?.dni || '',
      turno_nombre: patrullaje.turno?.nombre_turno || '',
      sector_nombre: patrullaje.sector?.nombre_sector || '',
      ruta: patrullaje.ruta_patrullaje,
      hora_inicio: patrullaje.hora_inicio,
      hora_fin: patrullaje.hora_fin || '',
      estado: patrullaje.estado_patrullaje,
      observaciones: patrullaje.observaciones || ''
    }));

    generateFilteredReport(
      'Reporte de Patrullajes',
      reportData,
      columns,
      {
        'Fecha': filtroFecha,
        'Turno': turnos.find(t => t.id === filtroTurno)?.nombre_turno || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos',
        'Estado': estadosPatrullaje.find(e => e.value === filtroEstado)?.label || 'Todos'
      },
      'excel'
    );
  };

  const imprimirLista = () => {
    window.print();
  };

  const getEstadoInfo = (estado: string) => {
    return estadosPatrullaje.find(e => e.value === estado) || estadosPatrullaje[0];
  };

  const calcularDuracion = (inicio: string, fin: string | null) => {
    if (!fin) return 'En curso';
    
    const inicioTime = new Date(`2000-01-01T${inicio}`);
    const finTime = new Date(`2000-01-01T${fin}`);
    const diff = finTime.getTime() - inicioTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="p-6">
      <ReportActionBar
        title="Control de Patrullajes"
        onPdf={generarReportePDF}
        onExcel={generarReporteExcel}
        onPrint={imprimirLista}
        createLabel="Nuevo Patrullaje"
        onCreate={() => setShowForm(true)}
      />

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
                  {turno.nombre_turno}
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
              {estadosPatrullaje.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Patrullajes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incidencias
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
                    Cargando patrullajes...
                  </td>
                </tr>
              ) : patrullajes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No hay patrullajes registrados
                  </td>
                </tr>
              ) : (
                patrullajes.map((patrullaje) => {
                  const estadoInfo = getEstadoInfo(patrullaje.estado_patrullaje);
                  return (
                    <tr key={patrullaje.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {patrullaje.personal?.nombres} {patrullaje.personal?.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patrullaje.sector?.nombre_sector} - {patrullaje.turno?.nombre_turno}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(patrullaje.fecha).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FaClock className="text-xs" />
                          {patrullaje.hora_inicio} - {patrullaje.hora_fin || 'En curso'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <FaRoute className="text-blue-500" />
                          {patrullaje.ruta_patrullaje}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {calcularDuracion(patrullaje.hora_inicio, patrullaje.hora_fin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patrullaje.incidencias_encontradas ? (
                          <div className="flex items-center gap-1 text-orange-600">
                            <FaExclamationTriangle />
                            <span className="text-sm">Sí</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(patrullaje)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(patrullaje.id)}
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
              {editingPatrullaje ? 'Editar Patrullaje' : 'Nuevo Patrullaje'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora Inicio</label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora Fin</label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ruta de Patrullaje</label>
                <select
                  value={formData.ruta_patrullaje}
                  onChange={(e) => setFormData({ ...formData, ruta_patrullaje: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar ruta</option>
                  {rutasPatrullaje.map((ruta) => (
                    <option key={ruta} value={ruta}>
                      {ruta}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Patrullaje</label>
                <select
                  value={formData.estado_patrullaje}
                  onChange={(e) => setFormData({ ...formData, estado_patrullaje: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {estadosPatrullaje.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Incidencias Encontradas</label>
                <textarea
                  value={formData.incidencias_encontradas}
                  onChange={(e) => setFormData({ ...formData, incidencias_encontradas: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describir incidencias encontradas durante el patrullaje..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observaciones adicionales del patrullaje..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingPatrullaje ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPatrullaje(null);
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