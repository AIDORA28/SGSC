'use client';
import type { ColumnDef } from '@/lib/reportUtils';

type MovilidadReportRow = {
  fecha: string;
  personal_nombres: string;
  personal_apellidos: string;
  personal_dni: string;
  turno_nombre: string;
  sector_nombre: string;
  vehiculo: string;
  destino: string;
  motivo: string;
  hora_salida: string;
  hora_retorno: string;
  estado_salida: string;
  observaciones: string;
};

import { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaCar, FaGasPump, FaRoute } from 'react-icons/fa';
import ReportActionBar from '@/components/ReportActionBar';
import { generateFilteredReport, formatters } from '@/lib/reportUtils';
import { supabase } from '@/lib/supabase';
import { cachedFetchers, cacheInvalidation } from '@/lib/dataCache';
import type { Movilidad, PersonalBasic as Personal, Turno, Sector } from '@/lib/types';

// Tipos importados desde '@/lib/types'

const estadosVehiculo = [
  { value: 'excelente', label: '🟢 Excelente', color: 'text-green-600' },
  { value: 'bueno', label: '🟡 Bueno', color: 'text-yellow-600' },
  { value: 'regular', label: '🟠 Regular', color: 'text-orange-600' },
  { value: 'malo', label: '🔴 Malo', color: 'text-red-600' },
  { value: 'averiado', label: '⚠️ Averiado', color: 'text-red-800' }
];

const motivosTraslado = [
  'Patrullaje de rutina',
  'Emergencia médica',
  'Traslado de personal',
  'Supervisión de obra',
  'Gestión administrativa',
  'Mantenimiento de equipos',
  'Inspección de seguridad',
  'Apoyo logístico',
  'Otros'
];

const vehiculosDisponibles = [
  'ABC-123',
  'DEF-456',
  'GHI-789',
  'JKL-012',
  'MNO-345'
];

