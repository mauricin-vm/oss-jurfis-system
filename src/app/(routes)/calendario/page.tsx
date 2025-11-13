'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useSidebarConfig } from '@/contexts/sidebar-context';
import { useApi } from '@/hooks/use-api';
import { MiniCalendar } from './components/mini-calendar';
import { CalendarGrid } from './components/calendar-grid';
import { AdminModal } from './components/admin-modal';
import { RequestModal } from './components/request-modal';
import { PendingRequestsModal } from './components/pending-requests-modal';
import { DeleteModal } from './components/delete-modal';
import { CalendarGridSkeleton } from './components/skeleton-loader';
import { Meeting, MeetingFormData } from './types';

function CalendarioContent() {
  const { data: session, status } = useSession();
  const { setConfig } = useSidebarConfig();
  const { apiFetch } = useApi();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isPendingRequestsModalOpen, setIsPendingRequestsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isAdmin = session?.user?.role === 'ADMIN';
  const isCheckingSession = status === 'loading';
  const showInitialLoading = isInitialLoad;

  // Verificar se o usuário pertence à organização 'Junta de Recursos Fiscais'
  const isFromJurfis = session?.user?.organizationName === 'Junta de Recursos Fiscais';
  const isLoggedIn = !!session;

  // Configurar sidebar com custom actions e mini calendário
  useEffect(() => {
    // Não configurar enquanto está verificando a sessão
    if (isCheckingSession) {
      return;
    }

    // Se não estiver logado OU não for da organização JURFIS, mostrar apenas "Novo Agendamento"
    if (!isLoggedIn || !isFromJurfis) {
      setConfig({
        showAppSwitcher: true,
        showUserAuth: true,
        customContent: (
          <MiniCalendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        ),
        customActions: [
          {
            label: 'Novo Agendamento',
            icon: Plus,
            onClick: () => setIsRequestModalOpen(true),
          }
        ],
        customSections: [],
      });
    } else {
      // Usuário logado e da JURFIS: mostrar botões de admin
      setConfig({
        showAppSwitcher: true,
        showUserAuth: true,
        customContent: (
          <MiniCalendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        ),
        customActions: [
          {
            label: 'Novo Agendamento',
            icon: Plus,
            onClick: () => setIsAdminModalOpen(true),
          },
          {
            label: 'Solicitações Pendentes',
            icon: Clock,
            onClick: () => setIsPendingRequestsModalOpen(true),
          }
        ],
        customSections: [],
      });
    }
  }, [isCheckingSession, isLoggedIn, isFromJurfis, selectedDate, setConfig]);

  // Carregar reuniões
  const loadMeetings = useCallback(async () => {
    if (isCheckingSession) {
      return;
    }

    setIsLoading(true);

    try {
      // Iniciar no começo do dia (00:00:00)
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);

      // Terminar no fim do dia +3 dias (23:59:59)
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 3);
      endDate.setHours(23, 59, 59, 999);

      const endpoint = isFromJurfis ? '/api/meetings/admin' : '/api/meetings';
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await apiFetch(`${endpoint}?${params.toString()}`, {
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
      setIsLoading(false);
    }
  }, [selectedDate, isFromJurfis, isCheckingSession, apiFetch]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // Recarregar reuniões quando refreshTrigger mudar
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadMeetings();
    }
  }, [refreshTrigger, loadMeetings]);

  // Controlar loading inicial
  useEffect(() => {
    if (isCheckingSession) {
      return;
    }

    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isCheckingSession, isLoading]);

  const handleCreateMeeting = async (formData: MeetingFormData) => {
    try {
      const response = await apiFetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setIsAdminModalOpen(false);
        loadMeetings();
        toast.success('Reunião criada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao criar reunião');
      }
    } catch (error) {
      console.error('Erro ao criar reunião:', error);
      toast.error('Erro ao criar reunião');
    }
  };

  const handleUpdateMeeting = async (formData: MeetingFormData) => {
    if (!selectedMeeting) return;

    try {
      const response = await apiFetch(`/api/meetings/${selectedMeeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setIsAdminModalOpen(false);
        setSelectedMeeting(null);
        loadMeetings();
        toast.success('Reunião atualizada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao atualizar reunião');
      }
    } catch (error) {
      console.error('Erro ao atualizar reunião:', error);
      toast.error('Erro ao atualizar reunião');
    }
  };

  const handleDeleteMeeting = (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;

    setMeetingToDelete({ id, title: meeting.title });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMeeting = async (reason: string) => {
    if (!meetingToDelete) return;

    try {
      const response = await apiFetch(`/api/meetings/${meetingToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (data.success) {
        loadMeetings();
        toast.success('Reunião excluída com sucesso! Email de cancelamento enviado.');
        setIsDeleteModalOpen(false);
        setMeetingToDelete(null);
      } else {
        toast.error(data.error || 'Erro ao excluir reunião');
      }
    } catch (error) {
      console.error('Erro ao excluir reunião:', error);
      toast.error('Erro ao excluir reunião');
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {showInitialLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              <span className="text-muted-foreground">/</span>
              <Skeleton className="h-4 w-20" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Menu
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold">Calendário</span>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 p-4 pt-0 overflow-hidden">
        {showInitialLoading ? (
          <CalendarGridSkeleton />
        ) : (
          <div className="h-full">
            <CalendarGrid
              key={`${refreshTrigger}-${meetings.length}`}
              startDate={selectedDate}
              meetings={meetings}
              isAdmin={isAdmin}
              onEditMeeting={handleEditMeeting}
              onDeleteMeeting={handleDeleteMeeting}
              isLoading={false}
            />
          </div>
        )}
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
  return <CalendarioContent />;
}
