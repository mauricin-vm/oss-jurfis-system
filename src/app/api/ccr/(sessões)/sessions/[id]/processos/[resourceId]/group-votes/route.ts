import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

// GET /api/ccr/sessions/[id]/processos/[resourceId]/group-votes - Agrupar votos em votações
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

    // Buscar todos os votos ainda não vinculados a votações
    const votes = await prismadb.sessionVote.findMany({
      where: {
        sessionResourceId: sessionResource.id,
        sessionVotingId: null, // Apenas votos não vinculados
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

    // Agrupar votos por tipo
    const groupedVotings: any[] = [];

    // Grupo 1: Votos de Não Conhecimento com preliminar
    const preliminaryVotes = votes.filter(
      (v) => v.voteKnowledgeType === 'NAO_CONHECIMENTO' && v.preliminarDecisionId
    );

    // Agrupar por decisão preliminar
    const preliminaryGroups = new Map<string, typeof votes>();
    preliminaryVotes.forEach((vote) => {
      const key = vote.preliminarDecisionId!;
      if (!preliminaryGroups.has(key)) {
        preliminaryGroups.set(key, []);
      }
      preliminaryGroups.get(key)!.push(vote);
    });

    preliminaryGroups.forEach((groupVotes, preliminarDecisionId) => {
      const decision = groupVotes[0].preliminarDecision!;
      groupedVotings.push({
        votingType: 'NAO_CONHECIMENTO',
        preliminarDecisionId,
        preliminarDecision: decision,
        votes: groupVotes,
        status: 'PENDENTE',
        label: `Não Conhecimento - ${decision.identifier}`,
      });
    });

    // Grupo 2: Votos de Não Conhecimento sem preliminar (só ofício)
    const naoConhecimentoSemPreliminar = votes.filter(
      (v) => v.voteKnowledgeType === 'NAO_CONHECIMENTO' && !v.preliminarDecisionId
    );

    if (naoConhecimentoSemPreliminar.length > 0) {
      groupedVotings.push({
        votingType: 'NAO_CONHECIMENTO',
        preliminarDecisionId: null,
        preliminarDecision: null,
        votes: naoConhecimentoSemPreliminar,
        status: 'PENDENTE',
        label: 'Não Conhecimento',
      });
    }

    // Grupo 3: Votos de Conhecimento (Mérito) - TODOS em um único card
    const meritoVotes = votes.filter((v) => v.voteKnowledgeType === 'CONHECIMENTO');

    if (meritoVotes.length > 0) {
      groupedVotings.push({
        votingType: 'MERITO',
        preliminarDecisionId: null,
        preliminarDecision: null,
        votes: meritoVotes,
        status: 'PENDENTE',
        label: 'Mérito',
      });
    }

    return NextResponse.json({
      sessionResourceId: sessionResource.id,
      totalVotes: votes.length,
      groupedVotings,
    });
  } catch (error) {
    console.log('[GROUP_VOTES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST /api/ccr/sessions/[id]/processos/[resourceId]/group-votes - Criar votações a partir do agrupamento
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

    // Buscar votos não vinculados
    const votes = await prismadb.sessionVote.findMany({
      where: {
        sessionResourceId: sessionResource.id,
        sessionVotingId: null,
      },
      include: {
        preliminarDecision: true,
        meritoDecision: true,
      },
    });

    if (votes.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum voto disponível para criar votações' },
        { status: 400 }
      );
    }

    const createdVotings: any[] = [];

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
      const voting = await prismadb.sessionVoting.create({
        data: {
          sessionResourceId: sessionResource.id,
          votingType: 'NAO_CONHECIMENTO',
          preliminarDecisionId,
          status: 'PENDENTE',
        },
      });

      // Vincular votos à votação
      await prismadb.sessionVote.updateMany({
        where: {
          id: { in: groupVotes.map((v) => v.id) },
        },
        data: {
          sessionVotingId: voting.id,
        },
      });

      createdVotings.push(voting);
    }

    // Criar votação de Não Conhecimento sem preliminar
    const naoConhecimentoSemPreliminar = votes.filter(
      (v) => v.voteKnowledgeType === 'NAO_CONHECIMENTO' && !v.preliminarDecisionId
    );

    if (naoConhecimentoSemPreliminar.length > 0) {
      const voting = await prismadb.sessionVoting.create({
        data: {
          sessionResourceId: sessionResource.id,
          votingType: 'NAO_CONHECIMENTO',
          status: 'PENDENTE',
        },
      });

      await prismadb.sessionVote.updateMany({
        where: {
          id: { in: naoConhecimentoSemPreliminar.map((v) => v.id) },
        },
        data: {
          sessionVotingId: voting.id,
        },
      });

      createdVotings.push(voting);
    }

    // Criar votação de Mérito (única)
    const meritoVotes = votes.filter((v) => v.voteKnowledgeType === 'CONHECIMENTO');

    if (meritoVotes.length > 0) {
      const voting = await prismadb.sessionVoting.create({
        data: {
          sessionResourceId: sessionResource.id,
          votingType: 'MERITO',
          status: 'PENDENTE',
        },
      });

      await prismadb.sessionVote.updateMany({
        where: {
          id: { in: meritoVotes.map((v) => v.id) },
        },
        data: {
          sessionVotingId: voting.id,
        },
      });

      createdVotings.push(voting);
    }

    return NextResponse.json({
      message: `${createdVotings.length} votações criadas com sucesso`,
      votings: createdVotings,
    });
  } catch (error) {
    console.log('[GROUP_VOTES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
