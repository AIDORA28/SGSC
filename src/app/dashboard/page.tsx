'use client';

import { FaUsers, FaCarAlt, FaClipboardList, FaExclamationTriangle, FaVideo, FaMoneyBillWave, FaClock, FaCheckCircle, FaChartBar, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Interfaces
interface DashboardStats {
  personalActivo: number;
  asistenciasHoy: number;
  patrullajesHoy: number;
  incidenciasHoy: number;
  movilidadesHoy: number;
  cabinasOperativas: number;
  vouchersHoy: number;
  montoVouchersHoy: number;
}

interface RecentActivity {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  estado: string;
  personal?: string;
  sector?: string;
}

// Componente de tarjeta para el dashboard
const DashboardCard = ({ 
  title, 
  value, 
  icon, 
  color,
  subtitle,
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className={`p-6 rounded-lg shadow-md ${color} relative overflow-hidden`}>
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-gray-100 uppercase">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-200 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
            <span className={`mr-1 ${trend.isPositive ? '↗' : '↘'}`}>
              {trend.isPositive ? '↗' : '↘'}
            </span>
            {Math.abs(trend.value)}% vs ayer
          </div>
        )}
      </div>
      <div className="p-3 bg-white bg-opacity-30 rounded-full">
        {icon}
      </div>
    </div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
  </div>
);

