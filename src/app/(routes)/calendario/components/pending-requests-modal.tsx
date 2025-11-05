'use client'

import { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { useToast } from './toast-context';

interface PendingRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PendingRequestsModal({ isOpen, onClose, onUpdate }: PendingRequestsModalProps) {
  const { addToast } = useToast();
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
      const response = await fetch('/api/meetings/requests');
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
      const response = await fetch(`/api/meetings/requests/${request.id}/approve`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        addToast('Solicitação aprovada! Email de confirmação enviado.', 'success');
        loadRequests();
        onUpdate();
      } else {
        addToast('Erro ao aprovar: ' + data.error, 'error');
      }
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      addToast('Erro ao aprovar solicitação', 'error');
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
      addToast('É necessário informar o motivo da rejeição', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/meetings/requests/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });

      const data = await response.json();

      if (data.success) {
        addToast('Solicitação rejeitada! Email de notificação enviado.', 'success');
        setShowRejectForm(false);
        setSelectedRequest(null);
        setRejectionReason('');
        loadRequests();
        onUpdate();
      } else {
        addToast('Erro ao rejeitar: ' + data.error, 'error');
      }
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      addToast('Erro ao rejeitar solicitação', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : shouldAnimate ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : shouldAnimate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
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
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
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
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.title}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Solicitante:</span>
                          <p className="font-medium text-gray-900">{request.requestedBy}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Data:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(request.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="font-medium text-gray-900">{request.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Telefone:</span>
                          <p className="font-medium text-gray-900">{request.phone}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Horário:</span>
                          <p className="font-medium text-gray-900">
                            {request.startTime} às {request.endTime}
                          </p>
                        </div>
                        {request.notes && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Observações:</span>
                            <p className="font-medium text-gray-900 mt-1">{request.notes}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-gray-500">Solicitado em:</span>
                          <p className="font-medium text-gray-900">
                            {request.createdAt ? new Date(request.createdAt).toLocaleString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Aprovar
                    </button>
                    <button
                      onClick={() => handleRejectClick(request)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Modal de Rejeição */}
      {showRejectForm && selectedRequest && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
          onClick={() => !isProcessing && setShowRejectForm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Rejeitar Solicitação
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Solicitante: <strong>{selectedRequest.requestedBy}</strong>
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Rejeição <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                rows={4}
                placeholder="Explique o motivo da rejeição para o solicitante..."
                disabled={isProcessing}
              />

              <div className="flex gap-3 mt-6">
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
