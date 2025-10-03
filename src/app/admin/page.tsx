'use client';

import { useState } from 'react';
import RegisterUserForm from '@/components/admin/RegisterUserForm';
import { FaUsers, FaUserPlus, FaCog, FaChartBar } from 'react-icons/fa';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('register');

  const tabs = [
    { id: 'register', label: 'Registrar Usuario', icon: FaUserPlus },
    { id: 'users', label: 'Gestionar Usuarios', icon: FaUsers },
    { id: 'settings', label: 'Configuración', icon: FaCog },
    { id: 'reports', label: 'Reportes', icon: FaChartBar }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-8">
          Panel de Administración - SGSC
        </h1>

        {/* Navegación por pestañas */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg shadow p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'register' && (
            <div className="p-6">
              <RegisterUserForm />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Gestión de Usuarios
              </h2>
              <p className="text-gray-600">
                Funcionalidad de gestión de usuarios en desarrollo...
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Configuración del Sistema
              </h2>
              <p className="text-gray-600">
                Configuraciones del sistema en desarrollo...
              </p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Reportes y Estadísticas
              </h2>
              <p className="text-gray-600">
                Reportes administrativos en desarrollo...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}