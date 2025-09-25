'use client';

import { FaUsers, FaCarAlt, FaClipboardList, FaExclamationTriangle, FaVideo } from 'react-icons/fa';
import { useState, useEffect } from 'react';

// Componente de tarjeta para el dashboard
const DashboardCard = ({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
}) => (
  <div className={`p-6 rounded-lg shadow-md ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-100 uppercase">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
      <div className="p-3 bg-white bg-opacity-30 rounded-full">
        {icon}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  // En un sistema real, estos datos vendrían de la base de datos
  const [stats, setStats] = useState({
    personalActivo: 24,
    patrullajesHoy: 12,
    incidenciasHoy: 5,
    movilidadesActivas: 8,
    cabinasActivas: 4
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard 
          title="Personal Activo" 
          value={stats.personalActivo} 
          icon={<FaUsers className="w-6 h-6 text-white" />} 
          color="bg-blue-600"
        />
        
        <DashboardCard 
          title="Patrullajes Hoy" 
          value={stats.patrullajesHoy} 
          icon={<FaClipboardList className="w-6 h-6 text-white" />} 
          color="bg-green-600"
        />
        
        <DashboardCard 
          title="Incidencias Hoy" 
          value={stats.incidenciasHoy} 
          icon={<FaExclamationTriangle className="w-6 h-6 text-white" />} 
          color="bg-red-600"
        />
        
        <DashboardCard 
          title="Movilidades Activas" 
          value={stats.movilidadesActivas} 
          icon={<FaCarAlt className="w-6 h-6 text-white" />} 
          color="bg-yellow-600"
        />
        
        <DashboardCard 
          title="Cabinas Activas" 
          value={stats.cabinasActivas} 
          icon={<FaVideo className="w-6 h-6 text-white" />} 
          color="bg-purple-600"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Incidencias Recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Sector</th>
                  <th className="px-6 py-3">Hora</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b">
                  <td className="px-6 py-4">Robo</td>
                  <td className="px-6 py-4">Sector 1</td>
                  <td className="px-6 py-4">10:30</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 text-xs text-white bg-yellow-500 rounded-full">Pendiente</span></td>
                </tr>
                <tr className="bg-white border-b">
                  <td className="px-6 py-4">Accidente</td>
                  <td className="px-6 py-4">Sector 2</td>
                  <td className="px-6 py-4">12:15</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">Resuelto</span></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Disturbio</td>
                  <td className="px-6 py-4">Sector 3</td>
                  <td className="px-6 py-4">14:45</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 text-xs text-white bg-blue-500 rounded-full">Derivado PNP</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Personal en Turno</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Cargo</th>
                  <th className="px-6 py-3">Sector</th>
                  <th className="px-6 py-3">Turno</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b">
                  <td className="px-6 py-4">Juan Pérez</td>
                  <td className="px-6 py-4">Sereno</td>
                  <td className="px-6 py-4">Sector 1</td>
                  <td className="px-6 py-4">Mañana</td>
                </tr>
                <tr className="bg-white border-b">
                  <td className="px-6 py-4">María López</td>
                  <td className="px-6 py-4">Supervisor</td>
                  <td className="px-6 py-4">Sector 2</td>
                  <td className="px-6 py-4">Mañana</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Carlos Gómez</td>
                  <td className="px-6 py-4">Chofer</td>
                  <td className="px-6 py-4">Sector 3</td>
                  <td className="px-6 py-4">Mañana</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}