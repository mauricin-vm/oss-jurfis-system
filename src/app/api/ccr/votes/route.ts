import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionVotingResultId = searchParams.get('sessionVotingResultId');
    const memberId = searchParams.get('memberId');

    const votes = await prismadb.sessionMemberVote.findMany({
      where: {
        ...(sessionVotingResultId && { sessionVotingResultId }),
        ...(memberId && { memberId }),
      },
      include: {
        sessionVotingResult: {
          include: {
            sessionResource: {
              include: {
                resource: {
                  select: {
                    id: true,
                    resourceNumber: true,
                    year: true,
                  },
                },
                session: {
                  select: {
                    id: true,
                    sessionNumber: true,
                    date: true,
                  },
                },
              },
            },
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        followsMember: {
          select: {
            id: true,
            name: true,
          },
        },
        voteDecision: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(votes);
  } catch (error) {
    console.log('[VOTES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const {
      sessionVotingResultId,
      memberId,
      voteType,
      participationStatus,
      votePosition,
      followsMemberId,
      isQualityVote,
      voteDecisionId,
      justification,
      observations,
    } = body;

    if (!sessionVotingResultId) {
      return new NextResponse('Resultado de votação é obrigatório', { status: 400 });
    }

    if (!memberId) {
      return new NextResponse('Membro votante é obrigatório', { status: 400 });
    }

    if (!voteType) {
      return new NextResponse('Tipo de voto é obrigatório', { status: 400 });
    }

    if (!participationStatus) {
      return new NextResponse('Status de participação é obrigatório', { status: 400 });
    }

    // Verificar se o sessionVotingResult existe
    const votingResult = await prismadb.sessionVotingResult.findUnique({
      where: { id: sessionVotingResultId },
    });

    if (!votingResult) {
      return new NextResponse('Resultado de votação não encontrado', { status: 404 });
    }

    // Verificar se o membro existe
    const member = await prismadb.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return new NextResponse('Membro não encontrado', { status: 404 });
    }

    // Verificar se o membro já votou neste resultado de votação
    const existingVote = await prismadb.sessionMemberVote.findUnique({
      where: {
        sessionVotingResultId_memberId: {
          sessionVotingResultId,
          memberId,
        },
      },
    });

    if (existingVote) {
      return new NextResponse(
        'Este membro já registrou voto para este resultado de votação',
        { status: 400 }
      );
    }

    const vote = await prismadb.sessionMemberVote.create({
      data: {
        sessionVotingResultId,
        memberId,
        voteType,
        participationStatus,
        votePosition: votePosition || null,
        followsMemberId: followsMemberId || null,
        isQualityVote: isQualityVote || false,
        voteDecisionId: voteDecisionId || null,
        justification: justification || null,
        observations: observations || null,
      },
      include: {
        sessionVotingResult: {
          include: {
            sessionResource: {
              include: {
                resource: {
                  select: {
                    id: true,
                    resourceNumber: true,
                    year: true,
                  },
                },
              },
            },
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        followsMember: {
          select: {
            id: true,
            name: true,
          },
        },
        voteDecision: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(vote);
  } catch (error) {
    console.log('[VOTES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
