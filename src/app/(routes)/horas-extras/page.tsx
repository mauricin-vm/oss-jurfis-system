'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MdLock } from 'react-icons/md';
import { Sidebar } from './components/sidebar';
import { Dashboard } from './components/dashboard';
import { RecordsTable } from './components/records-table';
import { AddRecordModal } from './components/add-record-modal';
import { EditRecordModal } from './components/edit-record-modal';
import { DeleteModal } from './components/delete-modal';
import { LoginModal } from './components/login-modal';
import { RegisterModal } from './components/register-modal';
import { ToastProvider, ToastContainer, useToast } from './components/toast-context';
import { OvertimeRecord, OvertimeFormData, OvertimeStats } from './types';

function HorasExtrasContent() {
  const { data: session, status } = useSession();
  const { addToast } = useToast();

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
    if (isCheckingSession || !isLoggedIn) {
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

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const data = await response.json();

      if (data.success) {
        setRecords(data.records);
        calculateStats(data.records);
      } else {
        addToast(data.error || 'Erro ao carregar registros', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      addToast('Erro ao carregar registros', 'error');
    } finally {
      setRecordsLoaded(true);
    }
  }, [selectedYear, selectedUserId, isAdmin, isCheckingSession, isLoggedIn, addToast, calculateStats]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Carregar usuários (se for admin)
  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      setUsersLoaded(true);
      return;
    }

    try {
      const response = await fetch('/api/overtime/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        addToast(data.error || 'Erro ao carregar servidores', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setUsersLoaded(true);
    }
  }, [isAdmin, addToast]);

  // Carregar usuários quando a sessão estiver pronta
  useEffect(() => {
    if (!isCheckingSession && isLoggedIn) {
      loadUsers();
    }
  }, [isCheckingSession, isLoggedIn, loadUsers]);

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

      const response = await fetch('/api/overtime', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        addToast('Registro criado com sucesso!', 'success');
        loadRecords();
      } else {
        addToast(data.error || 'Erro ao criar registro', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      addToast('Erro ao criar registro', 'error');
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

      const response = await fetch(`/api/overtime/${id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        addToast('Registro atualizado com sucesso!', 'success');
        setSelectedRecord(null);
        loadRecords();
      } else {
        addToast(data.error || 'Erro ao atualizar registro', 'error');
      }
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      addToast('Erro ao atualizar registro', 'error');
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
      const response = await fetch(`/api/overtime/${recordToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        addToast('Registro excluído com sucesso!', 'success');
        setIsDeleteModalOpen(false);
        setRecordToDelete(null);
        loadRecords();
      } else {
        addToast(data.error || 'Erro ao excluir registro', 'error');
      }
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      addToast('Erro ao excluir registro', 'error');
    }
  };

  // Visualizar documento
  const handleViewDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/overtime/document/${id}`);

      if (response.ok) {
        // Criar blob e abrir em nova aba
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        const data = await response.json();
        addToast(data.error || 'Erro ao visualizar documento', 'error');
      }
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      addToast('Erro ao visualizar documento', 'error');
    }
  };

  const handleEdit = (record: OvertimeRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  // Mostrar loading inicial
  if (showInitialLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 text-lg">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  // Pegar registros existentes para validação
  const existingRecords = records.map(r => ({ month: r.month, year: r.year }));

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isAdmin={isAdmin}
        userName={session?.user?.name}
        userEmail={session?.user?.email}
        userId={session?.user?.id}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        onNewRecord={() => setIsAddModalOpen(true)}
        onLogin={() => setIsLoginModalOpen(true)}
        users={users}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {isLoggedIn ? (
          <>
            {/* Dashboard */}
            <Dashboard stats={stats} selectedYear={selectedYear} />

            {/* Tabela */}
            <RecordsTable
              records={records}
              onEdit={handleEdit}
              onDelete={handleDeleteRecord}
              onViewDocument={handleViewDocument}
              isAdmin={isAdmin}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdLock className="text-5xl text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
              <p className="text-gray-600">
                Faça login na barra lateral para acessar o sistema de gestão de horas extras
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
        existingRecords={existingRecords}
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
    </div>
  );
}

export default function HorasExtrasPage() {
  return (
    <ToastProvider>
      <ToastContainer />
      <HorasExtrasContent />
    </ToastProvider>
  );
}
