'use client'

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface ConcludeModalProps {
  isOpen: boolean;
  protocolNumber: string;
  protocolId: string;
  onClose: () => void;
  onConfirm: (type: 'CONCLUIDO' | 'ARQUIVADO', justification?: string, resourceType?: 'VOLUNTARIO' | 'OFICIO') => Promise<void>;
}

export function ConcludeModal({ isOpen, protocolNumber, protocolId, onClose, onConfirm }: ConcludeModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<'CONCLUIDO' | 'ARQUIVADO' | null>(null);
  const [justification, setJustification] = useState('');
  const [resourceType, setResourceType] = useState<'VOLUNTARIO' | 'OFICIO'>('VOLUNTARIO');

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldAnimate(false);
      setIsSubmitting(false);
      setSelectedType(null);
      setJustification('');
      setResourceType('VOLUNTARIO');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    }
  }, [isOpen]);

  // Reset para VOLUNTARIO quando selecionar CONCLUIDO
  useEffect(() => {
    if (selectedType === 'CONCLUIDO') {
      setResourceType('VOLUNTARIO');
    }
  }, [selectedType]);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsClosing(true);
    setShouldAnimate(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleConfirm = async () => {
    if (!selectedType) {
      toast.error('Selecione uma opção');
      return;
    }

    if (selectedType === 'ARQUIVADO' && !justification.trim()) {
      toast.error('Justificativa é obrigatória para arquivamento');
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm(
        selectedType,
        justification.trim() || undefined,
        selectedType === 'CONCLUIDO' ? resourceType : undefined
      );
      handleClose();
    } catch (error) {
      setIsSubmitting(false);
      // Erro será tratado pelo componente pai
    }
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Concluir Protocolo</h2>
              <p className="text-sm text-gray-600 mt-1">Protocolo {protocolNumber}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Opções */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Selecione o destino do protocolo <span className="text-red-500">*</span>
              </label>

              {/* Opção 1: Concluído (vira Recurso) */}
              <div
                onClick={() => !isSubmitting && setSelectedType('CONCLUIDO')}
                className={`border-2 rounded-lg p-3.5 cursor-pointer transition-all ${selectedType === 'CONCLUIDO'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedType === 'CONCLUIDO'
                          ? 'border-gray-900 bg-gray-900'
                          : 'border-gray-300'
                        }`}
                    >
                      {selectedType === 'CONCLUIDO' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Concluir como Recurso</p>
                    <p className="text-sm text-gray-600 mt-1">
                      O protocolo será convertido em recurso e receberá um número de recurso automaticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Opção 2: Arquivado (não vira Recurso) */}
              <div
                onClick={() => !isSubmitting && setSelectedType('ARQUIVADO')}
                className={`border-2 rounded-lg p-3.5 cursor-pointer transition-all ${selectedType === 'ARQUIVADO'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedType === 'ARQUIVADO'
                          ? 'border-gray-900 bg-gray-900'
                          : 'border-gray-300'
                        }`}
                    >
                      {selectedType === 'ARQUIVADO' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Apenas Arquivar</p>
                    <p className="text-sm text-gray-600 mt-1">
                      O protocolo será arquivado sem conversão em recurso. É necessário informar uma justificativa.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipo de Recurso (aparece se CONCLUIDO) */}
            {selectedType === 'CONCLUIDO' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipo de Recurso <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between gap-6">
                    {/* Voluntário */}
                    <div
                      className="flex-1 text-center cursor-pointer"
                      onClick={() => !isSubmitting && setResourceType('VOLUNTARIO')}
                    >
                      <div className={`transition-all duration-200 ${resourceType === 'VOLUNTARIO' ? 'scale-105' : 'scale-100 opacity-60'}`}>
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors ${resourceType === 'VOLUNTARIO' ? 'bg-gray-900 text-white' : 'bg-gray-300 text-gray-600'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <p className={`text-sm font-semibold transition-colors ${resourceType === 'VOLUNTARIO' ? 'text-gray-900' : 'text-gray-500'}`}>
                          Voluntário
                        </p>
                      </div>
                    </div>

                    {/* Switch Central */}
                    <div className="flex flex-col items-center">
                      <Switch
                        checked={resourceType === 'OFICIO'}
                        onCheckedChange={(checked) => setResourceType(checked ? 'OFICIO' : 'VOLUNTARIO')}
                        disabled={isSubmitting}
                        className="data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-900"
                      />
                    </div>

                    {/* Ofício */}
                    <div
                      className="flex-1 text-center cursor-pointer"
                      onClick={() => !isSubmitting && setResourceType('OFICIO')}
                    >
                      <div className={`transition-all duration-200 ${resourceType === 'OFICIO' ? 'scale-105' : 'scale-100 opacity-60'}`}>
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors ${resourceType === 'OFICIO' ? 'bg-gray-900 text-white' : 'bg-gray-300 text-gray-600'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className={`text-sm font-semibold transition-colors ${resourceType === 'OFICIO' ? 'text-gray-900' : 'text-gray-500'}`}>
                          Ofício
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Campo de Justificativa (aparece se ARQUIVADO) */}
            {selectedType === 'ARQUIVADO' && (
              <div>
                <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Justificativa <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Informe o motivo do arquivamento..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors resize-none disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || !selectedType}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
