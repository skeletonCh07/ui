import { Sidebar } from './sidebar';
import { AuthGuard } from './auth-guard';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
