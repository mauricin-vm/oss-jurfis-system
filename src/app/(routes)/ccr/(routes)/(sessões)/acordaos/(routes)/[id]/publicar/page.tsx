'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CCRPageWrapper } from '../../../../../../components/ccr-page-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Send, History, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DecisionPublication {
  id: string;
  publicationOrder: number;
  publicationNumber: string;
  publicationDate: Date;
  ementaTitleSnapshot: string;
  ementaBodySnapshot: string;
  republishReason: string | null;
  createdAt: Date;
}

interface Decision {
  id: string;
  decisionNumber: string;
  sequenceNumber: number;
  year: number;
  ementaTitle: string;
  ementaBody: string;
  votePath: string | null;
  status: string;
  decisionFilePath: string | null;
  resource: {
    id: string;
    resourceNumber: string;
    processNumber: string;
    processName: string | null;
  };
  publications: DecisionPublication[];
}

const formSchema = z.object({
  publicationNumber: z.string().min(1, 'Número da publicação é obrigatório'),
  publicationDate: z.string().min(1, 'Data da publicação é obrigatória'),
  republishReason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  PUBLICADO: 'Publicado',
  REPUBLICADO: 'Republicado',
};

const statusStyles: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  PUBLICADO: 'bg-green-100 text-green-800',
  REPUBLICADO: 'bg-blue-100 text-blue-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDENTE: <Clock className="h-3.5 w-3.5" />,
  PUBLICADO: <CheckCircle className="h-3.5 w-3.5" />,
  REPUBLICADO: <RefreshCw className="h-3.5 w-3.5" />,
};

export default function PublicarAcordaoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const isRepublish = decision && decision.publications.length > 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(
      isRepublish
        ? formSchema.extend({
            republishReason: z.string().min(1, 'Motivo da republicação é obrigatório'),
          })
        : formSchema
    ),
    defaultValues: {
      publicationNumber: '',
      publicationDate: '',
      republishReason: '',
    },
  });

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    if (params.id) {
      fetchDecision();
    }
  }, [params.id]);

  const fetchDecision = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/decisions/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDecision(data);
      } else {
        toast.error('Acórdão não encontrado');
        router.push('/ccr/acordaos');
      }
    } catch (error) {
      console.error('Error fetching decision:', error);
      toast.error('Erro ao carregar acórdão');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setPublishing(true);

      const response = await fetch(`/api/ccr/decisions/${params.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicationNumber: data.publicationNumber,
          publicationDate: data.publicationDate,
          republishReason: data.republishReason?.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success(isRepublish ? 'Acórdão republicado com sucesso' : 'Acórdão publicado com sucesso');
      router.push('/ccr/acordaos');
      router.refresh();
    } catch (error) {
      console.error('Error publishing decision:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao publicar acórdão');
    } finally {
      setPublishing(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Acórdãos', href: '/ccr/acordaos' },
    { label: isRepublish ? 'Republicar' : 'Publicar' }
  ];

  // Se ainda está carregando a sessão, não renderizar nada
  if (status === 'loading') {
    return null;
  }

  // Se é EXTERNAL, não renderizar o conteúdo
  if (session?.user?.role === 'EXTERNAL') {
    return null;
  }

  if (loading) {
    return (
      <CCRPageWrapper title="Publicar Acórdão" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <div className="space-y-1.5">
              <CardTitle>Publicar Acórdão</CardTitle>
              <CardDescription>
                Registre a publicação do acórdão.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (!decision) {
    return (
      <CCRPageWrapper title="Publicar Acórdão" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Acórdão não encontrado</p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  return (
    <CCRPageWrapper title={isRepublish ? 'Republicar Acórdão' : 'Publicar Acórdão'} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Informações do Acórdão */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle>Acórdão {decision.decisionNumber}</CardTitle>
                <CardDescription>
                  Recurso {decision.resource.resourceNumber} - Processo {decision.resource.processNumber}
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  'inline-flex items-center gap-1.5',
                  statusStyles[decision.status]
                )}
              >
                {statusIcons[decision.status]}
                {statusLabels[decision.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Título da Ementa</h4>
                <p className="text-sm">{decision.ementaTitle}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Corpo da Ementa</h4>
                <p className="text-sm whitespace-pre-wrap">{decision.ementaBody}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Publicações */}
        {decision.publications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Publicações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {decision.publications.map((pub) => (
                  <AccordionItem key={pub.id} value={pub.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">
                          {pub.publicationOrder === 1 ? 'Publicação Original' : `Republicação ${pub.publicationOrder - 1}`}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Nº {pub.publicationNumber} - {format(new Date(pub.publicationDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {pub.republishReason && (
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <h5 className="text-sm font-medium text-yellow-800 mb-1">Motivo da Republicação</h5>
                            <p className="text-sm text-yellow-700">{pub.republishReason}</p>
                          </div>
                        )}
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-1">Título da Ementa (snapshot)</h5>
                          <p className="text-sm">{pub.ementaTitleSnapshot}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-1">Corpo da Ementa (snapshot)</h5>
                          <p className="text-sm whitespace-pre-wrap">{pub.ementaBodySnapshot}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Formulário de Publicação */}
        <Card>
          <CardHeader>
            <div className="space-y-1.5">
              <CardTitle>{isRepublish ? 'Nova Republicação' : 'Registrar Publicação'}</CardTitle>
              <CardDescription>
                {isRepublish
                  ? 'Registre uma nova republicação do acórdão com o motivo da correção.'
                  : 'Registre os dados da publicação do acórdão.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Número da Publicação */}
                  <FormField
                    control={form.control}
                    name="publicationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Número da Publicação <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: 12345"
                            className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data da Publicação */}
                  <FormField
                    control={form.control}
                    name="publicationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Data da Publicação <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Motivo da Republicação (apenas se for republicação) */}
                {isRepublish && (
                  <FormField
                    control={form.control}
                    name="republishReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Motivo da Republicação <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o motivo da republicação..."
                            className="min-h-[100px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Botões */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/ccr/acordaos')}
                    disabled={publishing}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={publishing} className="cursor-pointer">
                    {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Send className="mr-2 h-4 w-4" />
                    {isRepublish ? 'Republicar' : 'Publicar'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </CCRPageWrapper>
  );
}
