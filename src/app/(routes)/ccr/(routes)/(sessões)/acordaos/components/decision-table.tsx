'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import {
  MoreHorizontal,
  Pencil,
  ChevronLeft,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
  Plus,
  Filter,
  Search,
  Clock,
  CheckCircle,
  RefreshCw,
  Printer,
  FileText,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import { DecisionTableSkeleton } from './decision-skeleton';
import { toast } from 'sonner';

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
  publications: {
    id: string;
    publicationOrder: number;
    publicationNumber: string;
    publicationDate: Date;
  }[];
  createdByUser: {
    id: string;
    name: string | null;
  };
  _count: {
    publications: number;
  };
  createdAt: Date;
}

interface DecisionTableProps {
  data: Decision[];
  loading: boolean;
  onRefresh: () => void;
  onNewDecision: () => void;
  userRole?: string;
}

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  PUBLICADO: 'Publicado',
  REPUBLICADO: 'Republicado',
};

const statusStyles: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  PUBLICADO: 'bg-green-100 text-green-800 hover:bg-green-100',
  REPUBLICADO: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDENTE: <Clock className="h-3.5 w-3.5" />,
  PUBLICADO: <CheckCircle className="h-3.5 w-3.5" />,
  REPUBLICADO: <RefreshCw className="h-3.5 w-3.5" />,
};

