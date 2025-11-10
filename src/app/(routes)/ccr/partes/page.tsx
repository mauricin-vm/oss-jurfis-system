'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PartTable } from './components/part-table';

interface Part {
  id: string;
  name: string;
  role: string;
  cpfCnpj: string | null;
  isActive: boolean;
  _count?: {
    contacts: number;
    protocolParts: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function PartesPage() {
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ccr/parts');
      if (response.ok) {
        const data = await response.json();
        setParts(data);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Partes</h2>
        <Button onClick={() => router.push('/ccr/partes/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Parte
        </Button>
      </div>

      <PartTable data={parts} loading={loading} onRefresh={fetchParts} />
    </div>
  );
}
