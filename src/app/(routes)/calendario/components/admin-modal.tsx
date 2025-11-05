'use client'

import { useState, useEffect } from 'react';
import { Meeting, MeetingFormData } from '../types';
import { useToast } from './toast-context';

interface AdminModalProps {
  isOpen: boolean;
  meeting?: Meeting | null;
  onClose: () => void;
  onSave: (data: MeetingFormData) => void;
}

export function AdminModal({ isOpen, meeting, onClose, onSave }: AdminModalProps) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    requestedBy: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [isClosing, setIsClosing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldAnimate(false);
      // Pequeno delay para permitir a animação de entrada
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title,
        date: new Date(meeting.date).toISOString().split('T')[0],
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        requestedBy: meeting.requestedBy || '',
        email: meeting.email || '',
        phone: meeting.phone || '',
        notes: meeting.notes || ''
      });
    } else {
      setFormData({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        requestedBy: '',
        email: '',
        phone: '',
        notes: ''
      });
    }
  }, [meeting, isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setShouldAnimate(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de campos obrigatórios
    if (!formData.title.trim()) {
      addToast('Título é obrigatório', 'warning');
      return;
    }

    if (!formData.date) {
      addToast('Data é obrigatória', 'warning');
      return;
    }

    if (!formData.startTime) {
      addToast('Horário inicial é obrigatório', 'warning');
      return;
    }

    if (!formData.endTime) {
      addToast('Horário final é obrigatório', 'warning');
      return;
    }

    if (!formData.requestedBy.trim()) {
      addToast('Nome do solicitante é obrigatório', 'warning');
      return;
    }

    if (!formData.email.trim()) {
      addToast('Email é obrigatório', 'warning');
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      addToast('Email inválido', 'warning');
      return;
    }

    if (!formData.phone.trim()) {
      addToast('Telefone é obrigatório', 'warning');
      return;
    }

    // Validação de horários
    if (formData.startTime >= formData.endTime) {
      addToast('O horário final deve ser posterior ao inicial', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificar conflito de horário (excluindo a reunião atual se for edição)
      const conflictResponse = await fetch('/api/meetings/check-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          excludeMeetingId: meeting?.id // Excluir a reunião atual ao editar
        })
      });

      const conflictData = await conflictResponse.json();

      if (conflictData.hasConflict) {
        addToast(conflictData.message || 'Já existe uma reunião agendada neste horário. Por favor, escolha outro horário.', 'warning');
        setIsSubmitting(false);
        return;
      }

      // Se não há conflito, prosseguir
      onSave(formData);
    } catch (error) {
      console.error('Erro ao verificar conflito:', error);
      addToast('Erro ao verificar disponibilidade', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : shouldAnimate ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : shouldAnimate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {meeting ? 'Editar Reunião' : 'Nova Reunião'}
            </h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título (visível ao público) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Início <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Término <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solicitante <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.requestedBy}
                onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                placeholder="Nome completo do solicitante"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Verificando...' : meeting ? 'Atualizar' : 'Criar Reunião'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
