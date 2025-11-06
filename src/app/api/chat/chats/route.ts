//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server';

//definir variáveis de ambiente
const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || `http://localhost:21465`;
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || `jurfis`;
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || ``;

//tipos
interface WppChat {
  id: {
    _serialized: string;
  };
  contact?: {
    isPSA?: boolean;
  };
  isGroup?: boolean;
  tcToken?: string;
  tcTokenTimestamp?: number;
  lastReceivedKey?: {
    _serialized: string;
  } | null;
  [key: string]: unknown;
}

//função de GET (carregar chats)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get(`page`) || `1`);
    const limit = parseInt(searchParams.get(`limit`) || `20`);

    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/list-chats`, { method: `POST`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` }, body: JSON.stringify({}) });
    if (!response.ok) return NextResponse.json({ success: false, error: `Falha ao carregar chats: ${response.statusText}`, status: response.status }, { status: response.status });
    const data = await response.json();
    const chats = data.response || data || [];

    const filteredChats = chats.filter((chat: WppChat) => {
      // Filtrar PSAs
      if (chat.contact?.isPSA) return false;

      // Se for um grupo, sempre incluir (grupos não têm tcToken/tcTokenTimestamp)
      if (chat.isGroup === true) {
        return true;
      }

      // Para chats individuais, filtrar os excluídos (que não possuem tcToken e tcTokenTimestamp)
      if (!chat.hasOwnProperty('tcToken') && !chat.hasOwnProperty('tcTokenTimestamp')) {
        return false;
      }

      return true;
    });

    // Remover duplicatas baseado no ID do chat para evitar chaves duplicadas no React
    const uniqueChats = filteredChats.filter((chat: WppChat, index: number, self: WppChat[]) =>
      index === self.findIndex((c: WppChat) => c.id._serialized === chat.id._serialized)
    );

    // OTIMIZAÇÃO: Retornar apenas dados básicos dos chats, dados do sidebar serão carregados sob demanda
    const formatedResult = uniqueChats.map((chat: WppChat) => {
      return {
        ...chat,
        // Manter apenas o ID da última mensagem para carregamento posterior
        lastReceivedKey: chat.lastReceivedKey ? {
          _serialized: chat.lastReceivedKey._serialized,
          // Dados básicos para fallback se a API do sidebar falhar
          content: '[Mensagem]',
          timestamp: null
        } : null
      };
    });
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedChats = formatedResult.slice(startIndex, endIndex);
    return NextResponse.json({ success: true, chats: paginatedChats, totalChats: formatedResult.length, page, limit, totalPages: Math.ceil(formatedResult.length / limit) });
  } catch (error) {
    console.error(`Erro ao carregar chats:`, error);
    return NextResponse.json({ success: false, error: `Falha ao carregar chats`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};