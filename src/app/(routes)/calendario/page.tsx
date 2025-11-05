'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from './components/sidebar';
import { CalendarGrid } from './components/calendar-grid';
import { AdminModal } from './components/admin-modal';
import { RequestModal } from './components/request-modal';
import { PendingRequestsModal } from './components/pending-requests-modal';
import { DeleteModal } from './components/delete-modal';
import { ToastProvider, ToastContainer, useToast } from './components/toast-context';
import { Meeting, MeetingFormData } from './types';

function CalendarioContent() {
  const { data: session, status } = useSession();
  const { addToast } = useToast();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isPendingRequestsModalOpen, setIsPendingRequestsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);

  const isAdmin = !!session;
  const isCheckingSession = status === 'loading';

  // Loading de tela cheia: apenas na primeira vez que abre a página (F5)
  // Depois que renderiza uma vez, usa apenas overlay
  const showInitialLoading = !hasRenderedOnce && (isCheckingSession || isLoading);

  // Carregar reuniões
  const loadMeetings = useCallback(async () => {
    // Não carregar se ainda estiver verificando a sessão
    if (isCheckingSession) {
      return;
    }

    setIsLoading(true);

    // Só mostrar overlay de loading se demorar mais de 300ms
    const loadingTimer = setTimeout(() => {
      setShowLoadingOverlay(true);
    }, 300);

    try {
      // Iniciar no começo do dia (00:00:00)
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);

      // Terminar no fim do dia +3 dias (23:59:59)
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 3);
      endDate.setHours(23, 59, 59, 999);

      const endpoint = isAdmin ? '/api/meetings/admin' : '/api/meetings';
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await response.json();

      if (data.success) {
        setMeetings(data.meetings);
      }
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
    } finally {
      clearTimeout(loadingTimer);
      setIsLoading(false);
      setShowLoadingOverlay(false);
    }
  }, [selectedDate, isAdmin, isCheckingSession]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // Recarregar reuniões quando refreshTrigger mudar (após aprovar/rejeitar solicitação)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadMeetings();
    }
  }, [refreshTrigger, loadMeetings]);

  // Marcar que a página foi renderizada pela primeira vez
  // Isso acontece quando sai do loading inicial (sessão verificada + dados carregados)
  useEffect(() => {
    if (!isCheckingSession && !isLoading && !hasRenderedOnce) {
      setHasRenderedOnce(true);
    }
  }, [isCheckingSession, isLoading, hasRenderedOnce]);

  const handleCreateMeeting = async (formData: MeetingFormData) => {
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setIsAdminModalOpen(false);
        loadMeetings();
        addToast('Reunião criada com sucesso!', 'success');
      } else {
        addToast(data.error || 'Erro ao criar reunião', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar reunião:', error);
      addToast('Erro ao criar reunião', 'error');
    }
  };

  const handleUpdateMeeting = async (formData: MeetingFormData) => {
    if (!selectedMeeting) return;

    try {
      const response = await fetch(`/api/meetings/${selectedMeeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setIsAdminModalOpen(false);
        setSelectedMeeting(null);
        loadMeetings();
        addToast('Reunião atualizada com sucesso!', 'success');
      } else {
        addToast(data.error || 'Erro ao atualizar reunião', 'error');
      }
    } catch (error) {
      console.error('Erro ao atualizar reunião:', error);
      addToast('Erro ao atualizar reunião', 'error');
    }
  };

  const handleDeleteMeeting = (id: string) => {
    // Encontrar a reunião para pegar o título
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;

    setMeetingToDelete({ id, title: meeting.title });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMeeting = async (reason: string) => {
    if (!meetingToDelete) return;

    try {
      const response = await fetch(`/api/meetings/${meetingToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (data.success) {
        loadMeetings();
        addToast('Reunião excluída com sucesso! Email de cancelamento enviado.', 'success');
        setIsDeleteModalOpen(false);
        setMeetingToDelete(null);
      } else {
        addToast(data.error || 'Erro ao excluir reunião', 'error');
      }
    } catch (error) {
      console.error('Erro ao excluir reunião:', error);
      addToast('Erro ao excluir reunião', 'error');
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsAdminModalOpen(true);
  };

  const handleNewMeeting = () => {
    setSelectedMeeting(null);
    setIsAdminModalOpen(true);
  };

  const handleSaveMeeting = (formData: MeetingFormData) => {
    if (selectedMeeting) {
      handleUpdateMeeting(formData);
    } else {
      handleCreateMeeting(formData);
    }
  };

  // Mostrar loading unificado enquanto verifica sessão e carrega dados iniciais
  if (showInitialLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 text-lg">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isAdmin={isAdmin}
        userName={session?.user?.name}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onNewMeeting={handleNewMeeting}
        onRequestMeeting={() => setIsRequestModalOpen(true)}
        onPendingRequests={() => setIsPendingRequestsModalOpen(true)}
        refreshTrigger={refreshTrigger}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Header compacto */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Calendário de Reuniões - JURFIS
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {selectedDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Calendário */}
        <div className="flex-1 overflow-hidden">
          <CalendarGrid
            key={`${refreshTrigger}-${meetings.length}`}
            startDate={selectedDate}
            meetings={meetings}
            isAdmin={isAdmin}
            onEditMeeting={handleEditMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            isLoading={showLoadingOverlay}
          />
        </div>
      </div>

      {/* Modais */}
      <AdminModal
        isOpen={isAdminModalOpen}
        meeting={selectedMeeting}
        onClose={() => {
          setIsAdminModalOpen(false);
          setSelectedMeeting(null);
        }}
        onSave={handleSaveMeeting}
      />

      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={loadMeetings}
      />

      <PendingRequestsModal
        isOpen={isPendingRequestsModalOpen}
        onClose={() => {
          setIsPendingRequestsModalOpen(false);
          setRefreshTrigger(prev => prev + 1);
        }}
        onUpdate={() => {
          loadMeetings();
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        meetingTitle={meetingToDelete?.title || ''}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMeetingToDelete(null);
        }}
        onConfirm={confirmDeleteMeeting}
      />
    </div>
  );
}

export default function CalendarioPage() {
  return (
    <ToastProvider>
      <ToastContainer />
      <CalendarioContent />
    </ToastProvider>
  );
}
