'use client';

import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<'admin' | 'obseciu' | 'coe' | 'supervisor' | 'camaras'>('admin');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        router.push('/login');
        return;
      }
      
      // En un sistema real, aquí obtendrías el rol del usuario desde la base de datos
      // Por ahora, usamos 'admin' como valor predeterminado
      setLoading(false);
    };
    
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar role={role} />
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>
    </div>
  );
}