export function DecisionTable({ data, loading, onRefresh, onNewDecision, userRole }: DecisionTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchExpanded(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleGenerate = async (decision: Decision) => {
    // Atualizar status se necessário e abrir página de impressão
    if (decision.status === 'PENDENTE') {
      // Se pendente, apenas gera/imprime
      window.open(`/ccr/acordaos/${decision.id}/imprimir`, '_blank');
    } else if (decision.decisionFilePath) {
      // Se já publicado e tem arquivo, abre o arquivo
      window.open(decision.decisionFilePath, '_blank');
    } else {
      // Se publicado mas sem arquivo, abre página de impressão
      window.open(`/ccr/acordaos/${decision.id}/imprimir`, '_blank');
    }
  };

  // Obter anos únicos dos dados
  const uniqueYears = Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);

  // Filtrar dados
  const filteredData = data.filter((decision) => {
    const statusMatch = statusFilter === 'all' || decision.status === statusFilter;
    const yearMatch = yearFilter === 'all' || decision.year.toString() === yearFilter;

    const searchMatch = !searchQuery ||
      decision.decisionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.resource.resourceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.resource.processNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.ementaTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && yearMatch && searchMatch;
  });

  // Dados já vêm ordenados do backend
  const sortedData = filteredData;

  // Paginação
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Reset page when filtered data changes
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  // Contar por status
  const statusCounts = {
    all: data.length,
    PENDENTE: data.filter(d => d.status === 'PENDENTE').length,
    PUBLICADO: data.filter(d => d.status === 'PUBLICADO').length,
    REPUBLICADO: data.filter(d => d.status === 'REPUBLICADO').length,
  };

  if (loading) {
    return <DecisionTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Botões de Busca e Filtros */}
      <div className="flex justify-end gap-2">
        {/* Busca Animada */}
        <div className="relative flex items-center">
          <div
            className={cn(
              "relative flex items-center justify-end transition-all duration-300 ease-in-out",
              isSearchExpanded ? "w-[200px] sm:w-[250px]" : "w-8"
            )}
          >
            <div className="relative w-full h-8">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar acórdãos..."
                value={searchQuery}
                onChange={handleSearchChange}
                onBlur={handleSearchBlur}
                className={cn(
                  "absolute right-0 top-0 h-8 w-full pr-8 text-sm border-gray-200 focus:border-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 transition-opacity duration-300",
                  isSearchExpanded ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
                )}
              />
              <TooltipWrapper content="Buscar por número do acórdão, recurso, processo ou ementa">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearchClick}
                  className={cn(
                    "absolute right-0 top-0 h-8 w-8 p-0 cursor-pointer transition-opacity duration-300",
                    isSearchExpanded ? "opacity-0 pointer-events-none" : "opacity-100 z-10"
                  )}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
            </div>
          </div>
          {isSearchExpanded && (
            <Search className="absolute right-2 h-4 w-4 text-muted-foreground pointer-events-none z-20" />
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 cursor-pointer">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[280px] sm:w-[320px] p-0">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ano
                </label>
                <Select
                  value={yearFilter}
                  onValueChange={(value) => setYearFilter(value)}
                >
                  <SelectTrigger className="h-10 w-full px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-gray-400 transition-colors">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem value="all" className="cursor-pointer h-9">
                      Todos os anos
                    </SelectItem>
                    {uniqueYears.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="cursor-pointer h-9">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger className="h-10 w-full px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-gray-400 transition-colors">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem value="all" className="cursor-pointer h-9">
                      Todos ({statusCounts.all})
                    </SelectItem>
                    <SelectItem value="PENDENTE" className="cursor-pointer h-9">
                      Pendente ({statusCounts.PENDENTE})
                    </SelectItem>
                    <SelectItem value="PUBLICADO" className="cursor-pointer h-9">
                      Publicado ({statusCounts.PUBLICADO})
                    </SelectItem>
                    <SelectItem value="REPUBLICADO" className="cursor-pointer h-9">
                      Republicado ({statusCounts.REPUBLICADO})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t p-3">
              <div className="text-xs text-muted-foreground text-center">
                {filteredData.length} {filteredData.length === 1 ? 'acórdão' : 'acórdãos'} encontrado{filteredData.length !== 1 ? 's' : ''}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" onClick={onNewDecision} className="h-8 gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Acórdão</span>
        </Button>
      </div>

      {/* Tabela */}
      {filteredData.length === 0 ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum acórdão encontrado.</p>
            <p className="text-sm text-muted-foreground mt-2">Clique em &quot;Novo Acórdão&quot; no menu lateral para adicionar.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="relative w-full overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted border-b">
                    <TableHead className="font-semibold">Número</TableHead>
                    <TableHead className="font-semibold">Recurso</TableHead>
                    <TableHead className="font-semibold">Processo</TableHead>
                    <TableHead className="font-semibold">Ementa</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((decision) => (
                    <TableRow key={decision.id} className="bg-white hover:bg-muted/40 min-h-[49px]">
                      <TableCell className="font-medium text-sm">
                        {decision.decisionNumber}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {decision.resource.resourceNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {decision.resource.processNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px] truncate text-sm text-muted-foreground">
                          {decision.ementaTitle}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'inline-flex items-center gap-1.5',
                            statusStyles[decision.status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                          )}
                        >
                          {statusIcons[decision.status]}
                          {statusLabels[decision.status] || decision.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/ccr/acordaos/${decision.id}`)}
                              className="cursor-pointer h-9"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleGenerate(decision)}
                              className="cursor-pointer h-9"
                            >
                              {decision.status === 'PENDENTE' ? (
                                <>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Gerar
                                </>
                              ) : (
                                <>
                                  <Printer className="mr-2 h-4 w-4" />
                                  Imprimir
                                </>
                              )}
                            </DropdownMenuItem>
                            {decision.status !== 'PENDENTE' && (
                              <DropdownMenuItem
                                onClick={() => router.push(`/ccr/acordaos/${decision.id}/publicar`)}
                                className="cursor-pointer h-9"
                              >
                                <Send className="mr-2 h-4 w-4" />
                                {decision.status === 'PUBLICADO' ? 'Republicar' : 'Ver Publicações'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer com Paginação */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 px-2 py-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-16 rounded-md border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md min-w-[4rem]">
                  <SelectPrimitive.Item
                    value="10"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 h-9"
                    )}
                  >
                    <SelectPrimitive.ItemText>10</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item
                    value="20"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 h-9"
                    )}
                  >
                    <SelectPrimitive.ItemText>20</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item
                    value="50"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 h-9"
                    )}
                  >
                    <SelectPrimitive.ItemText>50</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item
                    value="100"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 h-9"
                    )}
                  >
                    <SelectPrimitive.ItemText>100</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <div className="flex items-center gap-1">
                  <TooltipWrapper content="Primeira página">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="Página anterior">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="Próxima página">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="Última página">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
