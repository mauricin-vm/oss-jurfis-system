'use client'

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/use-api';
import { Meeting } from '../types';

interface PendingRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PendingRequestsModal({ isOpen, onClose, onUpdate }: PendingRequestsModalProps) {
  const { apiFetch } = useApi();
  const [isClosing, setIsClosing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [requests, setRequests] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Meeting | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldAnimate(false);
      loadRequests();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    }
  }, [isOpen]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/meetings/requests');
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setIsClosing(true);
    setShouldAnimate(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSelectedRequest(null);
      setShowRejectForm(false);
      setRejectionReason('');
    }, 200);
  };

  const handleApprove = async (request: Meeting) => {
    if (!confirm(`Deseja aprovar a reunião de ${request.requestedBy}?`)) return;

    setIsProcessing(true);
    try {
      const response = await apiFetch(`/api/meetings/requests/${request.id}/approve`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Solicitação aprovada! Email de confirmação enviado.');
        loadRequests();
        onUpdate();
      } else {
        toast.error('Erro ao aprovar: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast.error('Erro ao aprovar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (request: Meeting) => {
    setSelectedRequest(request);
    setShowRejectForm(true);
    setRejectionReason('');
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      toast.warning('É necessário informar o motivo da rejeição');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiFetch(`/api/meetings/requests/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Solicitação rejeitada! Email de notificação enviado.');
        setShowRejectForm(false);
        setSelectedRequest(null);
        setRejectionReason('');
        loadRequests();
        onUpdate();
      } else {
        toast.error('Erro ao rejeitar: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast.error('Erro ao rejeitar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-16 transition-opacity duration-200 ${isClosing ? 'opacity-0' : shouldAnimate ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : shouldAnimate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Solicitações Pendentes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {requests.length} {requests.length === 1 ? 'solicitação aguardando' : 'solicitações aguardando'} aprovação
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 mt-4">Carregando solicitações...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">Nenhuma solicitação pendente</p>
              <p className="text-gray-400 text-sm mt-1">Todas as solicitações foram processadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Solicitante</label>
                      <p className="text-gray-900">{request.requestedBy}</p>
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Data</label>
                      <p className="text-gray-900">
                        {new Date(request.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Email</label>
                      <p className="text-gray-900">{request.email}</p>
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Telefone</label>
                      <p className="text-gray-900">{request.phone}</p>
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Horário</label>
                      <p className="text-gray-900">
                        {request.startTime} às {request.endTime}
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Solicitado em</label>
                      <p className="text-gray-900">
                        {request.createdAt ? new Date(request.createdAt).toLocaleString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                    {request.notes && (
                      <div className="md:col-span-2">
                        <label className="block text-gray-500 font-medium mb-1">Observações</label>
                        <p className="text-gray-900">{request.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3 mt-5 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Aprovar
                    </button>
                    <button
                      onClick={() => handleRejectClick(request)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✗ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Modal de Rejeição */}
      {showRejectForm && selectedRequest && (
        <div
          className="fixed inset-0 bg-black/60 flex items-start justify-center z-[60] p-4 pt-16"
          onClick={() => !isProcessing && setShowRejectForm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Rejeitar Solicitação
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Solicitante: <strong>{selectedRequest.requestedBy}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Motivo da Rejeição <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  rows={4}
                  placeholder="Explique o motivo da rejeição para o solicitante..."
                  disabled={isProcessing}
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowRejectForm(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Rejeitando...' : 'Confirmar Rejeição'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
