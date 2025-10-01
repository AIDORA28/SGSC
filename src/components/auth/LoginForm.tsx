'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Redirigir según el rol del usuario
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-center text-blue-800">
        Iniciar Sesión - SGSC
      </h1>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}