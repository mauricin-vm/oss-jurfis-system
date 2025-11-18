import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

/**
 * POST /api/ccr/sessions/[id]/processos/[resourceId]/votes
 * Adiciona um voto a uma votação existente
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id: sessionId, resourceId } = await params;
    const body = await req.json();
    const {
      votingResultId,
      memberId,
      sessionId: votedInSessionId,
      voteType,
      participationStatus,
      votePosition,
      voteDecisionId,
      justification,
    } = body;

    // Validações
    if (!votingResultId || !memberId || !votedInSessionId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Verificar se votação existe
    const votingResult = await prismadb.sessionVotingResult.findUnique({
      where: { id: votingResultId },
    });

    if (!votingResult) {
      return NextResponse.json(
        { error: 'Votação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se membro já votou nesta votação
    const existingVote = await prismadb.sessionMemberVote.findUnique({
      where: {
        sessionVotingResultId_memberId: {
          sessionVotingResultId: votingResultId,
          memberId,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'Este membro já votou nesta votação' },
        { status: 400 }
      );
    }

    // Criar voto
    const vote = await prismadb.sessionMemberVote.create({
      data: {
        sessionVotingResultId: votingResultId,
        memberId,
        votedInSessionId,
        voteType: voteType || 'VOTANTE',
        participationStatus: participationStatus || 'PRESENTE',
        votePosition: votePosition || 'VOTO_PROPRIO',
        voteDecisionId: voteDecisionId || null,
        isQualityVote: false,
        justification: justification || null,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        voteDecision: true,
        votedInSession: {
          select: {
            id: true,
            sessionNumber: true,
            date: true,
          },
        },
      },
    });

    // Atualizar contadores da votação
    // (Simplificado: apenas incrementa totalVotes)
    await prismadb.sessionVotingResult.update({
      where: { id: votingResultId },
      data: {
        totalVotes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(vote);
  } catch (error) {
    console.error('Erro ao adicionar voto:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar voto' },
      { status: 500 }
    );
  }
}
