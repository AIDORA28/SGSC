'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUsers, FaClipboardList, FaCarAlt, FaVideo, FaExclamationTriangle, FaUserShield, FaChartBar, FaSignOutAlt } from 'react-icons/fa';

type SidebarProps = {
  role: 'admin' | 'obseciu' | 'coe' | 'supervisor' | 'camaras';
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  
  // Definir los módulos disponibles según el rol
  const getModules = () => {
    const allModules = [
      { name: 'Dashboard', path: '/dashboard', icon: <FaChartBar className="w-5 h-5" /> },
      { name: 'Personal', path: '/personal', icon: <FaUsers className="w-5 h-5" /> },
      { name: 'Patrullaje', path: '/patrullaje', icon: <FaClipboardList className="w-5 h-5" /> },
      { name: 'Movilidades', path: '/movilidades', icon: <FaCarAlt className="w-5 h-5" /> },
      { name: 'Cabinas', path: '/cabinas', icon: <FaVideo className="w-5 h-5" /> },
      { name: 'Incidencias', path: '/incidencias', icon: <FaExclamationTriangle className="w-5 h-5" /> },
      { name: 'Supervisores', path: '/supervisores', icon: <FaUserShield className="w-5 h-5" /> },
    ];

    // Filtrar módulos según el rol
    switch (role) {
      case 'admin':
        return allModules;
      case 'obseciu':
        return allModules;
      case 'coe':
        return allModules.filter(m => 
          ['Dashboard', 'Incidencias', 'Patrullaje'].includes(m.name)
        );
      case 'supervisor':
        return allModules.filter(m => 
          ['Dashboard', 'Personal', 'Patrullaje', 'Supervisores'].includes(m.name)
        );
      case 'camaras':
        return allModules.filter(m => 
          ['Dashboard', 'Cabinas'].includes(m.name)
        );
      default:
        return [];
    }
  };

  const modules = getModules();

  return (
    <div className="flex flex-col h-full min-h-screen p-3 bg-blue-800 text-white w-64">
      <div className="p-4 text-xl font-bold text-center border-b border-blue-700">
        SGSC Asia
      </div>
      
      <nav className="flex-1 mt-6 space-y-2">
        {modules.map((module) => (
          <Link 
            key={module.path}
            href={module.path}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              pathname === module.path 
                ? 'bg-blue-700 text-white' 
                : 'text-blue-100 hover:bg-blue-700'
            }`}
          >
            {module.icon}
            <span className="ml-3">{module.name}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 mt-auto border-t border-blue-700">
        <button className="flex items-center w-full p-3 text-blue-100 rounded-lg hover:bg-blue-700 transition-colors">
          <FaSignOutAlt className="w-5 h-5" />
          <span className="ml-3">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}