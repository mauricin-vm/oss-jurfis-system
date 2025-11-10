'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  sessionNumber: z.string().min(1, 'Número da sessão é obrigatório'),
  sessionDate: z.string().min(1, 'Data da sessão é obrigatória'),
  type: z.string().min(1, 'Tipo de sessão é obrigatório'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  agenda: z.string().optional(),
  observations: z.string().optional(),
  status: z.string().optional(),
});

type SessionFormValues = z.infer<typeof formSchema>;

interface SessionFormProps {
  initialData?: any;
}

const typeOptions = [
  { value: 'ORDINARIA', label: 'Ordinária' },
  { value: 'EXTRAORDINARIA', label: 'Extraordinária' },
  { value: 'SOLENE', label: 'Solene' },
];

const statusOptions = [
  { value: 'AGENDADA', label: 'Agendada' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export function SessionForm({ initialData }: SessionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessionNumber: initialData?.sessionNumber?.toString() || '',
      sessionDate: initialData?.sessionDate
        ? new Date(initialData.sessionDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      type: initialData?.type || '',
      startTime: initialData?.startTime || '',
      endTime: initialData?.endTime || '',
      location: initialData?.location || '',
      agenda: initialData?.agenda || '',
      observations: initialData?.observations || '',
      status: initialData?.status || 'AGENDADA',
    },
  });

  const onSubmit = async (data: SessionFormValues) => {
    try {
      setLoading(true);

      const url = initialData?.id
        ? `/api/ccr/sessions/${initialData.id}`
        : '/api/ccr/sessions';

      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sessionNumber: parseInt(data.sessionNumber),
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          location: data.location || null,
          agenda: data.agenda || null,
          observations: data.observations || null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success(initialData?.id ? 'Sessão atualizada' : 'Sessão criada');
      router.push('/ccr/sessoes');
      router.refresh();
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar sessão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="sessionNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da Sessão *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} />
                </FormControl>
                <FormDescription>
                  Número sequencial da sessão no ano
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sessionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Sessão *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Sessão *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {typeOptions.map((option) => (
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

          {initialData?.id && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário de Início</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário de Término</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Sala de Reuniões" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="agenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pauta</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva a pauta da sessão"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Principais assuntos a serem tratados na sessão
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações gerais sobre a sessão"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/ccr/sessoes')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? 'Atualizar' : 'Criar'} Sessão
          </Button>
        </div>
      </form>
    </Form>
  );
}
