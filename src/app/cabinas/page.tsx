'use client';
  import type { ColumnDef } from '@/lib/reportUtils';

  type CabinaReportRow = {
    fecha: string;
    cabina: string;
    personal: string;
    turno: string;
    hora_revision: string;
    estado_camara: string;
    estado_monitor: string;
    estado_grabacion: string;
    incidencias_detectadas: string;
    acciones_tomadas: string;
    observaciones: string;
  };

import { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaVideo, FaEye, FaClock, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import ReportActionBar from '@/components/ReportActionBar';
import { generateFilteredReport, formatters } from '@/lib/reportUtils';
import { supabase } from '@/lib/supabase';
import { cachedFetchers, cacheInvalidation } from '@/lib/dataCache';
import type { BitacoraCabina, PersonalBasic as Personal, Turno, Cabina } from '@/lib/types';

// Tipos importados desde '@/lib/types'

const estadosEquipo = [
  { value: 'operativo', label: '✅ Operativo', color: 'text-green-600' },
  { value: 'con_fallas', label: '⚠️ Con fallas', color: 'text-orange-600' },
  { value: 'fuera_servicio', label: '❌ Fuera de servicio', color: 'text-red-600' },
  { value: 'mantenimiento', label: '🔧 En mantenimiento', color: 'text-blue-600' }
];

const estadosGrabacion = [
  { value: 'grabando', label: '🔴 Grabando', color: 'text-green-600' },
  { value: 'pausado', label: '⏸️ Pausado', color: 'text-yellow-600' },
  { value: 'detenido', label: '⏹️ Detenido', color: 'text-red-600' },
  { value: 'error', label: '⚠️ Error', color: 'text-red-800' }
];

export default function CabinasPage() {
  const [bitacoras, setBitacoras] = useState<BitacoraCabina[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cabinas, setCabinas] = useState<Cabina[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBitacora, setEditingBitacora] = useState<BitacoraCabina | null>(null);
  
  // Filtros
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroCabina, setFiltroCabina] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    turno_id: '',
    cabina_id: '',
    personal_id: '',
    hora_revision: '',
    estado_camara: 'operativo',
    estado_monitor: 'operativo',
    estado_grabacion: 'grabando',
    observaciones: '',
    incidencias_detectadas: '',
    acciones_tomadas: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Declarar primero la función memoizada para evitar "used before declaration"
  const fetchBitacoras = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('bitacora_cabina')
        .select(`
          *,
          personal:personal_id (nombres, apellidos, dni, cargo),
          turno:turno_id (nombre_turno, hora_inicio, hora_fin),
          cabina:cabina_id (nombre_cabina, ubicacion, numero_camaras),
          supervisor:supervisor_id (nombres, apellidos)
        `)
        .order('fecha', { ascending: false })
        .order('hora_revision', { ascending: false });

      if (filtroFecha) {
        query = query.eq('fecha', filtroFecha);
      }
      if (filtroTurno) {
        query = query.eq('turno_id', filtroTurno);
      }
      if (filtroCabina) {
        query = query.eq('cabina_id', filtroCabina);
      }
      if (filtroEstado) {
        query = query.or(`estado_camara.eq.${filtroEstado},estado_monitor.eq.${filtroEstado},estado_grabacion.eq.${filtroEstado}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBitacoras(data || []);
    } catch (error) {
      console.error('Error fetching bitacoras:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroFecha, filtroTurno, filtroCabina, filtroEstado]);

  useEffect(() => {
    fetchBitacoras();
  }, [filtroFecha, filtroTurno, filtroCabina, filtroEstado, fetchBitacoras]);

  const fetchData = async () => {
    try {
      const [personalData, turnosData, cabinasData] = await Promise.all([
        cachedFetchers.getPersonal(),
        cachedFetchers.getTurnos(),
        cachedFetchers.getCabinas()
      ]);

      setPersonal(personalData);
      setTurnos(turnosData);
      setCabinas(cabinasData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBitacoras();
  }, [fetchBitacoras]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        observaciones: formData.observaciones || null,
        incidencias_detectadas: formData.incidencias_detectadas || null,
        acciones_tomadas: formData.acciones_tomadas || null
      };

      if (editingBitacora) {
        const { error } = await supabase
          .from('bitacora_cabina')
          .update(dataToSave)
          .eq('id', editingBitacora.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bitacora_cabina')
          .insert([dataToSave]);
        
        if (error) throw error;
      }

      // Invalidate cache after data changes
      cacheInvalidation.onCabinaChange();

      setShowForm(false);
      setEditingBitacora(null);
      resetForm();
      fetchBitacoras();
    } catch (error) {
      console.error('Error saving bitacora:', error);
      alert('Error al guardar la bitácora');
    }
  };

  const handleEdit = (bitacora: BitacoraCabina) => {
    setEditingBitacora(bitacora);
    setFormData({
      fecha: bitacora.fecha,
      turno_id: bitacora.turno_id,
      cabina_id: bitacora.cabina_id,
      personal_id: bitacora.personal_id,
      hora_revision: bitacora.hora_revision,
      estado_camara: bitacora.estado_camara,
      estado_monitor: bitacora.estado_monitor,
      estado_grabacion: bitacora.estado_grabacion,
      observaciones: bitacora.observaciones || '',
      incidencias_detectadas: bitacora.incidencias_detectadas || '',
      acciones_tomadas: bitacora.acciones_tomadas || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta bitácora?')) {
      try {
        const { error } = await supabase
          .from('bitacora_cabina')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Invalidate cache after data changes
        cacheInvalidation.onCabinaChange();
        
        fetchBitacoras();
      } catch (error) {
        console.error('Error deleting bitacora:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      turno_id: '',
      cabina_id: '',
      personal_id: '',
      hora_revision: '',
      estado_camara: 'operativo',
      estado_monitor: 'operativo',
      estado_grabacion: 'grabando',
      observaciones: '',
      incidencias_detectadas: '',
      acciones_tomadas: ''
    });
  };

  const generarReportePDF = async () => {
    const columns: ColumnDef<CabinaReportRow>[] = [
      { header: 'Fecha', key: 'fecha' },
      { header: 'Cabina', key: 'cabina' },
      { header: 'Personal', key: 'personal' },
      { header: 'Turno', key: 'turno' },
      { header: 'Hora Revisión', key: 'hora_revision' },
      { header: 'Estado Cámara', key: 'estado_camara' },
      { header: 'Estado Monitor', key: 'estado_monitor' },
      { header: 'Estado Grabación', key: 'estado_grabacion' },
      { header: 'Incidencias', key: 'incidencias_detectadas' },
      { header: 'Acciones Tomadas', key: 'acciones_tomadas' },
      { header: 'Observaciones', key: 'observaciones' }
    ];

    const data: CabinaReportRow[] = bitacoras.map(bitacora => ({
      fecha: formatters.date(bitacora.fecha),
      cabina: `${bitacora.cabina?.nombre_cabina} - ${bitacora.cabina?.ubicacion}`,
      personal: `${bitacora.personal?.nombres} ${bitacora.personal?.apellidos}`,
      turno: bitacora.turno?.nombre_turno || '',
      hora_revision: bitacora.hora_revision,
      estado_camara: bitacora.estado_camara,
      estado_monitor: bitacora.estado_monitor,
      estado_grabacion: bitacora.estado_grabacion,
      incidencias_detectadas: bitacora.incidencias_detectadas || 'Ninguna',
      acciones_tomadas: bitacora.acciones_tomadas || 'Ninguna',
      observaciones: bitacora.observaciones || 'Ninguna'
    }));

    await generateFilteredReport({
      title: 'Reporte de Bitácora de Cabinas y Cámaras',
      data,
      columns,
      format: 'pdf',
      filters: {
        fecha: filtroFecha,
        turno: filtroTurno,
        cabina: filtroCabina,
        estado: filtroEstado
      }
    });
  };

  const generarReporteExcel = async () => {
    const columns: ColumnDef<CabinaReportRow>[] = [
      { header: 'Fecha', key: 'fecha' },
      { header: 'Cabina', key: 'cabina' },
      { header: 'Personal', key: 'personal' },
      { header: 'Turno', key: 'turno' },
      { header: 'Hora Revisión', key: 'hora_revision' },
      { header: 'Estado Cámara', key: 'estado_camara' },
      { header: 'Estado Monitor', key: 'estado_monitor' },
      { header: 'Estado Grabación', key: 'estado_grabacion' },
      { header: 'Incidencias', key: 'incidencias_detectadas' },
      { header: 'Acciones Tomadas', key: 'acciones_tomadas' },
      { header: 'Observaciones', key: 'observaciones' }
    ];

    const data: CabinaReportRow[] = bitacoras.map(bitacora => ({
      fecha: formatters.date(bitacora.fecha),
      cabina: `${bitacora.cabina?.nombre_cabina} - ${bitacora.cabina?.ubicacion}`,
      personal: `${bitacora.personal?.nombres} ${bitacora.personal?.apellidos}`,
      turno: bitacora.turno?.nombre_turno || '',
      hora_revision: bitacora.hora_revision,
      estado_camara: bitacora.estado_camara,
      estado_monitor: bitacora.estado_monitor,
      estado_grabacion: bitacora.estado_grabacion,
      incidencias_detectadas: bitacora.incidencias_detectadas || 'Ninguna',
      acciones_tomadas: bitacora.acciones_tomadas || 'Ninguna',
      observaciones: bitacora.observaciones || 'Ninguna'
    }));

    await generateFilteredReport({
      title: 'Reporte de Bitácora de Cabinas y Cámaras',
      data,
      columns,
      format: 'excel',
      filters: {
        fecha: filtroFecha,
        turno: filtroTurno,
        cabina: filtroCabina,
        estado: filtroEstado
      }
    });
  };
  const imprimirLista = () => {
    window.print();
  };

  const getEstadoInfo = (estado: string, tipo: 'equipo' | 'grabacion') => {
    const estados = tipo === 'equipo' ? estadosEquipo : estadosGrabacion;
    return estados.find(e => e.value === estado) || estados[0];
  };

  const getEstadoGeneral = (bitacora: BitacoraCabina) => {
    if (bitacora.estado_camara === 'fuera_servicio' || 
        bitacora.estado_monitor === 'fuera_servicio' || 
        bitacora.estado_grabacion === 'error') {
      return { label: '❌ Crítico', color: 'text-red-600' };
    }
    if (bitacora.estado_camara === 'con_fallas' || 
        bitacora.estado_monitor === 'con_fallas' || 
        bitacora.estado_grabacion === 'pausado') {
      return { label: '⚠️ Con fallas', color: 'text-orange-600' };
    }
    if (bitacora.estado_camara === 'mantenimiento' || 
        bitacora.estado_monitor === 'mantenimiento') {
      return { label: '🔧 Mantenimiento', color: 'text-blue-600' };
    }
    return { label: '✅ Operativo', color: 'text-green-600' };
  };

  return (
    <div className="p-6">
      <ReportActionBar
        title="Bitácora de Cabinas y Cámaras"
        onPdf={generarReportePDF}
        onExcel={generarReporteExcel}
        onPrint={imprimirLista}
        createLabel="Nueva Revisión"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Cabina</label>
            <select
              value={filtroCabina}
              onChange={(e) => setFiltroCabina(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las cabinas</option>
              {cabinas.map((cabina) => (
                <option key={cabina.id} value={cabina.id}>
                  {cabina.nombre_cabina} - {cabina.ubicacion}
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
              <option value="operativo">Operativo</option>
              <option value="con_fallas">Con fallas</option>
              <option value="fuera_servicio">Fuera de servicio</option>
              <option value="mantenimiento">En mantenimiento</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumen de Estados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Operativas</p>
              <p className="text-2xl font-bold text-green-600">
                {bitacoras.filter(b => 
                  b.estado_camara === 'operativo' && 
                  b.estado_monitor === 'operativo' && 
                  b.estado_grabacion === 'grabando'
                ).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-orange-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Con Fallas</p>
              <p className="text-2xl font-bold text-orange-600">
                {bitacoras.filter(b => 
                  b.estado_camara === 'con_fallas' || 
                  b.estado_monitor === 'con_fallas'
                ).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <FaVideo className="text-red-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Fuera de Servicio</p>
              <p className="text-2xl font-bold text-red-600">
                {bitacoras.filter(b => 
                  b.estado_camara === 'fuera_servicio' || 
                  b.estado_monitor === 'fuera_servicio'
                ).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <FaClock className="text-blue-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">En Mantenimiento</p>
              <p className="text-2xl font-bold text-blue-600">
                {bitacoras.filter(b => 
                  b.estado_camara === 'mantenimiento' || 
                  b.estado_monitor === 'mantenimiento'
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Bitácoras */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cabina/Personal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Cámara
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Monitor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grabación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado General
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
                  <td colSpan={8} className="px-6 py-4 text-center">
                    Cargando bitácoras...
                  </td>
                </tr>
              ) : bitacoras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No hay bitácoras registradas
                  </td>
                </tr>
              ) : (
                bitacoras.map((bitacora) => {
                  const estadoCamara = getEstadoInfo(bitacora.estado_camara, 'equipo');
                  const estadoMonitor = getEstadoInfo(bitacora.estado_monitor, 'equipo');
                  const estadoGrabacion = getEstadoInfo(bitacora.estado_grabacion, 'grabacion');
                  const estadoGeneral = getEstadoGeneral(bitacora);
                  
                  return (
                    <tr key={bitacora.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <FaVideo className="text-blue-500" />
                            {bitacora.cabina?.nombre_cabina}
                          </div>
                          <div className="text-sm text-gray-500">
                            {bitacora.cabina?.ubicacion} ({bitacora.cabina?.numero_camaras} cámaras)
                          </div>
                          <div className="text-sm text-gray-500">
                            {bitacora.personal?.nombres} {bitacora.personal?.apellidos}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(bitacora.fecha).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FaClock className="text-xs" />
                          {bitacora.hora_revision}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bitacora.turno?.nombre_turno}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${estadoCamara.color}`}>
                          {estadoCamara.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${estadoMonitor.color}`}>
                          {estadoMonitor.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${estadoGrabacion.color}`}>
                          {estadoGrabacion.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${estadoGeneral.color}`}>
                          {estadoGeneral.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bitacora.incidencias_detectadas ? (
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
                            onClick={() => handleEdit(bitacora)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(bitacora.id)}
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
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingBitacora ? 'Editar Bitácora' : 'Nueva Revisión de Cabina'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Revisión</label>
                  <input
                    type="time"
                    value={formData.hora_revision}
                    onChange={(e) => setFormData({ ...formData, hora_revision: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cabina</label>
                  <select
                    value={formData.cabina_id}
                    onChange={(e) => setFormData({ ...formData, cabina_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar cabina</option>
                    {cabinas.map((cabina) => (
                      <option key={cabina.id} value={cabina.id}>
                        {cabina.nombre_cabina} - {cabina.ubicacion} ({cabina.numero_camaras} cámaras)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personal Responsable</label>
                  <select
                    value={formData.personal_id}
                    onChange={(e) => setFormData({ ...formData, personal_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar personal</option>
                    {personal
                      .filter(p => !formData.turno_id || p.turno_id === formData.turno_id)
                      .map((persona) => (
                      <option key={persona.id} value={persona.id}>
                        {persona.nombres} {persona.apellidos} - {persona.cargo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Cámaras</label>
                  <select
                    value={formData.estado_camara}
                    onChange={(e) => setFormData({ ...formData, estado_camara: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {estadosEquipo.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Monitor</label>
                  <select
                    value={formData.estado_monitor}
                    onChange={(e) => setFormData({ ...formData, estado_monitor: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {estadosEquipo.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Grabación</label>
                  <select
                    value={formData.estado_grabacion}
                    onChange={(e) => setFormData({ ...formData, estado_grabacion: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {estadosGrabacion.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Incidencias Detectadas</label>
                <textarea
                  value={formData.incidencias_detectadas}
                  onChange={(e) => setFormData({ ...formData, incidencias_detectadas: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describir cualquier incidencia o problema detectado en las cámaras o equipos..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Acciones Tomadas</label>
                <textarea
                  value={formData.acciones_tomadas}
                  onChange={(e) => setFormData({ ...formData, acciones_tomadas: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describir las acciones correctivas o de mantenimiento realizadas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones Generales</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observaciones adicionales sobre el estado general de la cabina..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingBitacora ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBitacora(null);
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