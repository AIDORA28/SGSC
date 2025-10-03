'use client';
import type { ColumnDef } from '@/lib/reportUtils';

type PersonalReportRow = {
  dni: string;
  nombres_completos: string;
  cargo: string;
  estado: string;
  sector_nombre: string;
  turno_nombre: string;
  fecha_ingreso: string;
  telefono: string;
  email?: string;
};

import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaPrint, FaEye, FaUser, FaFileExcel } from 'react-icons/fa';
import { generateFilteredReport, formatters } from '@/lib/reportUtils';
import { supabase } from '@/lib/supabase';
import { cachedFetchers, cacheInvalidation } from '@/lib/dataCache';

// Interfaces para TypeScript
interface Personal {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  estado: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fecha_ingreso: string;
  sector_id: string | null;
  turno_id: string | null;
  created_at: string;
  // Datos relacionados
  sector?: {
    nombre_sector: string;
  };
  turno?: {
    nombre_turno: string;
    hora_inicio: string;
    hora_fin: string;
  };
}

interface Sector {
  id: string;
  nombre_sector: string;
  descripcion: string;
}

interface Turno {
  id: string;
  nombre_turno: string;
  hora_inicio: string;
  hora_fin: string;
}

const cargosPersonal = [
  'Sereno',
  'Supervisor',
  'Chofer',
  'Operador de cámaras',
  'Operador COE',
  'Jefe de turno',
  'Coordinador',
  'Administrador'
];

const estadosPersonal = [
  { value: 'activo', label: '✅ Activo', color: 'text-green-600' },
  { value: 'inactivo', label: '❌ Inactivo', color: 'text-red-600' },
  { value: 'vacaciones', label: '🏖️ Vacaciones', color: 'text-blue-600' },
  { value: 'licencia', label: '📋 Licencia', color: 'text-yellow-600' },
  { value: 'suspendido', label: '⚠️ Suspendido', color: 'text-orange-600' }
];

