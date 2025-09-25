import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-blue-800 to-blue-600">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-lg">
        <h1 className="mb-6 text-4xl font-bold text-center text-blue-800">
          Sistema de Gestión de Seguridad Ciudadana
        </h1>
        <h2 className="mb-8 text-xl text-center text-gray-600">
          Sub Gerencia de Seguridad Ciudadana de Asia (Cañete, Lima, Perú)
        </h2>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href="/login" 
                className="flex items-center justify-center p-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Iniciar Sesión
          </Link>
          
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="mb-2 text-lg font-semibold">Información del Sistema</h3>
            <p className="text-gray-700">
              Sistema centralizado para la gestión de seguridad ciudadana, incluyendo:
            </p>
            <ul className="pl-5 mt-2 list-disc text-gray-700">
              <li>Gestión de personal y turnos</li>
              <li>Registro de incidencias</li>
              <li>Control de patrullaje</li>
              <li>Monitoreo de cabinas y cámaras</li>
              <li>Gestión de movilidades</li>
              <li>Reportes y estadísticas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
