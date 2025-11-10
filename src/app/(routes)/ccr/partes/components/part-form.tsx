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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  role: z.string().min(1, 'Tipo de parte é obrigatório'),
  cpfCnpj: z.string().optional(),
  isActive: z.boolean(),
});

type PartFormValues = z.infer<typeof formSchema>;

interface PartFormProps {
  initialData?: Partial<PartFormValues> & { id?: string };
}

const roleOptions = [
  { value: 'SUJEITO_PASSIVO', label: 'Sujeito Passivo' },
  { value: 'CONTRIBUINTE', label: 'Contribuinte' },
  { value: 'RESPONSAVEL', label: 'Responsável' },
  { value: 'PROCURADOR', label: 'Procurador' },
  { value: 'ADVOGADO', label: 'Advogado' },
  { value: 'OUTROS', label: 'Outros' },
];

export function PartForm({ initialData }: PartFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<PartFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      role: initialData?.role || '',
      cpfCnpj: initialData?.cpfCnpj || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = async (data: PartFormValues) => {
    try {
      setLoading(true);

      const url = initialData?.id
        ? `/api/ccr/parts/${initialData.id}`
        : '/api/ccr/parts';

      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          cpfCnpj: data.cpfCnpj || null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success(initialData?.id ? 'Parte atualizada' : 'Parte criada');
      router.push('/ccr/partes');
      router.refresh();
    } catch (error) {
      console.error('Error saving part:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar parte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Parte *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de parte" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Tipo de envolvimento da parte no processo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cpfCnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF/CNPJ</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 123.456.789-00 ou 12.345.678/0001-00" {...field} />
              </FormControl>
              <FormDescription>
                Documento de identificação da parte (opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Parte Ativa</FormLabel>
                  <FormDescription>
                    Desmarque para desativar esta parte
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/ccr/partes')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? 'Atualizar' : 'Criar'} Parte
          </Button>
        </div>
      </form>
    </Form>
  );
}
