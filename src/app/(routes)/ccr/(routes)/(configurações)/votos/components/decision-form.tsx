'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type DecisionFormValues = {
  type: 'PRELIMINAR' | 'MERITO' | 'OFICIO';
  identifier: string;
  acceptText?: string; // Para PRELIMINAR
  rejectText?: string; // Para PRELIMINAR
  text?: string; // Para MERITO e OFICIO
  isActive: boolean;
};

interface DecisionFormProps {
  initialData?: Partial<DecisionFormValues> & { id?: string };
}

export function DecisionForm({ initialData }: DecisionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<DecisionFormValues>({
    defaultValues: {
      type: initialData?.type || 'PRELIMINAR',
      identifier: initialData?.identifier || '',
      acceptText: initialData?.acceptText || '',
      rejectText: initialData?.rejectText || '',
      text: initialData?.text || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const watchType = form.watch('type');

  const onSubmit = async (data: DecisionFormValues) => {
    try {
      // Validações
      if (!data.type) {
        toast.error('Tipo é obrigatório');
        return;
      }

      if (!data.identifier || data.identifier.trim() === '') {
        toast.error('Identificador é obrigatório');
        return;
      }

      // Validações específicas por tipo
      if (data.type === 'PRELIMINAR') {
        if (!data.acceptText || data.acceptText.trim() === '') {
          toast.error('Texto se acatar é obrigatório para decisões preliminares');
          return;
        }
        if (!data.rejectText || data.rejectText.trim() === '') {
          toast.error('Texto se afastar é obrigatório para decisões preliminares');
          return;
        }
      } else {
        // MERITO ou OFICIO
        if (!data.text || data.text.trim() === '') {
          toast.error(`Texto é obrigatório para decisões de ${data.type.toLowerCase()}`);
          return;
        }
      }

      setLoading(true);

      const url = initialData?.id
        ? `/api/ccr/vote-decisions/${initialData.id}`
        : '/api/ccr/vote-decisions';

      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          identifier: data.identifier.trim(),
          acceptText: data.acceptText ? data.acceptText.trim() : null,
          rejectText: data.rejectText ? data.rejectText.trim() : null,
          text: data.text ? data.text.trim() : null,
          isActive: data.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar voto');
        return;
      }

      toast.success(initialData?.id ? 'Voto atualizado com sucesso' : 'Voto criado com sucesso');
      router.push('/ccr/votos');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao salvar voto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="block text-sm font-medium mb-1.5">
                  Tipo <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!!initialData?.id}
                >
                  <FormControl>
                    <SelectTrigger className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-gray-400 transition-colors">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="PRELIMINAR">
                      Preliminar
                    </SelectItem>
                    <SelectItem value="MERITO">
                      Mérito
                    </SelectItem>
                    <SelectItem value="OFICIO">
                      Ofício
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="block text-sm font-medium mb-1.5">
                  Identificador <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      watchType === 'PRELIMINAR'
                        ? 'Ex: intempestividade, ilegitimidade'
                        : watchType === 'MERITO'
                          ? 'Ex: provimento, provimento parcial, não provimento'
                          : 'Ex: redução de ofício, prescrição de ofício'
                    }
                    className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Campos específicos para PRELIMINAR */}
        {watchType === 'PRELIMINAR' && (
          <>
            <FormField
              control={form.control}
              name="acceptText"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormLabel className="block text-sm font-medium mb-1.5">
                    Texto se Acatar <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Texto que será usado quando a preliminar for acatada"
                      rows={4}
                      className="resize-none px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rejectText"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormLabel className="block text-sm font-medium mb-1.5">
                    Texto se Afastar <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Texto que será usado quando a preliminar for afastada"
                      rows={4}
                      className="resize-none px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Campos específicos para MERITO e OFICIO */}
        {(watchType === 'MERITO' || watchType === 'OFICIO') && (
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="block text-sm font-medium mb-1.5">
                  Texto <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      watchType === 'MERITO'
                        ? 'Texto que será usado nas atas para esta decisão de mérito'
                        : 'Texto que será usado como complemento aos demais votos (ofício)'
                    }
                    rows={4}
                    className="resize-none px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium">Status</FormLabel>
                <FormDescription className="text-xs text-gray-500">
                  {field.value
                    ? 'Esta decisão está ativa e pode ser utilizada'
                    : 'Esta decisão está inativa e não aparecerá nas opções'}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/ccr/votos')}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="cursor-pointer">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? 'Atualizar' : 'Criar'} Voto
          </Button>
        </div>
      </form>
    </Form>
  );
}
