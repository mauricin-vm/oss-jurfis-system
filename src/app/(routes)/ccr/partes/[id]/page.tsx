'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PartForm } from '../components/part-form';
import { Loader2 } from 'lucide-react';

interface Part {
  id: string;
  name: string;
  role: string;
  cpfCnpj: string | null;
  isActive: boolean;
}

export default function EditarPartePage() {
  const params = useParams();
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPart();
    }
  }, [params.id]);

  const fetchPart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/parts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPart(data);
      }
    } catch (error) {
      console.error('Error fetching part:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Editar Parte</h2>
        </div>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Editar Parte</h2>
        </div>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Parte não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Editar Parte</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Parte</CardTitle>
          <CardDescription>
            Atualize as informações de {part.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartForm initialData={{
            ...part,
            cpfCnpj: part.cpfCnpj ?? undefined,
          }} />
        </CardContent>
      </Card>
    </div>
  );
}
