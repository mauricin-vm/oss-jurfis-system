/**
 * Configurações de status dos recursos
 * Define labels e estilos visuais para cada status do recurso
 */

export const RESOURCE_STATUS = {
  EM_ANALISE: {
    label: 'Em Análise',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  TEMPESTIVIDADE: {
    label: 'Tempestividade',
    color: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  CONTRARRAZAO: {
    label: 'Contrarrazão',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  PARECER_PGM: {
    label: 'Parecer PGM',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  DISTRIBUICAO: {
    label: 'Distribuição',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  NOTIFICACAO_JULGAMENTO: {
    label: 'Notificação Julgamento',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  JULGAMENTO: {
    label: 'Julgamento',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  DILIGENCIA: {
    label: 'Diligência',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  PEDIDO_VISTA: {
    label: 'Pedido de Vista',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  SUSPENSO: {
    label: 'Suspenso',
    color: 'bg-red-100 text-red-800 border-red-300',
  },
  PUBLICACAO_ACORDAO: {
    label: 'Publicação Acórdão',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  ASSINATURA_ACORDAO: {
    label: 'Assinatura Acórdão',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  NOTIFICACAO_DECISAO: {
    label: 'Notificação Decisão',
    color: 'bg-lime-100 text-lime-800 border-lime-300',
  },
  CONCLUIDO: {
    label: 'Concluído',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
} as const;

export type ResourceStatusKey = keyof typeof RESOURCE_STATUS;

/**
 * Retorna o label do status
 */
export function getResourceStatusLabel(status: ResourceStatusKey): string {
  return RESOURCE_STATUS[status]?.label || status;
}

/**
 * Retorna as classes CSS de cor do status
 */
export function getResourceStatusColor(status: ResourceStatusKey): string {
  return RESOURCE_STATUS[status]?.color || 'bg-gray-100 text-gray-800 border-gray-300';
}
