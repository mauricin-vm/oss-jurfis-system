'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  originationDate: z.string().min(1, 'Data de origem é obrigatória'),
  receptionDate: z.string().min(1, 'Data de recepção é obrigatória'),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  sectorId: z.string().optional(),
  status: z.string().optional(),
  admissibilityStatus: z.string().optional(),
  admissibilityDate: z.string().optional(),
  admissibilityRemarks: z.string().optional(),
  isActive: z.boolean(),
});

type ProtocolFormValues = z.infer<typeof formSchema>;

interface Part {
  id: string;
  name: string;
  role: string;
}

interface Sector {
  id: string;
  name: string;
}

interface ProtocolPart {
  partId: string;
  role: string;
}

interface ProtocolFormProps {
  initialData?: any;
}

const roleOptions = [
  { value: 'SUJEITO_PASSIVO', label: 'Sujeito Passivo' },
  { value: 'CONTRIBUINTE', label: 'Contribuinte' },
  { value: 'RESPONSAVEL', label: 'Responsável' },
  { value: 'PROCURADOR', label: 'Procurador' },
  { value: 'ADVOGADO', label: 'Advogado' },
  { value: 'OUTROS', label: 'Outros' },
];

const statusOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_ANALISE', label: 'Em Análise' },
  { value: 'ADMITIDO', label: 'Admitido' },
  { value: 'NAO_ADMITIDO', label: 'Não Admitido' },
  { value: 'CONVERTIDO_RECURSO', label: 'Convertido em Recurso' },
];

export function ProtocolForm({ initialData }: ProtocolFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [protocolParts, setProtocolParts] = useState<ProtocolPart[]>([]);

  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originationDate: initialData?.originationDate
        ? new Date(initialData.originationDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      receptionDate: initialData?.receptionDate
        ? new Date(initialData.receptionDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      subject: initialData?.subject || '',
      sectorId: initialData?.sectorId || '',
      status: initialData?.status || 'PENDENTE',
      admissibilityStatus: initialData?.admissibilityStatus || '',
      admissibilityDate: initialData?.admissibilityDate
        ? new Date(initialData.admissibilityDate).toISOString().split('T')[0]
        : '',
      admissibilityRemarks: initialData?.admissibilityRemarks || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    fetchData();
    if (initialData?.protocolParts) {
      setProtocolParts(
        initialData.protocolParts.map((pp: any) => ({
          partId: pp.partId,
          role: pp.role,
        }))
      );
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [partsRes, sectorsRes] = await Promise.all([
        fetch('/api/ccr/parts?isActive=true'),
        fetch('/api/ccr/sectors?isActive=true'),
      ]);

      if (partsRes.ok) {
        const partsData = await partsRes.json();
        setParts(partsData);
      }

      if (sectorsRes.ok) {
        const sectorsData = await sectorsRes.json();
        setSectors(sectorsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const addProtocolPart = () => {
    setProtocolParts([...protocolParts, { partId: '', role: '' }]);
  };

  const removeProtocolPart = (index: number) => {
    setProtocolParts(protocolParts.filter((_, i) => i !== index));
  };

  const updateProtocolPart = (index: number, field: 'partId' | 'role', value: string) => {
    const updated = [...protocolParts];
    updated[index][field] = value;
    setProtocolParts(updated);
  };

  const onSubmit = async (data: ProtocolFormValues) => {
    try {
      if (protocolParts.length === 0) {
        toast.error('É necessário adicionar pelo menos uma parte');
        return;
      }

      // Validar se todas as partes foram preenchidas
      const invalidPart = protocolParts.find((pp) => !pp.partId || !pp.role);
      if (invalidPart) {
        toast.error('Todas as partes devem ter uma pessoa/empresa e um tipo selecionados');
        return;
      }

      setLoading(true);

      const url = initialData?.id
        ? `/api/ccr/protocols/${initialData.id}`
        : '/api/ccr/protocols';

      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sectorId: data.sectorId || null,
          admissibilityStatus: data.admissibilityStatus || null,
          admissibilityDate: data.admissibilityDate || null,
          admissibilityRemarks: data.admissibilityRemarks || null,
          protocolParts,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success(initialData?.id ? 'Protocolo atualizado' : 'Protocolo criado');
      router.push('/ccr/protocolos');
      router.refresh();
    } catch (error) {
      console.error('Error saving protocol:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar protocolo');
    } finally {
      setLoading(false);
    }
  };

  const isConverted = initialData?.resource;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isConverted && (
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4">
            <p className="text-sm font-medium text-yellow-800">
              Este protocolo foi convertido em recurso e não pode mais ser editado.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="originationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Origem *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isConverted} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="receptionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Recepção *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isConverted} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assunto *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o assunto do protocolo"
                  rows={3}
                  {...field}
                  disabled={isConverted}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sectorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setor</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loadingData || isConverted}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Setor responsável pelo protocolo</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData?.id && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isConverted}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Partes Envolvidas</CardTitle>
            <CardDescription>
              Adicione as pessoas ou empresas envolvidas neste protocolo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {protocolParts.map((protocolPart, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-1">
                  <Select
                    value={protocolPart.partId}
                    onValueChange={(value) => updateProtocolPart(index, 'partId', value)}
                    disabled={isConverted}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a parte" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select
                    value={protocolPart.role}
                    onValueChange={(value) => updateProtocolPart(index, 'role', value)}
                    disabled={isConverted}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!isConverted && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeProtocolPart(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {!isConverted && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProtocolPart}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Parte
              </Button>
            )}
          </CardContent>
        </Card>

        {initialData?.id && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isConverted}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Protocolo Ativo</FormLabel>
                  <FormDescription>
                    Desmarque para desativar este protocolo
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        {!isConverted && (
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/ccr/protocolos')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData?.id ? 'Atualizar' : 'Criar'} Protocolo
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
