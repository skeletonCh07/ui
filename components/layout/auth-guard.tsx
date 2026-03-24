'use client';

import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { usuario, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !usuario) {
      router.push('/login');
    }
  }, [usuario, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return <>{children}</>;
}
