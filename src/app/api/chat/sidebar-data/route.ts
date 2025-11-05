//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server';

//definir variáveis de ambiente
const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || `http://localhost:21465`;
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || `jurfis`;
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || ``;

//função de GET (carregar dados do sidebar - foto de perfil e última mensagem)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get(`chatId`);
    const lastMessageId = searchParams.get(`lastMessageId`);

    if (!chatId) {
      return NextResponse.json({ success: false, error: `chatId é obrigatório` }, { status: 400 });
    }

    // Fazer requisições em paralelo com timeout curto
    const promises = [];

    // 1. Buscar foto de perfil
    promises.push(
      fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/get-profile-pic/${chatId}`, {
        method: `GET`,
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(2000) // 2 segundos max
      }).then(async response => {
        if (response.ok) {
          const profileData = await response.json();
          return { profilePic: profileData.response || null };
        }
        return { profilePic: null };
      }).catch(() => ({ profilePic: null }))
    );

    // 2. Buscar última mensagem se fornecida
    if (lastMessageId) {
      promises.push(
        fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/message-by-id/${lastMessageId}`, {
          method: `GET`,
          headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(2000) // 2 segundos max
        }).then(async response => {
          if (response.ok) {
            const lastMessageData = await response.json();
            const messageData = lastMessageData.response?.data;

            if (messageData) {
              // Detectar GIFs
              const isGif = messageData.isGif ||
                (messageData.filename && messageData.filename.toLowerCase().includes('.gif')) ||
                (messageData.mimetype && messageData.mimetype.toLowerCase().includes('gif'));
              messageData.isGif = isGif;

              return { lastMessage: messageData };
            }
          }
          return { lastMessage: null };
        }).catch(() => ({ lastMessage: null }))
      );
    } else {
      promises.push(Promise.resolve({ lastMessage: null }));
    }

    // Executar ambas as requisições em paralelo
    const [profileResult, messageResult] = await Promise.all(promises);

    return NextResponse.json({
      success: true,
      chatId,
      profilePic: profileResult.profilePic,
      lastMessage: messageResult.lastMessage
    });

  } catch (error) {
    console.error(`Erro ao carregar dados do sidebar:`, error);
    return NextResponse.json({
      success: false,
      error: `Falha ao carregar dados do sidebar`,
      details: error instanceof Error ? error.message : `Erro desconhecido.`
    }, { status: 500 });
  }
}