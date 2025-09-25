'use client';

import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';

// Datos de ejemplo para incidencias
const incidenciasData = [
  { id: '1', fecha: '2023-07-15', hora: '10:30', tipo: 'Robo', sector: 'Sector 1', anexo: 'Las Viñas', reportadoPor: 'COE', estado: 'Pendiente', descripcion: 'Robo de celular en vía pública' },
  { id: '2', fecha: '2023-07-15', hora: '12:15', tipo: 'Accidente', sector: 'Sector 2', anexo: 'Rosario de Asia', reportadoPor: 'Serenazgo a pie', estado: 'Resuelto', descripcion: 'Accidente de tránsito sin heridos' },
  { id: '3', fecha: '2023-07-15', hora: '14:45', tipo: 'Disturbio', sector: 'Sector 3', anexo: 'Capilla de Asia', reportadoPor: 'Operador de móvil', estado: 'Derivado PNP', descripcion: 'Pelea en vía pública' },
];

export default function Incidencias() {
  const [incidencias, setIncidencias] = useState(incidenciasData);
  const [showModal, setShowModal] = useState(false);
  const [currentIncidencia, setCurrentIncidencia] = useState<any>(null);
  const [viewMode, setViewMode] = useState(false);

  const handleEdit = (id: string) => {
    const incidenciaToEdit = incidencias.find(i => i.id === id);
    setCurrentIncidencia(incidenciaToEdit);
    setViewMode(false);
    setShowModal(true);
  };

  const handleView = (id: string) => {
    const incidenciaToView = incidencias.find(i => i.id === id);
    setCurrentIncidencia(incidenciaToView);
    setViewMode(true);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro?')) {
      setIncidencias(incidencias.filter(i => i.id !== id));
    }
  };

  const handleAdd = () => {
    setCurrentIncidencia(null);
    setViewMode(false);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Registro de Incidencias</h1>
        <button 
          onClick={handleAdd}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" /> Nueva Incidencia
        </button>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Hora</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Sector</th>
                <th className="px-6 py-3">Reportado Por</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {incidencias.map((incidencia) => (
                <tr key={incidencia.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{incidencia.fecha}</td>
                  <td className="px-6 py-4">{incidencia.hora}</td>
                  <td className="px-6 py-4">{incidencia.tipo}</td>
                  <td className="px-6 py-4">{incidencia.sector}</td>
                  <td className="px-6 py-4">{incidencia.reportadoPor}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs text-white rounded-full ${
                      incidencia.estado === 'Pendiente' ? 'bg-yellow-500' : 
                      incidencia.estado === 'Resuelto' ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {incidencia.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleView(incidencia.id)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <FaEye />
                      </button>
                      <button 
                        onClick={() => handleEdit(incidencia.id)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(incidencia.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal para agregar/editar/ver incidencias */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-semibold">
              {viewMode ? 'Ver Incidencia' : currentIncidencia ? 'Editar Incidencia' : 'Nueva Incidencia'}
            </h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    defaultValue={currentIncidencia?.fecha || ''}
                    disabled={viewMode}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Hora</label>
                  <input 
                    type="time" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    defaultValue={currentIncidencia?.hora || ''}
                    disabled={viewMode}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Tipo de Incidencia</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={viewMode}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Robo" selected={currentIncidencia?.tipo === 'Robo'}>Robo</option>
                    <option value="Hurto" selected={currentIncidencia?.tipo === 'Hurto'}>Hurto</option>
                    <option value="Accidente" selected={currentIncidencia?.tipo === 'Accidente'}>Accidente</option>
                    <option value="Disturbio" selected={currentIncidencia?.tipo === 'Disturbio'}>Disturbio</option>
                    <option value="Violencia Familiar" selected={currentIncidencia?.tipo === 'Violencia Familiar'}>Violencia Familiar</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Estado</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={viewMode}
                  >
                    <option value="Pendiente" selected={currentIncidencia?.estado === 'Pendiente'}>Pendiente</option>
                    <option value="Resuelto" selected={currentIncidencia?.estado === 'Resuelto'}>Resuelto</option>
                    <option value="Derivado PNP" selected={currentIncidencia?.estado === 'Derivado PNP'}>Derivado PNP</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Sector</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={viewMode}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Sector 1" selected={currentIncidencia?.sector === 'Sector 1'}>Sector 1</option>
                    <option value="Sector 2" selected={currentIncidencia?.sector === 'Sector 2'}>Sector 2</option>
                    <option value="Sector 3" selected={currentIncidencia?.sector === 'Sector 3'}>Sector 3</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Anexo</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={viewMode}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Las Viñas" selected={currentIncidencia?.anexo === 'Las Viñas'}>Las Viñas</option>
                    <option value="Rosario de Asia" selected={currentIncidencia?.anexo === 'Rosario de Asia'}>Rosario de Asia</option>
                    <option value="Capilla de Asia" selected={currentIncidencia?.anexo === 'Capilla de Asia'}>Capilla de Asia</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Reportado Por</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={viewMode}
                >
                  <option value="">Seleccionar</option>
                  <option value="COE" selected={currentIncidencia?.reportadoPor === 'COE'}>COE</option>
                  <option value="Serenazgo a pie" selected={currentIncidencia?.reportadoPor === 'Serenazgo a pie'}>Serenazgo a pie</option>
                  <option value="Operador de móvil" selected={currentIncidencia?.reportadoPor === 'Operador de móvil'}>Operador de móvil</option>
                  <option value="Motorizado" selected={currentIncidencia?.reportadoPor === 'Motorizado'}>Motorizado</option>
                  <option value="Cámaras" selected={currentIncidencia?.reportadoPor === 'Cámaras'}>Cámaras</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Descripción</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  defaultValue={currentIncidencia?.descripcion || ''}
                  disabled={viewMode}
                ></textarea>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Adjuntar Parte de Ocurrencia (opcional)</label>
                <input 
                  type="file" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={viewMode}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  {viewMode ? 'Cerrar' : 'Cancelar'}
                </button>
                {!viewMode && (
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Guardar
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