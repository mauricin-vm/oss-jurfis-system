import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

// PATCH /api/ccr/sessions/[id]/processos/[resourceId]/votings/[votingId]/complete - Concluir votação
export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; resourceId: string; votingId: string }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: sessionId, resourceId, votingId } = await params;
    const body = await req.json();
    const {
      winningMemberId,
      qualityVoteUsed,
      qualityVoteMemberId,
      finalText,
      totalVotes,
      votesInFavor,
      votesAgainst,
      abstentions,
    } = body;

    // Validações
    if (!winningMemberId) {
      return NextResponse.json(
        { error: 'ID do membro vencedor é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a votação existe
    const voting = await prismadb.sessionVoting.findUnique({
      where: { id: votingId },
      include: {
        votes: true,
      },
    });

    if (!voting) {
      return NextResponse.json({ error: 'Votação não encontrada' }, { status: 404 });
    }

    if (voting.status === 'CONCLUIDA') {
      return NextResponse.json({ error: 'Votação já foi concluída' }, { status: 400 });
    }

    // Verificar se o membro vencedor fez parte da votação
    const winningVote = voting.votes.find((v) => v.memberId === winningMemberId);
    if (!winningVote) {
      return NextResponse.json(
        { error: 'Membro vencedor não está entre os votos desta votação' },
        { status: 400 }
      );
    }

    // Atualizar a votação
    const updatedVoting = await prismadb.sessionVoting.update({
      where: { id: votingId },
      data: {
        status: 'CONCLUIDA',
        winningVoteId: winningVote.id,
        winningMemberId,
        qualityVoteUsed,
        qualityVoteMemberId: qualityVoteUsed ? qualityVoteMemberId : null,
        finalText: finalText || null,
        totalVotes,
        votesInFavor,
        votesAgainst,
        abstentions,
      },
      include: {
        preliminarDecision: {
          select: {
            id: true,
            identifier: true,
            type: true,
          },
        },
        winningMember: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        qualityVoteMember: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        votes: {
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
        },
      },
    });

    // Adicionar label
    const votingWithLabel = {
      ...updatedVoting,
      label: updatedVoting.preliminarDecision
        ? `Não Conhecimento - ${updatedVoting.preliminarDecision.identifier}`
        : updatedVoting.votingType === 'NAO_CONHECIMENTO'
        ? 'Não Conhecimento'
        : 'Mérito',
    };

    return NextResponse.json(votingWithLabel);
  } catch (error) {
    console.log('[VOTING_COMPLETE_PATCH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
