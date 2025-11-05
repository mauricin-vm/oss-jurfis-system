//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server';

//definir variáveis de ambiente
const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || `http://localhost:21465`;
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || `jurfis`;
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || ``;

//função de GET (carregar mensagens)
export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await params;
    const { searchParams } = new URL(request.url);

    // Parâmetros da nova API
    const count = parseInt(searchParams.get(`count`) || `20`);
    const id = searchParams.get(`id`);
    const fromMe = searchParams.get(`fromMe`) === 'true' ? true : undefined;
    const direction = searchParams.get(`direction`) as 'before' | 'after' || 'before';

    // Construir query params para a nova API
    const queryParams = new URLSearchParams();
    queryParams.append('count', count.toString());
    if (id) queryParams.append('id', id);
    if (fromMe !== undefined) queryParams.append('fromMe', fromMe.toString());
    queryParams.append('direction', direction);

    // Para carregamento inicial (sem id), queremos as mensagens mais recentes
    // Para paginação (com id), queremos mensagens anteriores ao id fornecido

    let response;
    let apiUrl;

    // Se não há ID (carregamento inicial), usar a nova API sem ID para pegar as mais recentes
    // Se há ID (paginação), usar a nova API com ID para pegar mensagens anteriores
    if (!id) {
      // Para carregamento inicial, usar a nova API sem parâmetros extras para pegar as mais recentes
      apiUrl = `${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/get-messages/${chatId}?count=${count}&direction=before`;
    } else {
      // Para paginação, usar todos os parâmetros
      apiUrl = `${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/get-messages/${chatId}?${queryParams.toString()}`;
    }

    // Adicionar timeout mais longo para chats com muitas mensagens
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    try {
      response = await fetch(apiUrl, {
        method: `GET`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEARER_TOKEN}`
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout ao carregar mensagens - muitas mensagens no chat');
      }
      throw error;
    }

    if (!response.ok) throw new Error(`Falha ao carregar mensagens do servidor wppconnect!`);

    const data = await response.json();

    console.log(data);

    // OTIMIZAÇÃO: Não carregar mídia de todas as mensagens de uma vez
    // Carregar apenas metadados das mensagens primeiro
    let formattedMessages;
    try {
      formattedMessages = data.response.map((m: any) => {
        // Detectar se é GIF baseado no mimetype/filename
        const isGif = m.isGif ||
          (m.filename && m.filename.toLowerCase().includes('.gif')) ||
          (m.mimetype && m.mimetype.toLowerCase().includes('gif'));

        return {
          id: m.id._serialized || m.id,
          chatId: chatId,
          content: m.body || m.caption || `[Mídia]`,
          type: m.type || 'text',
          timestamp: m.timestamp || 0,
          fromMe: m.fromMe || false,
          status: m.fromMe ? `delivered` : `received`,
          ack: m.ack,
          authorId: m.author || m.from,
          mediaUrl: m.mediaUrl || null,
          fileName: m.filename || null,
          mimetype: m.mimetype || null,
          vcardFormattedName: m.vcardFormattedName || null,
          caption: m.caption || null,
          body: null, // Mídia será carregada sob demanda via /api/chat/media/[messageId]
          isGif: isGif
        };
      });
    } catch (error: any) {
      console.error('Erro ao processar mensagens:', error);
      formattedMessages = [];
    }

    // Ordenar mensagens por timestamp para garantir ordem cronológica
    // Para carregamento inicial (sem id), ordenar do mais antigo para o mais novo
    // Para paginação, manter a ordem da API
    const sortedMessages = !id
      ? formattedMessages.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0))
      : formattedMessages;

    return NextResponse.json({
      success: true,
      messages: sortedMessages,
      totalMessages: sortedMessages.length,
      chatId,
      count,
      hasMore: sortedMessages.length === count, // Indica se há mais mensagens
      lastMessageId: sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].id : null,
      firstMessageId: sortedMessages.length > 0 ? sortedMessages[0].id : null
    });
  } catch (error) {
    console.error(`Erro ao carregar mensagens:`, error);
    return NextResponse.json({ success: false, error: `Falha ao carregar mensagens`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};