export default function PersonalPage() {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState<Personal | null>(null);
  const [viewMode, setViewMode] = useState(false);
  
  // Filtros
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroSector, setFiltroSector] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    cargo: '',
    estado: 'activo',
    telefono: '',
    email: '',
    direccion: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    sector_id: '',
    turno_id: ''
  });

  const fetchData = async () => {
    try {
      const [sectoresData, turnosData] = await Promise.all([
        cachedFetchers.getSectors(),
        cachedFetchers.getTurnos()
      ]);

      setSectores(sectoresData);
      setTurnos(turnosData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchPersonal = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('personal')
        .select(`
          *,
          sector:sector_id (nombre_sector),
          turno:turno_id (nombre_turno, hora_inicio, hora_fin)
        `)
        .order('nombres', { ascending: true });

      if (filtroCargo) {
        query = query.eq('cargo', filtroCargo);
      }
      if (filtroEstado) {
        query = query.eq('estado', filtroEstado);
      }
      if (filtroSector) {
        query = query.eq('sector_id', filtroSector);
      }
      if (filtroTurno) {
        query = query.eq('turno_id', filtroTurno);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPersonal(data || []);
    } catch (error) {
      console.error('Error fetching personal:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroCargo, filtroEstado, filtroSector, filtroTurno]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPersonal();
  }, [fetchPersonal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        sector_id: formData.sector_id || null,
        turno_id: formData.turno_id || null,
        telefono: formData.telefono || null,
        email: formData.email || null,
        direccion: formData.direccion || null
      };

      if (editingPersonal) {
        const { error } = await supabase
          .from('personal')
          .update(dataToSave)
          .eq('id', editingPersonal.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('personal')
          .insert([dataToSave]);
        
        if (error) throw error;
      }

      setShowForm(false);
      setEditingPersonal(null);
      setViewMode(false);
      resetForm();
      
      // Invalidate cache after data changes
      cacheInvalidation.onPersonalChange();
      
      fetchPersonal();
    } catch (error) {
      console.error('Error saving personal:', error);
      alert('Error al guardar el personal');
    }
  };

  const handleEdit = (person: Personal) => {
    setEditingPersonal(person);
    setFormData({
      dni: person.dni,
      nombres: person.nombres,
      apellidos: person.apellidos,
      cargo: person.cargo,
      estado: person.estado,
      telefono: person.telefono || '',
      email: person.email || '',
      direccion: person.direccion || '',
      fecha_ingreso: person.fecha_ingreso,
      sector_id: person.sector_id || '',
      turno_id: person.turno_id || ''
    });
    setViewMode(false);
    setShowForm(true);
  };

  const handleView = (person: Personal) => {
    setEditingPersonal(person);
    setFormData({
      dni: person.dni,
      nombres: person.nombres,
      apellidos: person.apellidos,
      cargo: person.cargo,
      estado: person.estado,
      telefono: person.telefono || '',
      email: person.email || '',
      direccion: person.direccion || '',
      fecha_ingreso: person.fecha_ingreso,
      sector_id: person.sector_id || '',
      turno_id: person.turno_id || ''
    });
    setViewMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este personal?')) {
      try {
        const { error } = await supabase
          .from('personal')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Invalidate cache after data changes
        cacheInvalidation.onPersonalChange();
        
        fetchPersonal();
      } catch (error) {
        console.error('Error deleting personal:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      dni: '',
      nombres: '',
      apellidos: '',
      cargo: '',
      estado: 'activo',
      telefono: '',
      email: '',
      direccion: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      sector_id: '',
      turno_id: ''
    });
  };

  const generarReportePDF = () => {
    const columns: ColumnDef<PersonalReportRow>[] = [
      { key: 'dni', label: 'DNI' },
      { key: 'nombres_completos', label: 'Nombres Completos' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'estado', label: 'Estado', format: formatters.status },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'turno_nombre', label: 'Turno' },
      { key: 'fecha_ingreso', label: 'Fecha Ingreso', format: formatters.date },
      { key: 'telefono', label: 'Teléfono' }
    ];

    const reportData: PersonalReportRow[] = personal.map(person => ({
      dni: person.dni,
      nombres_completos: `${person.nombres} ${person.apellidos}`,
      cargo: person.cargo,
      estado: person.estado,
      sector_nombre: person.sector?.nombre_sector || '',
      turno_nombre: person.turno?.nombre_turno || '',
      fecha_ingreso: person.fecha_ingreso,
      telefono: person.telefono || ''
    }));

    generateFilteredReport(
      'Reporte de Personal',
      reportData,
      columns,
      {
        'Cargo': filtroCargo || 'Todos',
        'Estado': estadosPersonal.find(e => e.value === filtroEstado)?.label || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos',
        'Turno': turnos.find(t => t.id === filtroTurno)?.nombre_turno || 'Todos'
      },
      'pdf'
    );
  };

  const generarReporteExcel = () => {
    const columns: ColumnDef<PersonalReportRow>[] = [
      { key: 'dni', label: 'DNI' },
      { key: 'nombres_completos', label: 'Nombres Completos' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'estado', label: 'Estado', format: formatters.status },
      { key: 'sector_nombre', label: 'Sector' },
      { key: 'turno_nombre', label: 'Turno' },
      { key: 'fecha_ingreso', label: 'Fecha Ingreso', format: formatters.date },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'email', label: 'Email' }
    ];

    const reportData: PersonalReportRow[] = personal.map(person => ({
      dni: person.dni,
      nombres_completos: `${person.nombres} ${person.apellidos}`,
      cargo: person.cargo,
      estado: person.estado,
      sector_nombre: person.sector?.nombre_sector || '',
      turno_nombre: person.turno?.nombre_turno || '',
      fecha_ingreso: person.fecha_ingreso,
      telefono: person.telefono || '',
      email: person.email || ''
    }));

    generateFilteredReport(
      'Reporte de Personal',
      reportData,
      columns,
      {
        'Cargo': filtroCargo || 'Todos',
        'Estado': estadosPersonal.find(e => e.value === filtroEstado)?.label || 'Todos',
        'Sector': sectores.find(s => s.id === filtroSector)?.nombre_sector || 'Todos',
        'Turno': turnos.find(t => t.id === filtroTurno)?.nombre_turno || 'Todos'
      },
      'excel'
    );
  };

  const imprimirLista = () => {
    window.print();
  };

  const getEstadoInfo = (estado: string) => {
    return estadosPersonal.find(e => e.value === estado) || estadosPersonal[0];
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Personal</h1>
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
            <FaPlus /> Agregar Personal
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
            <select
              value={filtroCargo}
              onChange={(e) => setFiltroCargo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los cargos</option>
              {cargosPersonal.map((cargo) => (
                <option key={cargo} value={cargo}>
                  {cargo}
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
              {estadosPersonal.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
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
        </div>
      </div>

      {/* Lista de Personal */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DNI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombres Completos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
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
                    Cargando personal...
                  </td>
                </tr>
              ) : personal.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No hay personal registrado
                  </td>
                </tr>
              ) : (
                personal.map((person) => {
                  const estadoInfo = getEstadoInfo(person.estado);
                  return (
                    <tr key={person.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person.dni}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUser className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {person.nombres} {person.apellidos}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person.cargo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person.sector?.nombre_sector || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person.turno?.nombre_turno || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {person.telefono || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {person.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(person)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEdit(person)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(person.id)}
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
              {viewMode ? 'Ver Personal' : editingPersonal ? 'Editar Personal' : 'Agregar Personal'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">DNI</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="12345678"
                    required
                    disabled={viewMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Ingreso</label>
                  <input
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={viewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombres</label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Juan Carlos"
                    required
                    disabled={viewMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Pérez García"
                    required
                    disabled={viewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                  <select
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={viewMode}
                  >
                    <option value="">Seleccionar cargo</option>
                    {cargosPersonal.map((cargo) => (
                      <option key={cargo} value={cargo}>
                        {cargo}
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
                    {estadosPersonal.map((estado) => (
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
                    disabled={viewMode}
                  >
                    <option value="">Sin sector asignado</option>
                    {sectores.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.nombre_sector}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
                  <select
                    value={formData.turno_id}
                    onChange={(e) => setFormData({ ...formData, turno_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={viewMode}
                  >
                    <option value="">Sin turno asignado</option>
                    {turnos.map((turno) => (
                      <option key={turno.id} value={turno.id}>
                        {turno.nombre_turno}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="999123456"
                    disabled={viewMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="correo@ejemplo.com"
                    disabled={viewMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Dirección completa..."
                  disabled={viewMode}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPersonal(null);
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
                    {editingPersonal ? 'Actualizar' : 'Guardar'}
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