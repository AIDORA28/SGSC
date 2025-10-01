'use client';

import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

// Interface para definir el tipo de personal
interface Personal {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  estado: string;
  sector: string;
  turno: string;
}

// Datos de ejemplo para personal
const personalData: Personal[] = [
  { id: '1', dni: '12345678', nombres: 'Juan', apellidos: 'Pérez', cargo: 'Sereno', estado: 'Activo', sector: 'Sector 1', turno: 'Mañana' },
  { id: '2', dni: '87654321', nombres: 'María', apellidos: 'López', cargo: 'Supervisor', estado: 'Activo', sector: 'Sector 2', turno: 'Tarde' },
  { id: '3', dni: '23456789', nombres: 'Carlos', apellidos: 'Gómez', cargo: 'Chofer', estado: 'Activo', sector: 'Sector 3', turno: 'Noche' },
  { id: '4', dni: '34567890', nombres: 'Ana', apellidos: 'Martínez', cargo: 'Cámara', estado: 'Inactivo', sector: 'Sector 1', turno: 'Mañana' },
];

export default function Personal() {
  const [personal, setPersonal] = useState(personalData);
  const [showModal, setShowModal] = useState(false);
  const [currentPersonal, setCurrentPersonal] = useState<Personal | null>(null);

  const handleEdit = (id: string) => {
    const personalToEdit = personal.find(p => p.id === id);
    setCurrentPersonal(personalToEdit || null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro?')) {
      setPersonal(personal.filter(p => p.id !== id));
    }
  };

  const handleAdd = () => {
    setCurrentPersonal(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Personal</h1>
        <button 
          onClick={handleAdd}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" /> Agregar Personal
        </button>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">DNI</th>
                <th className="px-6 py-3">Nombres</th>
                <th className="px-6 py-3">Apellidos</th>
                <th className="px-6 py-3">Cargo</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Sector</th>
                <th className="px-6 py-3">Turno</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personal.map((person) => (
                <tr key={person.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{person.dni}</td>
                  <td className="px-6 py-4">{person.nombres}</td>
                  <td className="px-6 py-4">{person.apellidos}</td>
                  <td className="px-6 py-4">{person.cargo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs text-white rounded-full ${
                      person.estado === 'Activo' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {person.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">{person.sector}</td>
                  <td className="px-6 py-4">{person.turno}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(person.id)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(person.id)}
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
      
      {/* Modal para agregar/editar personal (simplificado) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-semibold">
              {currentPersonal ? 'Editar Personal' : 'Agregar Personal'}
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">DNI</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  defaultValue={currentPersonal?.dni || ''}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Nombres</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    defaultValue={currentPersonal?.nombres || ''}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Apellidos</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    defaultValue={currentPersonal?.apellidos || ''}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Cargo</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Seleccionar</option>
                    <option value="Sereno" selected={currentPersonal?.cargo === 'Sereno'}>Sereno</option>
                    <option value="Supervisor" selected={currentPersonal?.cargo === 'Supervisor'}>Supervisor</option>
                    <option value="Chofer" selected={currentPersonal?.cargo === 'Chofer'}>Chofer</option>
                    <option value="Cámara" selected={currentPersonal?.cargo === 'Cámara'}>Cámara</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Estado</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="Activo" selected={currentPersonal?.estado === 'Activo'}>Activo</option>
                    <option value="Inactivo" selected={currentPersonal?.estado === 'Inactivo'}>Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Sector</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Seleccionar</option>
                    <option value="Sector 1" selected={currentPersonal?.sector === 'Sector 1'}>Sector 1</option>
                    <option value="Sector 2" selected={currentPersonal?.sector === 'Sector 2'}>Sector 2</option>
                    <option value="Sector 3" selected={currentPersonal?.sector === 'Sector 3'}>Sector 3</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Turno</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Seleccionar</option>
                    <option value="Mañana" selected={currentPersonal?.turno === 'Mañana'}>Mañana</option>
                    <option value="Tarde" selected={currentPersonal?.turno === 'Tarde'}>Tarde</option>
                    <option value="Noche" selected={currentPersonal?.turno === 'Noche'}>Noche</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}