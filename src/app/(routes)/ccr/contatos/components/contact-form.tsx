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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  partId: z.string().min(1, 'Parte é obrigatória'),
  type: z.string().min(1, 'Tipo de contato é obrigatório'),
  value: z.string().min(1, 'Valor é obrigatório'),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
});

type ContactFormValues = z.infer<typeof formSchema>;

interface Part {
  id: string;
  name: string;
  role: string;
}

interface ContactFormProps {
  initialData?: Partial<ContactFormValues> & { id?: string };
}

const contactTypeOptions = [
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'TELEFONE', label: 'Telefone' },
  { value: 'CELULAR', label: 'Celular' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'ENDERECO', label: 'Endereço' },
];

export function ContactForm({ initialData }: ContactFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [loadingParts, setLoadingParts] = useState(true);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partId: initialData?.partId || '',
      type: initialData?.type || '',
      value: initialData?.value || '',
      isPrimary: initialData?.isPrimary ?? false,
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      setLoadingParts(true);
      const response = await fetch('/api/ccr/parts?isActive=true');
      if (response.ok) {
        const data = await response.json();
        setParts(data);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoadingParts(false);
    }
  };

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setLoading(true);

      const url = initialData?.id
        ? `/api/ccr/contacts/${initialData.id}`
        : '/api/ccr/contacts';

      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success(initialData?.id ? 'Contato atualizado' : 'Contato criado');
      router.push('/ccr/contatos');
      router.refresh();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar contato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="partId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parte *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loadingParts}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a parte" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {parts.map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Pessoa ou empresa relacionada a este contato
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Contato *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contactTypeOptions.map((option) => (
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

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: contato@email.com, (81) 99999-9999, Rua exemplo, 123"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                O valor do contato (e-mail, telefone, endereço, etc.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrimary"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Contato Primário</FormLabel>
                <FormDescription>
                  Marque se este é o contato principal da parte
                </FormDescription>
              </div>
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
                  <FormLabel>Contato Ativo</FormLabel>
                  <FormDescription>
                    Desmarque para desativar este contato
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
            onClick={() => router.push('/ccr/contatos')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? 'Atualizar' : 'Criar'} Contato
          </Button>
        </div>
      </form>
    </Form>
  );
}
