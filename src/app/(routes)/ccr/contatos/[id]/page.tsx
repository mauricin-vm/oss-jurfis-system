'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '../components/contact-form';
import { Loader2 } from 'lucide-react';

interface Contact {
  id: string;
  partId: string;
  type: string;
  value: string;
  isPrimary: boolean;
  isActive: boolean;
  part: {
    id: string;
    name: string;
  };
}

export default function EditarContatoPage() {
  const params = useParams();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchContact();
    }
  }, [params.id]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/contacts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setContact(data);
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Editar Contato</h2>
        </div>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Editar Contato</h2>
        </div>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Contato não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Editar Contato</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Contato</CardTitle>
          <CardDescription>
            Atualize as informações do contato de {contact.part.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm initialData={contact} />
        </CardContent>
      </Card>
    </div>
  );
}
