'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CCRPageWrapper } from '../../../../../../../../components/ccr-page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

interface Contact {
  id: string;
  type: string;
  value: string;
}

interface Part {
  id: string;
  name: string;
  role: string;
  registrationType: string | null;
  registrationNumber: string | null;
  contacts: Contact[];
}

interface SessionResource {
  id: string;
  resource: {
    id: string;
    processNumber: string;
    processName: string | null;
  };
}

interface ExistingAttendance {
  id: string;
  partId: string | null;
  customName: string | null;
  customRole: string | null;
  part?: Part | null;
}

interface AttendanceData {
  sessionResource: SessionResource;
  availableParts: Part[];
  attendances: ExistingAttendance[];
}

interface AttendanceRow {
  id: string;
  partId?: string;
  customName?: string;
  customRole?: string;
}

const partRoleLabels: Record<string, string> = {
  REQUERENTE: 'Requerente',
  REQUERIDO: 'Requerido',
  PATRONO: 'Patrono/Advogado',
  INTERESSADO: 'Interessado',
};

// Modal para adicionar parte cadastrada
function AddRegisteredPartModal({
  isOpen,
  onClose,
  onAdd,
  availableParts,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (partId: string) => void;
  availableParts: Part[];
}) {
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [isClosing, setIsClosing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldAnimate(false);
      setSelectedPartId('');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setShouldAnimate(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId) {
      toast.warning('Selecione uma parte');
      return;
    }
    onAdd(selectedPartId);
    handleClose();
  };

  const getPartDisplayName = (part: Part) => {
    const roleLabel = partRoleLabels[part.role] || part.role;
    return `${part.name} (${roleLabel})`;
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-16 transition-opacity duration-200 ${isClosing ? 'opacity-0' : shouldAnimate ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-md w-full transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : shouldAnimate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Adicionar Parte Cadastrada</h2>
              <p className="text-sm text-gray-600 mt-1">Selecione uma parte do processo</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parte <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {availableParts.map((part) => (
                  <label
                    key={part.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="part"
                      value={part.id}
                      checked={selectedPartId === part.id}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="cursor-pointer accent-gray-900"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{part.name}</div>
                      <div className="text-sm text-gray-600">
                        {partRoleLabels[part.role] || part.role}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal para adicionar parte não cadastrada
function AddCustomPartModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, role: string) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldAnimate(false);
      setName('');
      setRole('');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setShouldAnimate(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Nome é obrigatório');
      return;
    }
    if (!role.trim()) {
      toast.warning('Função é obrigatória');
      return;
    }
    onAdd(name, role);
    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-16 transition-opacity duration-200 ${isClosing ? 'opacity-0' : shouldAnimate ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-md w-full transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : shouldAnimate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Adicionar Parte Não Cadastrada</h2>
              <p className="text-sm text-gray-600 mt-1">Informe o nome e função da pessoa</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="Digite o nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Função <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="Ex: Patrono, Requente..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface Session {
  id: string;
  sessionNumber: string;
}

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRegisteredModal, setShowRegisteredModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  useEffect(() => {
    if (params.id && params.resourceId) {
      fetchData();
    }
  }, [params.id, params.resourceId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar dados da sessão
      const sessionResponse = await fetch(`/api/ccr/sessions/${params.id}`);
      if (sessionResponse.ok) {
        const sessionResult = await sessionResponse.json();
        setSessionData(sessionResult);
      }

      // Buscar dados de presença
      const response = await fetch(`/api/ccr/sessions/${params.id}/processos/${params.resourceId}/presenca`);
      if (response.ok) {
        const result: AttendanceData = await response.json();
        setData(result);

        // Convert existing attendances to rows
        const rows: AttendanceRow[] = result.attendances.map((att, idx) => ({
          id: `existing-${idx}`,
          partId: att.partId || undefined,
          customName: att.customName || undefined,
          customRole: att.customRole || undefined,
        }));
        setAttendances(rows);
      } else {
        toast.error('Erro ao carregar dados');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRegisteredPart = (partId: string) => {
    // Verificar se a parte já foi adicionada
    const partAlreadyAdded = attendances.some(row => row.partId === partId);
    if (partAlreadyAdded) {
      toast.warning('Esta parte já foi adicionada');
      return;
    }

    // Verificar se o nome da parte já existe como entrada manual
    const part = data?.availableParts.find(p => p.id === partId);
    if (part) {
      const nameAlreadyExists = attendances.some(
        row => row.customName?.toLowerCase().trim() === part.name.toLowerCase().trim()
      );
      if (nameAlreadyExists) {
        toast.warning('Já existe uma pessoa com este nome registrada manualmente');
        return;
      }
    }

    const newRow: AttendanceRow = {
      id: `registered-${Date.now()}`,
      partId,
    };
    setAttendances(prev => [...prev, newRow]);
  };

  const handleAddCustomPart = (name: string, role: string) => {
    // Verificar se o nome já existe como entrada manual
    const customNameExists = attendances.some(
      row => row.customName?.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (customNameExists) {
      toast.warning('Já existe uma pessoa com este nome');
      return;
    }

    // Verificar se o nome já existe nas partes cadastradas
    if (data) {
      const partWithSameName = data.availableParts.find(
        p => p.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (partWithSameName) {
        const partAlreadyAdded = attendances.some(row => row.partId === partWithSameName.id);
        if (partAlreadyAdded) {
          toast.warning('Já existe uma parte cadastrada com este nome');
          return;
        }
      }
    }

    const newRow: AttendanceRow = {
      id: `custom-${Date.now()}`,
      customName: name,
      customRole: role,
    };
    setAttendances(prev => [...prev, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    setAttendances(prev => prev.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const attendancesPayload = attendances.map(row => ({
        partId: row.partId || undefined,
        customName: row.customName || undefined,
        customRole: row.customRole || undefined,
      }));

      const response = await fetch(`/api/ccr/sessions/${params.id}/processos/${params.resourceId}/presenca`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendances: attendancesPayload }),
      });

      if (response.ok) {
        toast.success('Presenças salvas com sucesso!');
        router.push(`/ccr/sessoes/${params.id}`);
      } else {
        toast.error('Erro ao salvar presenças');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Erro ao salvar presenças');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Sessões', href: '/ccr/sessoes' },
    { label: `Sessão n. ${sessionData?.sessionNumber || 'Carregando...'}`, href: `/ccr/sessoes/${params.id}` },
    { label: 'Presença de Partes' },
  ];

  if (loading) {
    return (
      <CCRPageWrapper title="Presença de Partes" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <div className="space-y-1.5">
              <CardTitle>Registrar Presença</CardTitle>
              <CardDescription>
                Registre as pessoas que compareceram ao julgamento
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Botões de ação */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-48" />
              </div>

              {/* Tabela */}
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>

              {/* Botões de ação finais */}
              <div className="flex justify-end gap-4 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (!data) {
    return (
      <CCRPageWrapper title="Presença de Partes" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Dados não encontrados</p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  const getPartById = (partId: string) => {
    return data.availableParts.find(p => p.id === partId);
  };

  return (
    <>
      <CCRPageWrapper title="Presença de Partes" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <div className="space-y-1.5">
              <CardTitle>Registrar Presença</CardTitle>
              <CardDescription>
                Processo: {data.sessionResource.resource.processNumber}
                {data.sessionResource.resource.processName && ` - ${data.sessionResource.resource.processName}`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegisteredModal(true)}
                  disabled={data.availableParts.length === 0}
                  className="cursor-pointer"
                >
                  Parte Cadastrada
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomModal(true)}
                  className="cursor-pointer"
                >
                  Parte Não Cadastrada
                </Button>
              </div>

              {/* Attendance Table */}
              {attendances.length === 0 ? (
                <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma presença registrada
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique nos botões acima para adicionar presenças
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableHead className="w-[45%]">Nome</TableHead>
                        <TableHead className="w-[35%]">Função</TableHead>
                        <TableHead className="w-[15%]">Origem</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendances.map((row) => {
                        const isFromPart = !!row.partId;
                        const part = row.partId ? getPartById(row.partId) : null;

                        return (
                          <TableRow key={row.id}>
                            {/* Name Column */}
                            <TableCell>
                              {isFromPart ? (
                                <span className="text-sm">{part?.name || '-'}</span>
                              ) : (
                                <span className="text-sm">{row.customName}</span>
                              )}
                            </TableCell>

                            {/* Role Column */}
                            <TableCell>
                              {isFromPart ? (
                                <span className="text-sm text-muted-foreground">
                                  {part ? partRoleLabels[part.role] || part.role : '-'}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">{row.customRole}</span>
                              )}
                            </TableCell>

                            {/* Source Column */}
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {isFromPart ? 'Cadastrada' : 'Manual'}
                              </span>
                            </TableCell>

                            {/* Delete Button */}
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveRow(row.id)}
                                className="cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Summary */}
              {attendances.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Total de presenças: {attendances.length}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/ccr/sessoes/${params.id}`)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Presenças'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </CCRPageWrapper>

      {/* Modals */}
      <AddRegisteredPartModal
        isOpen={showRegisteredModal}
        onClose={() => setShowRegisteredModal(false)}
        onAdd={handleAddRegisteredPart}
        availableParts={data.availableParts}
      />

      <AddCustomPartModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onAdd={handleAddCustomPart}
      />
    </>
  );
}
