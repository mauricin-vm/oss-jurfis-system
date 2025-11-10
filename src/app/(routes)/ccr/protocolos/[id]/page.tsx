'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtocolForm } from '../components/protocol-form';
import { Loader2 } from 'lucide-react';

interface Protocol {
  id: string;
  number: string;
  originationDate: Date;
  receptionDate: Date;
  subject: string;
  status: string;
  sectorId: string | null;
  admissibilityStatus: string | null;
  admissibilityDate: Date | null;
  admissibilityRemarks: string | null;
  isActive: boolean;
  protocolParts: Array<{
    partId: string;
    role: string;
    part: {
      id: string;
      name: string;
    };
  }>;
  resource?: any;
}

export default function EditarProtocoloPage() {
  const params = useParams();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProtocol();
    }
  }, [params.id]);

  const fetchProtocol = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/protocols/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProtocol(data);
      }
    } catch (error) {
      console.error('Error fetching protocol:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Editar Protocolo</h2>
        </div>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Editar Protocolo</h2>
        </div>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Protocolo não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Editar Protocolo</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Protocolo {protocol.number}</CardTitle>
          <CardDescription>
            Atualize as informações do protocolo
            {protocol.resource && ' (Convertido em recurso - visualização apenas)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProtocolForm initialData={protocol} />
        </CardContent>
      </Card>
    </div>
  );
}
