'use client';
import type { ColumnDef } from '@/lib/reportUtils';

type VoucherReportRow = {
  fecha: string;
  tipo: string;
  personal: string;
  concepto: string;
  monto: string;
  moneda: string;
  metodo_pago: string;
  estado: string;
  observaciones: string;
};

import { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaMoneyBillWave, FaReceipt, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import ReportActionBar from '@/components/ReportActionBar';
import { supabase } from '@/lib/supabase';
import { generateFilteredReport, formatters } from '@/lib/reportUtils';

// Interfaces para TypeScript
interface Voucher {
  id: string;
  numero_voucher: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  tipo_voucher: string;
  concepto: string;
  monto: number;
  moneda: string;
  personal_solicitante_id: string;
  personal_autoriza_id: string | null;
  estado: string;
  observaciones: string | null;
  archivo_adjunto: string | null;
  fecha_pago: string | null;
  metodo_pago: string | null;
  numero_comprobante: string | null;
  created_at: string;
  updated_at: string;
  // Datos relacionados
  personal_solicitante?: {
    nombres: string;
    apellidos: string;
    dni: string;
    cargo: string;
  };
  personal_autoriza?: {
    nombres: string;
    apellidos: string;
    dni: string;
    cargo: string;
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

const tiposVoucher = [
  { value: 'viaticos', label: '🍽️ Viáticos', description: 'Gastos de alimentación y hospedaje' },
  { value: 'combustible', label: '⛽ Combustible', description: 'Gastos de combustible para vehículos' },
  { value: 'mantenimiento', label: '🔧 Mantenimiento', description: 'Gastos de mantenimiento y reparaciones' },
  { value: 'materiales', label: '📦 Materiales', description: 'Compra de materiales y suministros' },
  { value: 'servicios', label: '🛠️ Servicios', description: 'Contratación de servicios externos' },
  { value: 'emergencia', label: '🚨 Emergencia', description: 'Gastos de emergencia no programados' },
  { value: 'otros', label: '📋 Otros', description: 'Otros gastos operativos' }
];

const estadosVoucher = [
  { value: 'pendiente', label: '⏳ Pendiente', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'aprobado', label: '✅ Aprobado', color: 'text-green-600 bg-green-50' },
  { value: 'rechazado', label: '❌ Rechazado', color: 'text-red-600 bg-red-50' },
  { value: 'pagado', label: '💰 Pagado', color: 'text-blue-600 bg-blue-50' },
  { value: 'vencido', label: '⚠️ Vencido', color: 'text-orange-600 bg-orange-50' }
];

const monedas = [
  { value: 'PEN', label: 'S/ - Soles' },
  { value: 'USD', label: '$ - Dólares' }
];

const metodosPago = [
  { value: 'efectivo', label: '💵 Efectivo' },
  { value: 'transferencia', label: '🏦 Transferencia bancaria' },
  { value: 'cheque', label: '📝 Cheque' },
  { value: 'tarjeta', label: '💳 Tarjeta corporativa' }
];

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  
  // Filtros
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPersonal, setFiltroPersonal] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    numero_voucher: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    tipo_voucher: 'viaticos',
    concepto: '',
    monto: '',
    moneda: 'PEN',
    personal_solicitante_id: '',
    personal_autoriza_id: '',
    estado: 'pendiente',
    observaciones: '',
    metodo_pago: '',
    numero_comprobante: ''
  });

  const fetchData = async () => {
    try {
      const { data: personalData, error } = await supabase
        .from('personal')
        .select('*')
        .eq('estado', 'activo')
        .order('nombres');

      if (error) throw error;
      if (personalData) setPersonal(personalData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('voucher')
        .select(`
          *,
          personal_solicitante:personal!voucher_personal_solicitante_id_fkey(nombres, apellidos),
          personal_autoriza:personal!voucher_personal_autoriza_id_fkey(nombres, apellidos)
        `);

      // Aplicar filtros
      if (filtroFechaInicio) {
        query = query.gte('fecha_emision', filtroFechaInicio);
      }
      if (filtroFechaFin) {
        query = query.lte('fecha_emision', filtroFechaFin);
      }
      if (filtroTipo) {
        query = query.eq('tipo_voucher', filtroTipo);
      }
      if (filtroEstado) {
        query = query.eq('estado', filtroEstado);
      }
      if (filtroPersonal) {
        query = query.or(`personal_solicitante_id.eq.${filtroPersonal},personal_autoriza_id.eq.${filtroPersonal}`);
      }

      const { data, error } = await query.order('fecha_emision', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroFechaInicio, filtroFechaFin, filtroTipo, filtroEstado, filtroPersonal]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const generateVoucherNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-4);
    return `VCH-${year}${month}${day}-${time}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        numero_voucher: formData.numero_voucher || generateVoucherNumber(),
        monto: parseFloat(formData.monto),
        fecha_vencimiento: formData.fecha_vencimiento || null,
        personal_autoriza_id: formData.personal_autoriza_id || null,
        observaciones: formData.observaciones || null,
        metodo_pago: formData.metodo_pago || null,
        numero_comprobante: formData.numero_comprobante || null
      };

      if (editingVoucher) {
        const { error } = await supabase
          .from('voucher')
          .update(dataToSave)
          .eq('id', editingVoucher.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('voucher')
          .insert([dataToSave]);
        
        if (error) throw error;
      }

      setShowForm(false);
      setEditingVoucher(null);
      resetForm();
      fetchVouchers();
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Error al guardar el voucher');
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      numero_voucher: voucher.numero_voucher,
      fecha_emision: voucher.fecha_emision,
      fecha_vencimiento: voucher.fecha_vencimiento || '',
      tipo_voucher: voucher.tipo_voucher,
      concepto: voucher.concepto,
      monto: voucher.monto.toString(),
      moneda: voucher.moneda,
      personal_solicitante_id: voucher.personal_solicitante_id,
      personal_autoriza_id: voucher.personal_autoriza_id || '',
      estado: voucher.estado,
      observaciones: voucher.observaciones || '',
      metodo_pago: voucher.metodo_pago || '',
      numero_comprobante: voucher.numero_comprobante || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este voucher?')) {
      try {
        const { error } = await supabase
          .from('voucher')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchVouchers();
      } catch (error) {
        console.error('Error deleting voucher:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      numero_voucher: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      tipo_voucher: 'viaticos',
      concepto: '',
      monto: '',
      moneda: 'PEN',
      personal_solicitante_id: '',
      personal_autoriza_id: '',
      estado: 'pendiente',
      observaciones: '',
      metodo_pago: '',
      numero_comprobante: ''
    });
  };

  const generarReportePDF = async () => {
    const columns: ColumnDef<VoucherReportRow>[] = [
      { header: 'Fecha', key: 'fecha' },
      { header: 'Tipo', key: 'tipo' },
      { header: 'Personal', key: 'personal' },
      { header: 'Concepto', key: 'concepto' },
      { header: 'Monto', key: 'monto' },
      { header: 'Moneda', key: 'moneda' },
      { header: 'Método Pago', key: 'metodo_pago' },
      { header: 'Estado', key: 'estado' },
      { header: 'Observaciones', key: 'observaciones' }
    ];

    const data: VoucherReportRow[] = vouchers.map(voucher => ({
      fecha: formatters.date(voucher.fecha_emision),
      tipo: voucher.tipo_voucher,
      personal: `${voucher.personal_solicitante?.nombres} ${voucher.personal_solicitante?.apellidos}`,
      concepto: voucher.concepto,
      monto: formatters.currency(voucher.monto),
      moneda: voucher.moneda,
      metodo_pago: voucher.metodo_pago || 'N/A',
      estado: voucher.estado,
      observaciones: voucher.observaciones || 'Ninguna'
    }));

    await generateFilteredReport({
      title: 'Reporte de Vouchers',
      data,
      columns,
      format: 'pdf',
      filters: {
        fecha_inicio: filtroFechaInicio,
        fecha_fin: filtroFechaFin,
        tipo: filtroTipo,
        estado: filtroEstado,
        personal: filtroPersonal
      }
    });
  };

  const generarReporteExcel = async () => {
    const columns: ColumnDef<VoucherReportRow>[] = [
      { header: 'Fecha', key: 'fecha' },
      { header: 'Tipo', key: 'tipo' },
      { header: 'Personal', key: 'personal' },
      { header: 'Concepto', key: 'concepto' },
      { header: 'Monto', key: 'monto' },
      { header: 'Moneda', key: 'moneda' },
      { header: 'Método Pago', key: 'metodo_pago' },
      { header: 'Estado', key: 'estado' },
      { header: 'Observaciones', key: 'observaciones' }
    ];

    const data: VoucherReportRow[] = vouchers.map(voucher => ({
      fecha: formatters.date(voucher.fecha_emision),
      tipo: voucher.tipo_voucher,
      personal: `${voucher.personal_solicitante?.nombres} ${voucher.personal_solicitante?.apellidos}`,
      concepto: voucher.concepto,
      monto: formatters.currency(voucher.monto),
      moneda: voucher.moneda,
      metodo_pago: voucher.metodo_pago || 'N/A',
      estado: voucher.estado,
      observaciones: voucher.observaciones || 'Ninguna'
    }));

    await generateFilteredReport({
      title: 'Reporte de Vouchers',
      data,
      columns,
      format: 'excel',
      filters: {
        fecha_inicio: filtroFechaInicio,
        fecha_fin: filtroFechaFin,
        tipo: filtroTipo,
        estado: filtroEstado,
        personal: filtroPersonal
      }
    });
  };

  const imprimirLista = () => {
    window.print();
  };

  const getEstadoInfo = (estado: string) => {
    return estadosVoucher.find(e => e.value === estado) || estadosVoucher[0];
  };

  const getTipoInfo = (tipo: string) => {
    return tiposVoucher.find(t => t.value === tipo) || tiposVoucher[0];
  };

  const formatMonto = (monto: number, moneda: string) => {
    const symbol = moneda === 'USD' ? '$' : 'S/';
    return `${symbol} ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  const calcularTotales = () => {
    type EstadoKey = 'pendiente' | 'aprobado' | 'rechazado' | 'pagado' | 'vencido';
    type TotalesPorMoneda = Record<string, { total: number } & Record<EstadoKey, number>>;

    const inicialEstado: { total: number } & Record<EstadoKey, number> = {
      total: 0,
      pendiente: 0,
      aprobado: 0,
      rechazado: 0,
      pagado: 0,
      vencido: 0,
    };

    const totales = vouchers.reduce<TotalesPorMoneda>((acc, voucher) => {
      if (!acc[voucher.moneda]) {
        acc[voucher.moneda] = { ...inicialEstado };
      }
      acc[voucher.moneda].total += voucher.monto;
      const estado = (voucher.estado as EstadoKey);
      if (estado in acc[voucher.moneda]) {
        acc[voucher.moneda][estado] += voucher.monto;
      }
      return acc;
    }, {} as TotalesPorMoneda);

    return totales;
  };

  const totales = calcularTotales();

  return (
    <div className="p-6">
      <ReportActionBar
        title="Control de Vouchers"
        onPdf={generarReportePDF}
        onExcel={generarReporteExcel}
        onPrint={imprimirLista}
        createLabel="Nuevo Voucher"
        onCreate={() => setShowForm(true)}
      />

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(totales).map(([moneda, datos]) => (
          <div key={moneda} className="bg-white p-4 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">
              Totales en {moneda === 'USD' ? 'Dólares' : 'Soles'}
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-bold">{formatMonto(datos.total, moneda)}</span>
              </div>
              <div className="flex justify-between text-yellow-600">
                <span>Pendiente:</span>
                <span>{formatMonto(datos.pendiente || 0, moneda)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Aprobado:</span>
                <span>{formatMonto(datos.aprobado || 0, moneda)}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Pagado:</span>
                <span>{formatMonto(datos.pagado || 0, moneda)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2">
            <FaClock className="text-yellow-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {vouchers.filter(v => v.estado === 'pendiente').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Aprobados</p>
              <p className="text-2xl font-bold text-green-600">
                {vouchers.filter(v => v.estado === 'aprobado').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <FaMoneyBillWave className="text-blue-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Pagados</p>
              <p className="text-2xl font-bold text-blue-600">
                {vouchers.filter(v => v.estado === 'pagado').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-red-600 text-xl" />
            <div>
              <p className="text-sm text-gray-600">Rechazados</p>
              <p className="text-2xl font-bold text-red-600">
                {vouchers.filter(v => v.estado === 'rechazado').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
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
              {tiposVoucher.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
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
              {estadosVoucher.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personal</label>
            <select
              value={filtroPersonal}
              onChange={(e) => setFiltroPersonal(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todo el personal</option>
              {personal.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.nombres} {persona.apellidos}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Vouchers */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo/Concepto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fechas
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
                    Cargando vouchers...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No hay vouchers registrados
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => {
                  const estadoInfo = getEstadoInfo(voucher.estado);
                  const tipoInfo = getTipoInfo(voucher.tipo_voucher);
                  
                  return (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <FaReceipt className="text-blue-500" />
                            {voucher.numero_voucher}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(voucher.fecha_emision).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {voucher.personal_solicitante?.nombres} {voucher.personal_solicitante?.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            {voucher.personal_solicitante?.cargo}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {voucher.personal_solicitante?.dni}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tipoInfo.label}
                          </div>
                          <div className="text-sm text-gray-500">
                            {voucher.concepto}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatMonto(voucher.monto, voucher.moneda)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Emisión: {new Date(voucher.fecha_emision).toLocaleDateString()}
                        </div>
                        {voucher.fecha_vencimiento && (
                          <div className="text-sm text-gray-500">
                            Vence: {new Date(voucher.fecha_vencimiento).toLocaleDateString()}
                          </div>
                        )}
                        {voucher.fecha_pago && (
                          <div className="text-sm text-green-600">
                            Pagado: {new Date(voucher.fecha_pago).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(voucher)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(voucher.id)}
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
              {editingVoucher ? 'Editar Voucher' : 'Nuevo Voucher'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Voucher</label>
                  <input
                    type="text"
                    value={formData.numero_voucher}
                    onChange={(e) => setFormData({ ...formData, numero_voucher: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Se generará automáticamente si se deja vacío"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Emisión</label>
                  <input
                    type="date"
                    value={formData.fecha_emision}
                    onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={formData.fecha_vencimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Voucher</label>
                  <select
                    value={formData.tipo_voucher}
                    onChange={(e) => setFormData({ ...formData, tipo_voucher: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {tiposVoucher.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label} - {tipo.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                  <select
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {monedas.map((moneda) => (
                      <option key={moneda.value} value={moneda.value}>
                        {moneda.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personal Solicitante</label>
                  <select
                    value={formData.personal_solicitante_id}
                    onChange={(e) => setFormData({ ...formData, personal_solicitante_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar personal</option>
                    {personal.map((persona) => (
                      <option key={persona.id} value={persona.id}>
                        {persona.nombres} {persona.apellidos} - {persona.cargo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personal que Autoriza</label>
                  <select
                    value={formData.personal_autoriza_id}
                    onChange={(e) => setFormData({ ...formData, personal_autoriza_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar personal</option>
                    {personal
                      .filter(p => ['supervisor', 'jefe', 'administrador'].includes(p.cargo.toLowerCase()))
                      .map((persona) => (
                      <option key={persona.id} value={persona.id}>
                        {persona.nombres} {persona.apellidos} - {persona.cargo}
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
                  >
                    {estadosVoucher.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Concepto</label>
                <textarea
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describir detalladamente el concepto del gasto..."
                  required
                />
              </div>

              {formData.estado === 'pagado' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                    <select
                      value={formData.metodo_pago}
                      onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar método</option>
                      {metodosPago.map((metodo) => (
                        <option key={metodo.value} value={metodo.value}>
                          {metodo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Comprobante</label>
                    <input
                      type="text"
                      value={formData.numero_comprobante}
                      onChange={(e) => setFormData({ ...formData, numero_comprobante: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Número de recibo, transferencia, etc."
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observaciones adicionales sobre el voucher..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingVoucher ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVoucher(null);
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