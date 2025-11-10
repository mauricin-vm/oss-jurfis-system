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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  fiscalYear: z.string().min(1, 'Ano fiscal é obrigatório'),
  taxType: z.string().optional(),
  taxValue: z.string().optional(),
  penalty: z.string().optional(),
  interest: z.string().optional(),
  totalValue: z.string().optional(),
  status: z.string().min(1, 'Status é obrigatório'),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type ResourceFormValues = z.infer<typeof formSchema>;

interface Subject {
  id: string;
  name: string;
}

interface ResourceFormProps {
  initialData?: any;
}

const statusOptions = [
  { value: 'AGUARDANDO_ANALISE', label: 'Aguardando Análise' },
  { value: 'EM_ANALISE', label: 'Em Análise' },
  { value: 'AGUARDANDO_SESSAO', label: 'Aguardando Sessão' },
  { value: 'EM_SESSAO', label: 'Em Sessão' },
  { value: 'JULGADO_PROCEDENTE', label: 'Julgado Procedente' },
  { value: 'JULGADO_IMPROCEDENTE', label: 'Julgado Improcedente' },
  { value: 'JULGADO_PARCIALMENTE', label: 'Julgado Parcialmente' },
  { value: 'ARQUIVADO', label: 'Arquivado' },
];

export function ResourceForm({ initialData }: ResourceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fiscalYear: initialData?.fiscalYear?.toString() || new Date().getFullYear().toString(),
      taxType: initialData?.taxType || '',
      taxValue: initialData?.taxValue?.toString() || '',
      penalty: initialData?.penalty?.toString() || '',
      interest: initialData?.interest?.toString() || '',
      totalValue: initialData?.totalValue?.toString() || '',
      status: initialData?.status || 'AGUARDANDO_ANALISE',
      description: initialData?.description || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    fetchSubjects();
    if (initialData?.subjects) {
      setSelectedSubjects(initialData.subjects.map((s: any) => s.subjectId));
    }
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await fetch('/api/ccr/subjects?isActive=true');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const onSubmit = async (data: ResourceFormValues) => {
    try {
      setLoading(true);

      const url = `/api/ccr/resources/${initialData.id}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          fiscalYear: parseInt(data.fiscalYear),
          taxValue: data.taxValue ? parseFloat(data.taxValue) : null,
          penalty: data.penalty ? parseFloat(data.penalty) : null,
          interest: data.interest ? parseFloat(data.interest) : null,
          totalValue: data.totalValue ? parseFloat(data.totalValue) : null,
          taxType: data.taxType || null,
          description: data.description || null,
          subjectIds: selectedSubjects.length > 0 ? selectedSubjects : null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success('Recurso atualizado');
      router.push('/ccr/recursos');
      router.refresh();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar recurso');
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
            name="fiscalYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano Fiscal *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="taxType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Tributo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: IPTU, ISS, ITBI" {...field} />
              </FormControl>
              <FormDescription>
                Tipo de tributo objeto do recurso
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="taxValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Tributo</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="penalty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Multa</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interest"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Juros</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="totalValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Total</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>
                Valor total do débito (tributo + multa + juros)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição/Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o recurso"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Assuntos</FormLabel>
          <FormDescription>
            Selecione os assuntos relacionados a este recurso
          </FormDescription>
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-4 max-h-[200px] overflow-y-auto">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center space-x-2">
                <Checkbox
                  id={subject.id}
                  checked={selectedSubjects.includes(subject.id)}
                  onCheckedChange={() => toggleSubject(subject.id)}
                />
                <label
                  htmlFor={subject.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {subject.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Recurso Ativo</FormLabel>
                <FormDescription>
                  Desmarque para desativar este recurso
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/ccr/recursos')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atualizar Recurso
          </Button>
        </div>
      </form>
    </Form>
  );
}
