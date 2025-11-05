'use client'

import { useState, useEffect, useRef } from 'react';
import { useToast } from './toast-context';
import { OvertimeFormData } from '../types';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: OvertimeFormData) => Promise<void>;
  existingRecords: Array<{ month: number; year: number }>;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function AddRecordModal({ isOpen, onClose, onSave, existingRecords }: AddRecordModalProps) {
  const { addToast } = useToast();
  const [isClosing, setIsClosing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<OvertimeFormData>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    extraHours: 0,
    lateHours: 0,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extraHoursInput, setExtraHoursInput] = useState<string>('00:00');
  const [lateHoursInput, setLateHoursInput] = useState<string>('00:00');

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldAnimate(false);
      setFormData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        extraHours: 0,
        lateHours: 0,
      });
      setSelectedFile(null);
      setExtraHoursInput('00:00');
      setLateHoursInput('00:00');
      setIsSubmitting(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    }
  }, [isOpen]);

  // Converter HH:MM para decimal
  const convertTimeToDecimal = (time: string): number => {
    const parts = time.split(':');
    if (parts.length !== 2) return 0;

    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;

    return hours + (minutes / 60);
  };

  // Validar formato HH:MM
  const isValidTimeFormat = (time: string): boolean => {
    const regex = /^([0-9]{1,3}):([0-5][0-9])$/;
    return regex.test(time);
  };

  const handleExtraHoursChange = (value: string) => {
    setExtraHoursInput(value);
    if (isValidTimeFormat(value)) {
      setFormData({ ...formData, extraHours: convertTimeToDecimal(value) });
    }
  };

  const handleLateHoursChange = (value: string) => {
    setLateHoursInput(value);
    if (isValidTimeFormat(value)) {
      setFormData({ ...formData, lateHours: convertTimeToDecimal(value) });
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsClosing(true);
    setShouldAnimate(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        addToast('Arquivo muito grande. Tamanho máximo: 10MB', 'error');
        return;
      }

      // Validar tipo
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        addToast('Tipo de arquivo inválido. Use PDF, PNG ou JPG', 'error');
        return;
      }

      setSelectedFile(file);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.month || !formData.year) {
      addToast('Mês e ano são obrigatórios', 'warning');
      return false;
    }

    // Verificar se não é mês futuro
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (formData.year > currentYear || (formData.year === currentYear && formData.month > currentMonth)) {
      addToast('Não é possível adicionar registros de meses futuros', 'warning');
      return false;
    }

    // Verificar duplicação
    const isDuplicate = existingRecords.some(
      record => record.month === formData.month && record.year === formData.year
    );
    if (isDuplicate) {
      addToast(`Já existe um registro para ${monthNames[formData.month - 1]}/${formData.year}`, 'warning');
      return false;
    }

    // Validar formato de horas extras
    if (!isValidTimeFormat(extraHoursInput)) {
      addToast('Formato inválido para Horas Extras. Use HH:MM (ex: 01:30)', 'warning');
      return false;
    }

    // Validar formato de horas de atraso
    if (!isValidTimeFormat(lateHoursInput)) {
      addToast('Formato inválido para Horas de Atraso. Use HH:MM (ex: 00:15)', 'warning');
      return false;
    }

    if (formData.extraHours < 0 || formData.lateHours < 0) {
      addToast('Horas não podem ser negativas', 'warning');
      return false;
    }

    if (!selectedFile) {
      addToast('É obrigatório anexar o documento da folha de ponto', 'warning');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSave({
        ...formData,
        document: selectedFile || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setIsSubmitting(false);
    }
  };

  // Converter decimal para HH:MM
  const convertDecimalToTime = (decimal: number): string => {
    const isNegative = decimal < 0;
    const absDecimal = Math.abs(decimal);
    const hours = Math.floor(absDecimal);
    const minutes = Math.round((absDecimal - hours) * 60);
    return `${isNegative ? '-' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Calcular saldo com base nos inputs válidos
  const extraDecimal = isValidTimeFormat(extraHoursInput) ? convertTimeToDecimal(extraHoursInput) : 0;
  const lateDecimal = isValidTimeFormat(lateHoursInput) ? convertTimeToDecimal(lateHoursInput) : 0;
  const calculatedBalance = extraDecimal - lateDecimal;
  const balanceColor = calculatedBalance >= 0 ? 'text-green-600' : 'text-red-600';
  const balanceFormatted = convertDecimalToTime(calculatedBalance);

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
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Novo Registro Mensal</h2>
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

          <form onSubmit={handleSubmit}>
            {/* Mês e Ano */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer"
                  disabled={isSubmitting}
                >
                  {monthNames.map((name, index) => (
                    <option key={index + 1} value={index + 1}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  min={2020}
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Horas Extras e Atrasos */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horas Extras <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={extraHoursInput}
                  onChange={(e) => handleExtraHoursChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="00:00"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horas de Atraso <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={lateHoursInput}
                  onChange={(e) => handleLateHoursChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="00:00"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Saldo Calculado */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 mb-1">Saldo Mensal (calculado):</p>
              <p className={`text-2xl font-bold ${balanceColor}`}>
                {calculatedBalance >= 0 ? '+' : ''}{balanceFormatted}
              </p>
            </div>

            {/* Upload de Documento */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folha de Ponto (PDF/Imagem) <span className="text-red-600">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
                disabled={isSubmitting}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                >
                  Escolher Arquivo
                </button>
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate max-w-xs">{selectedFile.name}</span>
                    <span className="text-gray-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Formatos aceitos: PDF, PNG, JPG (máx. 10MB)
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
