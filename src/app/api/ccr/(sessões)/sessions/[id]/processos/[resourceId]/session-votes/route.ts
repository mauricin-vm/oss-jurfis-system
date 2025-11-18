import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

// POST /api/ccr/sessions/[id]/processos/[resourceId]/session-votes - Criar novo voto individual
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: sessionId, resourceId } = await params;
    const body = await req.json();
    const {
      memberId,
      voteType,
      voteKnowledgeType,
      preliminarDecisionId,
      meritoDecisionId,
      oficioDecisionId,
      voteText,
    } = body;

    // Validações
    if (!memberId || !voteType || !voteKnowledgeType || !voteText) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: memberId, voteType, voteKnowledgeType, voteText' },
        { status: 400 }
      );
    }

    if (voteKnowledgeType === 'CONHECIMENTO' && !meritoDecisionId) {
      return NextResponse.json(
        { error: 'Decisão de mérito é obrigatória para votos de conhecimento' },
        { status: 400 }
      );
    }

    // Verificar se o SessionResource existe
    const sessionResource = await prismadb.sessionResource.findFirst({
      where: {
        resourceId,
        sessionId,
      },
    });

    if (!sessionResource) {
      return NextResponse.json(
        { error: 'Processo não encontrado na sessão' },
        { status: 404 }
      );
    }

    // Verificar se já existe voto deste membro com este tipo de conhecimento
    const existingVote = await prismadb.sessionVote.findFirst({
      where: {
        sessionResourceId: sessionResource.id,
        memberId,
        voteKnowledgeType,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'Este membro já possui um voto registrado deste tipo para este processo' },
        { status: 400 }
      );
    }

    // Criar o voto
    const vote = await prismadb.sessionVote.create({
      data: {
        sessionResourceId: sessionResource.id,
        memberId,
        sessionId,
        voteType,
        participationStatus: 'PRESENTE',
        voteKnowledgeType,
        preliminarDecisionId: preliminarDecisionId || null,
        meritoDecisionId: meritoDecisionId || null,
        oficioDecisionId: oficioDecisionId || null,
        voteText,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        preliminarDecision: {
          select: {
            id: true,
            identifier: true,
          },
        },
        meritoDecision: {
          select: {
            id: true,
            identifier: true,
          },
        },
        oficioDecision: {
          select: {
            id: true,
            identifier: true,
          },
        },
      },
    });

    return NextResponse.json(vote);
  } catch (error) {
    console.log('[SESSION_VOTES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// GET /api/ccr/sessions/[id]/processos/[resourceId]/session-votes - Listar votos do processo
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: sessionId, resourceId } = await params;

    // Buscar o SessionResource
    const sessionResource = await prismadb.sessionResource.findFirst({
      where: {
        resourceId,
        sessionId,
      },
    });

    if (!sessionResource) {
      return NextResponse.json(
        { error: 'Processo não encontrado na sessão' },
        { status: 404 }
      );
    }

    // Buscar votos
    const votes = await prismadb.sessionVote.findMany({
      where: {
        sessionResourceId: sessionResource.id,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        preliminarDecision: {
          select: {
            id: true,
            identifier: true,
            type: true,
          },
        },
        meritoDecision: {
          select: {
            id: true,
            identifier: true,
            type: true,
          },
        },
        oficioDecision: {
          select: {
            id: true,
            identifier: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(votes);
  } catch (error) {
    console.log('[SESSION_VOTES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
