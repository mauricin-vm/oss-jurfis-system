'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MdLock } from 'react-icons/md';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSidebarConfig } from '@/contexts/sidebar-context';
import { useApi } from '@/hooks/use-api';
import { Dashboard } from './components/dashboard';
import { RecordsTable } from './components/records-table';
import { AddRecordModal } from './components/add-record-modal';
import { EditRecordModal } from './components/edit-record-modal';
import { DeleteModal } from './components/delete-modal';
import { LoginModal } from '@/components/auth/login-modal';
import { RegisterModal } from '@/components/auth/register-modal';
import { DashboardSkeleton, TableSkeleton } from './components/skeleton-loader';
import { OvertimeRecord, OvertimeFormData, OvertimeStats } from './types';
import { Separator } from '@/components/ui/separator';

function HorasExtrasContent() {
  const { data: session, status } = useSession();
  const { setConfig } = useSidebarConfig();
  const { apiFetch } = useApi();

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [stats, setStats] = useState<OvertimeStats>({
    totalExtraHours: 0,
    totalLateHours: 0,
    currentBalance: 0
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; title: string } | null>(null);

  const [usersLoaded, setUsersLoaded] = useState(false);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email: string }>>([]);

  const isLoggedIn = !!session;
  const isCheckingSession = status === 'loading';
  const isAdmin = session?.user?.role === 'ADMIN';

  // Configurar sidebar com ação "Novo Registro"
  useEffect(() => {
    // Não configurar enquanto está verificando a sessão
    if (isCheckingSession) {
      return;
    }

    if (isLoggedIn && session?.user) {
      setConfig({
        showAppSwitcher: true,
        showUserAuth: true,
        customActions: [{
          label: 'Novo Registro',
          icon: Plus,
          onClick: () => setIsAddModalOpen(true),
        }],
        customSections: [],
        customContent: null,
      });
    } else {
      setConfig({
        showAppSwitcher: true,
        showUserAuth: true,
        customActions: [],
        customSections: [],
        customContent: null,
      });
    }
  }, [isCheckingSession, isLoggedIn, session?.user, setConfig]);

  // Inicializar selectedUserId com o ID do usuário logado quando for admin
  useEffect(() => {
    if (isAdmin && session?.user?.id && !selectedUserId) {
      setSelectedUserId(session.user.id);
    }
  }, [isAdmin, session?.user?.id, selectedUserId]);

  // Loading de tela cheia durante o carregamento inicial
  const showInitialLoading = isInitialLoad;

  // Calcular estatísticas
  const calculateStats = useCallback((recordsList: OvertimeRecord[]) => {
    // Se selectedYear for null, usar todos os registros, senão filtrar pelo ano
    const yearRecords = selectedYear !== null
      ? recordsList.filter(r => r.year === selectedYear)
      : recordsList;

    const totalExtraHours = yearRecords.reduce((sum, r) => sum + r.extraHours, 0);
    const totalLateHours = yearRecords.reduce((sum, r) => sum + r.lateHours, 0);

    // Saldo acumulado é o do último registro (mais recente)
    const sortedRecords = [...recordsList].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    const currentBalance = sortedRecords.length > 0 ? sortedRecords[0].accumulatedBalance : 0;

    setStats({
      totalExtraHours,
      totalLateHours,
      currentBalance
    });
  }, [selectedYear]);

  // Carregar registros
  const loadRecords = useCallback(async () => {
    if (isCheckingSession || !isLoggedIn || !session?.user) {
      return;
    }

    // Para admin, aguardar até que selectedUserId esteja definido
    if (isAdmin && !selectedUserId) {
      return;
    }

    try {
      const endpoint = isAdmin ? '/api/overtime/admin' : '/api/overtime';
      const params = new URLSearchParams();

      if (selectedYear !== null) {
        params.append('year', selectedYear.toString());
      }

      if (isAdmin && selectedUserId) {
        params.append('userId', selectedUserId);
      }

      const response = await apiFetch(`${endpoint}?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const data = await response.json();

      if (data.success) {
        setRecords(data.records);
        calculateStats(data.records);
      } else {
        toast.error(data.error || 'Erro ao carregar registros');
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      toast.error('Erro ao carregar registros');
    } finally {
      setRecordsLoaded(true);
    }
  }, [selectedYear, selectedUserId, isAdmin, isCheckingSession, isLoggedIn, session?.user, calculateStats, apiFetch]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Carregar usuários (se for admin)
  const loadUsers = useCallback(async () => {
    if (!isAdmin || !session?.user) {
      setUsersLoaded(true);
      return;
    }

    try {
      const response = await apiFetch('/api/overtime/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.error || 'Erro ao carregar servidores');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setUsersLoaded(true);
    }
  }, [isAdmin, session?.user, apiFetch]);

  // Carregar usuários quando a sessão estiver pronta
  useEffect(() => {
    if (!isCheckingSession && isLoggedIn && session?.user) {
      loadUsers();
    }
  }, [isCheckingSession, isLoggedIn, session?.user, loadUsers]);

  // Controlar o loading inicial - só termina quando tudo estiver carregado
  useEffect(() => {
    // Se está verificando sessão, mantém loading
    if (isCheckingSession) {
      return;
    }

    // Se não está logado, termina loading imediatamente
    if (!isLoggedIn) {
      setIsInitialLoad(false);
      return;
    }

    // Se está logado, verifica o que precisa ser carregado
    const needsUsers = isAdmin;
    const hasUsers = needsUsers ? usersLoaded : true;
    const hasRecords = recordsLoaded;

    // Só termina o loading inicial quando tudo que precisa foi carregado
    if (hasUsers && hasRecords) {
      setIsInitialLoad(false);
    }
  }, [isCheckingSession, isLoggedIn, isAdmin, usersLoaded, recordsLoaded, selectedUserId]);

  // Adicionar novo registro
  const handleAddRecord = async (formData: OvertimeFormData) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('month', formData.month.toString());
      formDataToSend.append('year', formData.year.toString());
      formDataToSend.append('extraHours', formData.extraHours.toString());
      formDataToSend.append('lateHours', formData.lateHours.toString());
      if (formData.document) {
        formDataToSend.append('document', formData.document);
      }

      const response = await apiFetch('/api/overtime', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Registro criado com sucesso!');
        loadRecords();
      } else {
        toast.error(data.error || 'Erro ao criar registro');
      }
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      toast.error('Erro ao criar registro');
    }
  };

  // Editar registro
  const handleEditRecord = async (id: string, formData: OvertimeFormData) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('extraHours', formData.extraHours.toString());
      formDataToSend.append('lateHours', formData.lateHours.toString());
      if (formData.document) {
        formDataToSend.append('document', formData.document);
      }

      const response = await apiFetch(`/api/overtime/${id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Registro atualizado com sucesso!');
        setSelectedRecord(null);
        loadRecords();
      } else {
        toast.error(data.error || 'Erro ao atualizar registro');
      }
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      toast.error('Erro ao atualizar registro');
    }
  };

  // Excluir registro
  const handleDeleteRecord = (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    setRecordToDelete({
      id,
      title: `${monthNames[record.month - 1]}/${record.year}`
    });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;

    try {
      const response = await apiFetch(`/api/overtime/${recordToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Registro excluído com sucesso!');
        setIsDeleteModalOpen(false);
        setRecordToDelete(null);
        loadRecords();
      } else {
        toast.error(data.error || 'Erro ao excluir registro');
      }
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast.error('Erro ao excluir registro');
    }
  };

  // Visualizar documento
  const handleViewDocument = async (id: string) => {
    try {
      const response = await apiFetch(`/api/overtime/document/${id}`);

      if (response.ok) {
        // Criar blob e abrir em nova aba
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao visualizar documento');
      }
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      toast.error('Erro ao visualizar documento');
    }
  };

  const handleEdit = (record: OvertimeRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Menu
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">Horas Extras</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {isCheckingSession ? (
            <>
              {/* Skeleton Loading enquanto verifica sessão */}
              <DashboardSkeleton />
              <TableSkeleton />
            </>
          ) : isLoggedIn && session?.user ? (
            showInitialLoading ? (
              <>
                {/* Skeleton Loading */}
                <DashboardSkeleton />
                <TableSkeleton />
              </>
            ) : (
              <>
                {/* Dashboard */}
                <Dashboard stats={stats} selectedYear={selectedYear} />

                {/* Tabela com Filtros */}
                <RecordsTable
                  records={records}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRecord}
                  onViewDocument={handleViewDocument}
                  isAdmin={isAdmin}
                  users={users}
                  selectedUserId={selectedUserId}
                  onUserChange={setSelectedUserId}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                  currentUserId={session?.user?.id}
                />
              </>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdLock className="text-5xl text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
                <p className="text-muted-foreground">
                  Faça login na barra lateral para acessar o sistema de horas extras
                </p>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddRecord}
      />

      <EditRecordModal
        isOpen={isEditModalOpen}
        record={selectedRecord}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRecord(null);
        }}
        onSave={handleEditRecord}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        recordTitle={recordToDelete?.title || ''}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={confirmDeleteRecord}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </>
  );
}

export default function HorasExtrasPage() {
  return <HorasExtrasContent />;
}
