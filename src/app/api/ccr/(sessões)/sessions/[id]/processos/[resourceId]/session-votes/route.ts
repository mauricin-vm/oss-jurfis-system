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
    const sessionResource = await prismadb.sessionResource.findUnique({
      where: {
        id: resourceId,
      },
    });

    if (!sessionResource || sessionResource.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Processo não encontrado na sessão' },
        { status: 404 }
      );
    }

    // Verificar se já existe voto duplicado
    // Para não conhecimento: verificar se já existe voto com a mesma preliminar (ou ambos sem preliminar)
    // Para conhecimento (mérito): só pode ter um voto por membro
    if (voteKnowledgeType === 'CONHECIMENTO') {
      const existingVote = await prismadb.sessionVote.findFirst({
        where: {
          sessionResourceId: sessionResource.id,
          memberId,
          voteKnowledgeType: 'CONHECIMENTO',
        },
      });

      if (existingVote) {
        return NextResponse.json(
          { error: 'Este membro já possui um voto de mérito registrado para este processo' },
          { status: 400 }
        );
      }
    } else {
      // Para não conhecimento, verificar se já existe voto com a mesma preliminar
      const existingVote = await prismadb.sessionVote.findFirst({
        where: {
          sessionResourceId: sessionResource.id,
          memberId,
          voteKnowledgeType: 'NAO_CONHECIMENTO',
          preliminarDecisionId: preliminarDecisionId || null,
        },
      });

      if (existingVote) {
        return NextResponse.json(
          { error: 'Este membro já possui um voto registrado com esta preliminar para este processo' },
          { status: 400 }
        );
      }
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

    // Atualizar lista de revisores se for um revisor
    if (voteType === 'REVISOR') {
      const distribution = await prismadb.sessionDistribution.findFirst({
        where: {
          resourceId: sessionResource.resourceId,
          sessionId,
          isActive: true,
        },
      });

      if (distribution && !distribution.reviewersIds.includes(memberId)) {
        await prismadb.sessionDistribution.update({
          where: { id: distribution.id },
          data: {
            reviewersIds: [...distribution.reviewersIds, memberId],
          },
        });
      }
    }

    // Agrupar votos automaticamente após criar o voto
    await autoGroupVotes(sessionResource.id);

    return NextResponse.json(vote);
  } catch (error) {
    console.log('[SESSION_VOTES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// Função auxiliar para agrupar votos automaticamente
async function autoGroupVotes(sessionResourceId: string) {
  try {
    // Buscar votos não vinculados
    const votes = await prismadb.sessionVote.findMany({
      where: {
        sessionResourceId,
        sessionVotingId: null,
      },
      include: {
        preliminarDecision: true,
        meritoDecision: true,
      },
    });

    if (votes.length === 0) {
      return;
    }

    // Criar votações de Não Conhecimento com preliminar
    const preliminaryVotes = votes.filter(
      (v) => v.voteKnowledgeType === 'NAO_CONHECIMENTO' && v.preliminarDecisionId
    );

    const preliminaryGroups = new Map<string, typeof votes>();
    preliminaryVotes.forEach((vote) => {
      const key = vote.preliminarDecisionId!;
      if (!preliminaryGroups.has(key)) {
        preliminaryGroups.set(key, []);
      }
      preliminaryGroups.get(key)!.push(vote);
    });

    for (const [preliminarDecisionId, groupVotes] of preliminaryGroups) {
      // Verificar se já existe uma votação para esta preliminar
      const existingVoting = await prismadb.sessionVoting.findFirst({
        where: {
          sessionResourceId,
          votingType: 'NAO_CONHECIMENTO',
          preliminarDecisionId,
          status: 'PENDENTE',
        },
      });

      let votingId: string;

      if (existingVoting) {
        votingId = existingVoting.id;
      } else {
        const voting = await prismadb.sessionVoting.create({
          data: {
            sessionResourceId,
            votingType: 'NAO_CONHECIMENTO',
            preliminarDecisionId,
            status: 'PENDENTE',
          },
        });
        votingId = voting.id;
      }

      // Vincular votos à votação
      await prismadb.sessionVote.updateMany({
        where: {
          id: { in: groupVotes.map((v) => v.id) },
        },
        data: {
          sessionVotingId: votingId,
        },
      });
    }

    // Criar votação de Não Conhecimento sem preliminar
    const naoConhecimentoSemPreliminar = votes.filter(
      (v) => v.voteKnowledgeType === 'NAO_CONHECIMENTO' && !v.preliminarDecisionId
    );

    if (naoConhecimentoSemPreliminar.length > 0) {
      const existingVoting = await prismadb.sessionVoting.findFirst({
        where: {
          sessionResourceId,
          votingType: 'NAO_CONHECIMENTO',
          preliminarDecisionId: null,
          status: 'PENDENTE',
        },
      });

      let votingId: string;

      if (existingVoting) {
        votingId = existingVoting.id;
      } else {
        const voting = await prismadb.sessionVoting.create({
          data: {
            sessionResourceId,
            votingType: 'NAO_CONHECIMENTO',
            status: 'PENDENTE',
          },
        });
        votingId = voting.id;
      }

      await prismadb.sessionVote.updateMany({
        where: {
          id: { in: naoConhecimentoSemPreliminar.map((v) => v.id) },
        },
        data: {
          sessionVotingId: votingId,
        },
      });
    }

    // Criar votação de Mérito (única)
    const meritoVotes = votes.filter((v) => v.voteKnowledgeType === 'CONHECIMENTO');

    if (meritoVotes.length > 0) {
      const existingVoting = await prismadb.sessionVoting.findFirst({
        where: {
          sessionResourceId,
          votingType: 'MERITO',
          status: 'PENDENTE',
        },
      });

      let votingId: string;

      if (existingVoting) {
        votingId = existingVoting.id;
      } else {
        const voting = await prismadb.sessionVoting.create({
          data: {
            sessionResourceId,
            votingType: 'MERITO',
            status: 'PENDENTE',
          },
        });
        votingId = voting.id;
      }

      await prismadb.sessionVote.updateMany({
        where: {
          id: { in: meritoVotes.map((v) => v.id) },
        },
        data: {
          sessionVotingId: votingId,
        },
      });
    }
  } catch (error) {
    console.log('[AUTO_GROUP_VOTES_ERROR]', error);
    // Não propagar o erro para não quebrar o fluxo de criação do voto
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
    const sessionResource = await prismadb.sessionResource.findUnique({
      where: {
        id: resourceId,
      },
    });

    if (!sessionResource || sessionResource.sessionId !== sessionId) {
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
