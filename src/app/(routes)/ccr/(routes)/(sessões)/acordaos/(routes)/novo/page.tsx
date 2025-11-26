'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailableResource {
  id: string;
  resourceNumber: string;
  processNumber: string;
  processName: string | null;
  sessionResults: {
    session: {
      id: string;
      sessionNumber: string;
      date: Date;
      year: number;
    };
  }[];
}

const formSchema = z.object({
  resourceId: z.string().min(1, 'Selecione o recurso'),
  ementaTitle: z.string().min(1, 'Título da ementa é obrigatório'),
  ementaBody: z.string().min(1, 'Corpo da ementa é obrigatório'),
  votePath: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NovoAcordaoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState<AvailableResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resourceId: '',
      ementaTitle: '',
      ementaBody: '',
      votePath: '',
    },
  });

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  // Buscar recursos disponíveis
  useEffect(() => {
    fetchAvailableResources();
  }, []);

  const fetchAvailableResources = async (search?: string) => {
    try {
      setLoadingResources(true);
      const url = search
        ? `/api/ccr/decisions/available-resources?search=${encodeURIComponent(search)}`
        : '/api/ccr/decisions/available-resources';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Error fetching available resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Debounce a busca
    const timeoutId = setTimeout(() => {
      fetchAvailableResources(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setSaving(true);

      const response = await fetch('/api/ccr/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: data.resourceId,
          ementaTitle: data.ementaTitle,
          ementaBody: data.ementaBody,
          votePath: data.votePath?.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const decision = await response.json();
      toast.success(`Acórdão ${decision.decisionNumber} criado com sucesso`);
      router.push('/ccr/acordaos');
      router.refresh();
    } catch (error) {
      console.error('Error creating decision:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar acórdão');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Acórdãos', href: '/ccr/acordaos' },
    { label: 'Novo' }
  ];

  const selectedResource = resources.find(r => r.id === form.watch('resourceId'));

  // Se ainda está carregando a sessão, não renderizar nada
  if (status === 'loading') {
    return null;
  }

  // Se é EXTERNAL, não renderizar o conteúdo
  if (session?.user?.role === 'EXTERNAL') {
    return null;
  }

  return (
    <CCRPageWrapper title="Novo Acórdão" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <div className="space-y-1.5">
            <CardTitle>Novo Acórdão</CardTitle>
            <CardDescription>
              Crie um novo acórdão para um recurso julgado.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Seleção do Recurso */}
              <FormField
                control={form.control}
                name="resourceId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Recurso <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                              "w-full justify-between h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedResource ? (
                              <span className="truncate">
                                {selectedResource.resourceNumber} - {selectedResource.processNumber}
                                {selectedResource.processName && ` - ${selectedResource.processName}`}
                              </span>
                            ) : (
                              "Selecione o recurso..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Buscar por número do recurso, processo ou nome..."
                            value={searchValue}
                            onValueChange={handleSearchChange}
                          />
                          <CommandList>
                            {loadingResources ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Carregando recursos...
                              </div>
                            ) : resources.length === 0 ? (
                              <CommandEmpty>
                                Nenhum recurso disponível encontrado.
                              </CommandEmpty>
                            ) : (
                              <CommandGroup>
                                {resources.map((resource) => (
                                  <CommandItem
                                    key={resource.id}
                                    value={resource.id}
                                    onSelect={() => {
                                      form.setValue('resourceId', resource.id);
                                      setOpen(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === resource.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {resource.resourceNumber} - {resource.processNumber}
                                      </span>
                                      {resource.processName && (
                                        <span className="text-sm text-muted-foreground truncate max-w-[400px]">
                                          {resource.processName}
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Título da Ementa */}
              <FormField
                control={form.control}
                name="ementaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Título da Ementa <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o título da ementa"
                        className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Corpo da Ementa */}
              <FormField
                control={form.control}
                name="ementaBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Corpo da Ementa <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite o corpo da ementa"
                        className="min-h-[200px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Caminho do Voto */}
              <FormField
                control={form.control}
                name="votePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Caminho do Voto Anexado
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: /votos/2025/voto_0001_2025.pdf"
                        className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/ccr/acordaos')}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="cursor-pointer">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Acórdão
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
