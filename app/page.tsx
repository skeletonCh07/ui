'use client';

import { useEffect, useState } from 'react';

interface Mass {
  date: string;
  time: string;
  locale?: string;
}

const IconChurch = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const IconClock = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCalendar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconLocation = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function Home() {
  const [masses, setMasses] = useState<Mass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMasses = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        const response = await fetch(
          `http://calapi.inadiutorium.cz/api/v0/pt/calendars/default/${year}/${month}`
        );
        
        if (!response.ok) {
          throw new Error('Erro ao buscar dados da API');
        }
        
        const data = await response.json();
        
        // Extrair dados de missas (simplificado)
        const massasExtraidas: Mass[] = [];
        
        if (data.days && Array.isArray(data.days)) {
          data.days.forEach((day: any) => {
            if (day.celebrations && day.celebrations.length > 0) {
              massasExtraidas.push({
                date: day.date,
                time: '09:00',
                locale: day.celebrations[0].title || 'Missa'
              });
            }
          });
        }
        
        setMasses(massasExtraidas.slice(0, 10));
        setError(null);
      } catch (err) {
        setError('Erro ao carregar as missas. Tente novamente mais tarde.');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMasses();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white">
                <IconChurch />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                Missas
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Calendário de Missas
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 text-balance">
            Próximas Celebrações
          </h2>
          <p className="text-lg text-gray-600">
            Acompanhe as missas e eventos da nossa comunidade
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Masses Grid */}
        {!loading && !error && masses.length > 0 && (
          <div className="grid gap-4 md:gap-6">
            {masses.map((mass, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-xl border border-gray-200 hover:border-purple-300 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-purple-100 overflow-hidden"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  {/* Left Section - Date */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 flex-shrink-0">
                      <IconCalendar />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
                          {new Date(mass.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 capitalize">
                        {formatDate(mass.date)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {mass.locale || 'Celebração'}
                      </p>
                    </div>
                  </div>

                  {/* Right Section - Time */}
                  <div className="flex items-center gap-3 sm:border-l sm:border-gray-200 sm:pl-6">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <IconClock />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold">
                        Horário
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {mass.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && masses.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <IconLocation />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma missa encontrada
            </h3>
            <p className="text-gray-600">
              Tente novamente mais tarde
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-600">
            © 2024 Calendário de Missas. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