export default function MovilidadesPage() {
  const [movilidades, setMovilidades] = useState<Movilidad[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMovilidad, setEditingMovilidad] = useState<Movilidad | null>(null);
  
  // Filtros
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [filtroSector, setFiltroSector] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    turno_id: '',
    sector_id: '',
    personal_id: '',
    vehiculo_placa: '',
    kilometraje_inicial: 0,
    kilometraje_final: 0,
    combustible_inicial: 0,
    combustible_final: 0,
    destino: '',
    motivo_traslado: '',
    hora_salida: '',
    hora_retorno: '',
    observaciones: '',
    estado_vehiculo_salida: 'bueno',
    estado_vehiculo_retorno: 'bueno'
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Declarar primero la función memoizada para evitar "used before declaration"
  const fetchMovilidades = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('movilidad')
        .select(`
          *,
          personal:personal_id (nombres, apellidos, dni, cargo),
          turno:turno_id (nombre_turno, hora_inicio, hora_fin),
          sector:sector_id (nombre_sector),
          supervisor:supervisor_id (nombres, apellidos)
        `)
        .order('fecha', { ascending: false })
        .order('hora_salida', { ascending: false });

      if (filtroFecha) {
        query = query.eq('fecha', filtroFecha);
      }
      if (filtroVehiculo) {
        query = query.eq('vehiculo_placa', filtroVehiculo);
      }
      if (filtroSector) {
        query = query.eq('sector_id', filtroSector);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMovilidades(data || []);
    } catch (error) {
      console.error('Error fetching movilidades:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroFecha, filtroVehiculo, filtroSector]);

  useEffect(() => {
    fetchMovilidades();
  }, [fetchMovilidades]);

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

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        kilometraje_final: formData.kilometraje_final || null,
        combustible_final: formData.combustible_final || null,
        hora_retorno: formData.hora_retorno || null,
        observaciones: formData.observaciones || null,
        estado_vehiculo_retorno: formData.estado_vehiculo_retorno || null
      };

      if (editingMovilidad) {
        const { error } = await supabase
          .from('movilidad')
          .update(dataToSave)
          .eq('id', editingMovilidad.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('movilidad')
          .insert([dataToSave]);
        
        if (error) throw error;
      }

      // Invalidate cache after data changes
    cacheInvalidation.onVehiculoChange();

      setShowForm(false);
      setEditingMovilidad(null);
      resetForm();
      fetchMovilidades();
    } catch (error) {
      console.error('Error saving movilidad:', error);
      alert('Error al guardar la movilidad');
    }
  };

  const handleEdit = (movilidad: Movilidad) => {
    setEditingMovilidad(movilidad);
    setFormData({
      fecha: movilidad.fecha,
      turno_id: movilidad.turno_id,
      sector_id: movilidad.sector_id,
      personal_id: movilidad.personal_id,
      vehiculo_placa: movilidad.vehiculo_placa,
      kilometraje_inicial: movilidad.kilometraje_inicial,
      kilometraje_final: movilidad.kilometraje_final || 0,
      combustible_inicial: movilidad.combustible_inicial,
      combustible_final: movilidad.combustible_final || 0,
      destino: movilidad.destino,
      motivo_traslado: movilidad.motivo_traslado,
      hora_salida: movilidad.hora_salida,
      hora_retorno: movilidad.hora_retorno || '',
      observaciones: movilidad.observaciones || '',
      estado_vehiculo_salida: movilidad.estado_vehiculo_salida,
      estado_vehiculo_retorno: movilidad.estado_vehiculo_retorno || 'bueno'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro de movilidad?')) {
      try {
        const { error } = await supabase
          .from('movilidad')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Invalidate cache after data changes
      cacheInvalidation.onVehiculoChange();
        
        fetchMovilidades();
      } catch (error) {
        console.error('Error deleting movilidad:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      turno_id: '',
      sector_id: '',
      personal_id: '',
      vehiculo_placa: '',
      kilometraje_inicial: 0,
      kilometraje_final: 0,
      combustible_inicial: 0,
      combustible_final: 0,
      destino: '',
      motivo_traslado: '',
      hora_salida: '',
      hora_retorno: '',
      observaciones: '',
      estado_vehiculo_salida: 'bueno',
      estado_vehiculo_retorno: 'bueno'
    });
  };

  const generarReportePDF = () => {
    const columns: ColumnDef<MovilidadReportRow>[] = [
      { key: 'fecha', label: 'Fecha', format: formatters.date },
      { key: 'personal_nombres', label: 'Nombres' },
      { key: 'personal_apellidos', label: 'Apellidos' },
      { key: 'personal_dni', label: 'DNI' },
      { key: 'turno_nombre', label: 'Turno' },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'vehiculo', label: 'Vehículo' },
      { key: 'destino', label: 'Destino' },
      { key: 'motivo', label: 'Motivo' },
      { key: 'hora_salida', label: 'Hora Salida' },
      { key: 'hora_retorno', label: 'Hora Retorno' },
      { key: 'estado_salida', label: 'Estado Salida', format: formatters.status },
      { key: 'observaciones', label: 'Observaciones' }
    ];

    const reportData: MovilidadReportRow[] = movilidades.map(movilidad => ({
      fecha: movilidad.fecha,
      personal_nombres: movilidad.personal?.nombres || '',
      personal_apellidos: movilidad.personal?.apellidos || '',
      personal_dni: movilidad.personal?.dni || '',
      turno_nombre: movilidad.turno?.nombre_turno || '',
      sector_nombre: movilidad.sector?.nombre_sector || '',
      vehiculo: movilidad.vehiculo_placa,
      destino: movilidad.destino,
      motivo: movilidad.motivo_traslado,
      hora_salida: movilidad.hora_salida,
      hora_retorno: movilidad.hora_retorno || '',
      estado_salida: movilidad.estado_vehiculo_salida,
      observaciones: movilidad.observaciones || ''
    }));

    generateFilteredReport(
      'Reporte de Movilidades',
      reportData,
      columns,
      {
        'Fecha': filtroFecha,
        'Vehículo': filtroVehiculo || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos'
      },
      'pdf'
    );
  };

  const generarReporteExcel = () => {
    const columns: ColumnDef<MovilidadReportRow>[] = [
      { key: 'fecha', label: 'Fecha', format: formatters.date },
      { key: 'personal_nombres', label: 'Nombres' },
      { key: 'personal_apellidos', label: 'Apellidos' },
      { key: 'personal_dni', label: 'DNI' },
      { key: 'turno_nombre', label: 'Turno' },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'vehiculo', label: 'Vehículo' },
      { key: 'destino', label: 'Destino' },
      { key: 'motivo', label: 'Motivo' },
      { key: 'hora_salida', label: 'Hora Salida' },
      { key: 'hora_retorno', label: 'Hora Retorno' },
      { key: 'estado_salida', label: 'Estado Salida', format: formatters.status },
      { key: 'observaciones', label: 'Observaciones' }
    ];

    const reportData: MovilidadReportRow[] = movilidades.map(movilidad => ({
      fecha: movilidad.fecha,
      personal_nombres: movilidad.personal?.nombres || '',
      personal_apellidos: movilidad.personal?.apellidos || '',
      personal_dni: movilidad.personal?.dni || '',
      turno_nombre: movilidad.turno?.nombre_turno || '',
      sector_nombre: movilidad.sector?.nombre_sector || '',
      vehiculo: movilidad.vehiculo_placa,
      destino: movilidad.destino,
      motivo: movilidad.motivo_traslado,
      hora_salida: movilidad.hora_salida,
      hora_retorno: movilidad.hora_retorno || '',
      estado_salida: movilidad.estado_vehiculo_salida,
      observaciones: movilidad.observaciones || ''
    }));

    generateFilteredReport(
      'Reporte de Movilidades',
      reportData,
      columns,
      {
        'Fecha': filtroFecha,
        'Vehículo': filtroVehiculo || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos'
      },
      'excel'
    );
  };

  const imprimirLista = () => {
    window.print();
  };

  const getEstadoInfo = (estado: string) => {
    return estadosVehiculo.find(e => e.value === estado) || estadosVehiculo[1];
  };

  const calcularKilometrajeRecorrido = (inicial: number, final: number | null) => {
    if (!final) return 'En curso';
    return `${final - inicial} km`;
  };

  const calcularCombustibleConsumido = (inicial: number, final: number | null) => {
    if (!final) return 'En curso';
    const consumido = inicial - final;
    return `${consumido.toFixed(1)} L`;
  };

  return (
    <div className="p-6">
      <ReportActionBar
        title="Control de Movilidades"
        onPdf={generarReportePDF}
        onExcel={generarReporteExcel}
        onPrint={imprimirLista}
        createLabel="Nueva Movilidad"
        onCreate={() => setShowForm(true)}
      />

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehículo</label>
            <select
              value={filtroVehiculo}
              onChange={(e) => setFiltroVehiculo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los vehículos</option>
              {vehiculosDisponibles.map((vehiculo) => (
                <option key={vehiculo} value={vehiculo}>
                  {vehiculo}
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
        </div>
      </div>

      {/* Lista de Movilidades */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conductor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destino/Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kilometraje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Combustible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
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
                    Cargando movilidades...
                  </td>
                </tr>
              ) : movilidades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No hay movilidades registradas
                  </td>
                </tr>
              ) : (
                movilidades.map((movilidad) => {
                  const estadoSalidaInfo = getEstadoInfo(movilidad.estado_vehiculo_salida);
                  const estadoRetornoInfo = movilidad.estado_vehiculo_retorno ? getEstadoInfo(movilidad.estado_vehiculo_retorno) : null;
                  
                  return (
                    <tr key={movilidad.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {movilidad.personal?.nombres} {movilidad.personal?.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            {movilidad.sector?.nombre_sector} - {movilidad.turno?.nombre_turno}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <FaCar className="text-blue-500" />
                          {movilidad.vehiculo_placa}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(movilidad.fecha).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <FaRoute className="text-green-500" />
                          {movilidad.destino}
                        </div>
                        <div className="text-sm text-gray-500">
                          {movilidad.motivo_traslado}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Salida: {movilidad.hora_salida}
                        </div>
                        <div className="text-sm text-gray-500">
                          Retorno: {movilidad.hora_retorno || 'En curso'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Inicial: {movilidad.kilometraje_inicial} km
                        </div>
                        <div className="text-sm text-gray-500">
                          Recorrido: {calcularKilometrajeRecorrido(movilidad.kilometraje_inicial, movilidad.kilometraje_final)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <FaGasPump className="text-orange-500" />
                          {movilidad.combustible_inicial} L
                        </div>
                        <div className="text-sm text-gray-500">
                          Consumido: {calcularCombustibleConsumido(movilidad.combustible_inicial, movilidad.combustible_final)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${estadoSalidaInfo.color}`}>
                          Salida: {estadoSalidaInfo.label}
                        </div>
                        {estadoRetornoInfo && (
                          <div className={`text-sm font-medium ${estadoRetornoInfo.color}`}>
                            Retorno: {estadoRetornoInfo.label}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(movilidad)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(movilidad.id)}
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
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingMovilidad ? 'Editar Movilidad' : 'Nueva Movilidad'}
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
                        {turno.nombre_turno}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conductor</label>
                  <select
                    value={formData.personal_id}
                    onChange={(e) => setFormData({ ...formData, personal_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar conductor</option>
                    {personal
                      .filter(p => !formData.sector_id || p.sector_id === formData.sector_id)
                      .map((persona) => (
                      <option key={persona.id} value={persona.id}>
                        {persona.nombres} {persona.apellidos} - {persona.cargo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehículo</label>
                  <select
                    value={formData.vehiculo_placa}
                    onChange={(e) => setFormData({ ...formData, vehiculo_placa: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar vehículo</option>
                    {vehiculosDisponibles.map((vehiculo) => (
                      <option key={vehiculo} value={vehiculo}>
                        {vehiculo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del Traslado</label>
                  <select
                    value={formData.motivo_traslado}
                    onChange={(e) => setFormData({ ...formData, motivo_traslado: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar motivo</option>
                    {motivosTraslado.map((motivo) => (
                      <option key={motivo} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                  <input
                    type="text"
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Lugar de destino"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora Salida</label>
                    <input
                      type="time"
                      value={formData.hora_salida}
                      onChange={(e) => setFormData({ ...formData, hora_salida: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora Retorno</label>
                    <input
                      type="time"
                      value={formData.hora_retorno}
                      onChange={(e) => setFormData({ ...formData, hora_retorno: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kilometraje Inicial</label>
                  <input
                    type="number"
                    value={formData.kilometraje_inicial}
                    onChange={(e) => setFormData({ ...formData, kilometraje_inicial: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kilometraje Final</label>
                  <input
                    type="number"
                    value={formData.kilometraje_final}
                    onChange={(e) => setFormData({ ...formData, kilometraje_final: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Combustible Inicial (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.combustible_inicial}
                    onChange={(e) => setFormData({ ...formData, combustible_inicial: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Combustible Final (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.combustible_final}
                    onChange={(e) => setFormData({ ...formData, combustible_final: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado Vehículo Salida</label>
                  <select
                    value={formData.estado_vehiculo_salida}
                    onChange={(e) => setFormData({ ...formData, estado_vehiculo_salida: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {estadosVehiculo.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado Vehículo Retorno</label>
                  <select
                    value={formData.estado_vehiculo_retorno}
                    onChange={(e) => setFormData({ ...formData, estado_vehiculo_retorno: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin retorno aún</option>
                    {estadosVehiculo.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observaciones del viaje, estado del vehículo, incidencias, etc."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingMovilidad ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMovilidad(null);
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