// Componente de gráfico simple
const SimpleChart = ({ data, title }: { data: { label: string; value: number; color: string }[]; title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FaChartBar className="text-blue-500" />
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-sm text-gray-600 font-medium">{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
              <div 
                className={`h-3 rounded-full ${item.color} transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
            </div>
            <div className="w-12 text-sm font-bold text-gray-700">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    personalActivo: 0,
    asistenciasHoy: 0,
    patrullajesHoy: 0,
    incidenciasHoy: 0,
    movilidadesHoy: 0,
    cabinasOperativas: 0,
    vouchersHoy: 0,
    montoVouchersHoy: 0
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    // Actualizar datos cada 5 minutos
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Optimización: Usar consultas más específicas con count() para mejor rendimiento
      const [
        personalRes,
        asistenciasRes,
        patrullajesRes,
        incidenciasRes,
        movilidadesRes,
        cabinasRes,
        vouchersRes,
        vouchersDataRes
      ] = await Promise.all([
        supabase.from('personal').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
        supabase.from('asistencia').select('id', { count: 'exact', head: true }).eq('fecha', today),
        supabase.from('patrullaje').select('id, ruta, hora_inicio, estado', { count: 'exact' }).eq('fecha', today).order('hora_inicio', { ascending: false }).limit(5),
        supabase.from('incidencia').select('id, tipo_incidencia, fecha, hora, estado, sector_id', { count: 'exact' }).eq('fecha', today).order('hora', { ascending: false }).limit(5),
        supabase.from('movilidad').select('id', { count: 'exact', head: true }).eq('fecha', today),
        supabase.from('bitacora_cabina').select('id', { count: 'exact', head: true }).eq('fecha', today).eq('estado_camara', 'operativo'),
        supabase.from('voucher').select('id', { count: 'exact', head: true }).eq('fecha_emision', today),
        supabase.from('voucher').select('monto').eq('fecha_emision', today)
      ]);

      // Calcular estadísticas optimizadas
      const newStats: DashboardStats = {
        personalActivo: personalRes.count || 0,
        asistenciasHoy: asistenciasRes.count || 0,
        patrullajesHoy: patrullajesRes.count || 0,
        incidenciasHoy: incidenciasRes.count || 0,
        movilidadesHoy: movilidadesRes.count || 0,
        cabinasOperativas: cabinasRes.count || 0,
        vouchersHoy: vouchersRes.count || 0,
        montoVouchersHoy: vouchersDataRes.data?.reduce((sum, v) => sum + (v.monto || 0), 0) || 0
      };

      setStats(newStats);

      // Optimización: Usar los datos ya obtenidos para actividades recientes
      const activities: RecentActivity[] = [];
      
      // Agregar incidencias recientes (ya limitadas en la consulta)
      if (incidenciasRes.data) {
        incidenciasRes.data.forEach(inc => {
          activities.push({
            id: inc.id,
            tipo: 'Incidencia',
            descripcion: inc.tipo_incidencia,
            fecha: inc.fecha,
            hora: inc.hora,
            estado: inc.estado,
            sector: `Sector ${inc.sector_id}`
          });
        });
      }

      // Agregar patrullajes recientes (ya limitados en la consulta)
      if (patrullajesRes.data) {
        patrullajesRes.data.slice(0, 2).forEach(pat => {
          activities.push({
            id: pat.id,
            tipo: 'Patrullaje',
            descripcion: `Ruta: ${pat.ruta}`,
            fecha: today,
            hora: pat.hora_inicio,
            estado: pat.estado
          });
        });
      }

      setRecentActivities(activities.slice(0, 5));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { label: 'Asistencias', value: stats.asistenciasHoy, color: 'bg-blue-500' },
    { label: 'Patrullajes', value: stats.patrullajesHoy, color: 'bg-green-500' },
    { label: 'Incidencias', value: stats.incidenciasHoy, color: 'bg-red-500' },
    { label: 'Movilidades', value: stats.movilidadesHoy, color: 'bg-yellow-500' },
    { label: 'Vouchers', value: stats.vouchersHoy, color: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard SGSC</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaClock />
          Última actualización: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
      
      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard 
          title="Personal Activo" 
          value={stats.personalActivo} 
          icon={<FaUsers className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-r from-blue-600 to-blue-700"
          subtitle="Empleados registrados"
        />
        
        <DashboardCard 
          title="Asistencias Hoy" 
          value={stats.asistenciasHoy} 
          icon={<FaCheckCircle className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-r from-green-600 to-green-700"
          subtitle="Registros del día"
        />
        
        <DashboardCard 
          title="Patrullajes Hoy" 
          value={stats.patrullajesHoy} 
          icon={<FaClipboardList className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-r from-indigo-600 to-indigo-700"
          subtitle="Rutas completadas"
        />
        
        <DashboardCard 
          title="Incidencias Hoy" 
          value={stats.incidenciasHoy} 
          icon={<FaExclamationTriangle className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-r from-red-600 to-red-700"
          subtitle="Eventos reportados"
        />
      </div>

      {/* Segunda fila de tarjetas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard 
          title="Movilidades Hoy" 
          value={stats.movilidadesHoy} 
          icon={<FaCarAlt className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-r from-yellow-600 to-yellow-700"
          subtitle="Vehículos en uso"
        />
        
        <DashboardCard 
          title="Cabinas Operativas" 
          value={stats.cabinasOperativas} 
          icon={<FaVideo className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-r from-purple-600 to-purple-700"
          subtitle="Sistemas funcionando"
        />
        
        <DashboardCard 
          title="Vouchers Hoy" 
          value={`${stats.vouchersHoy} / S/ ${stats.montoVouchersHoy.toLocaleString()}`} 
          icon={<FaMoneyBillWave className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-r from-teal-600 to-teal-700"
          subtitle="Gastos del día"
        />
      </div>
      
      {/* Gráficos y actividades */}
      <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-2">
        <SimpleChart 
          data={chartData}
          title="Actividades del Día"
        />
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" />
            Actividades Recientes
          </h2>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay actividades recientes</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.tipo === 'Incidencia' ? 'bg-red-100 text-red-800' :
                        activity.tipo === 'Patrullaje' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.tipo}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {activity.descripcion}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {activity.fecha} - {activity.hora}
                      {activity.sector && ` • ${activity.sector}`}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    activity.estado === 'completado' || activity.estado === 'resuelto' ? 'bg-green-100 text-green-800' :
                    activity.estado === 'en_progreso' || activity.estado === 'activo' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Resumen de estado del sistema */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FaEye className="text-blue-500" />
          Estado del Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.personalActivo}</div>
            <div className="text-sm text-gray-600">Personal Disponible</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.cabinasOperativas}</div>
            <div className="text-sm text-gray-600">Cabinas Activas</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {stats.asistenciasHoy + stats.patrullajesHoy + stats.movilidadesHoy}
            </div>
            <div className="text-sm text-gray-600">Actividades Totales</div>
          </div>
        </div>
      </div>
    </div>
  );
}