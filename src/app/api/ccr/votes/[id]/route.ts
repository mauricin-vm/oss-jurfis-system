import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    const vote = await prismadb.sessionMemberVote.findUnique({
      where: {
        id,
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
    });

    if (!vote) {
      return new NextResponse('Voto não encontrado', { status: 404 });
    }

    return NextResponse.json(vote);
  } catch (error) {
    console.log('[VOTE_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      voteType,
      participationStatus,
      votePosition,
      followsMemberId,
      isQualityVote,
      voteDecisionId,
      justification,
      observations,
    } = body;

    // Verificar se o voto existe
    const existingVote = await prismadb.sessionMemberVote.findUnique({
      where: { id },
    });

    if (!existingVote) {
      return new NextResponse('Voto não encontrado', { status: 404 });
    }

    const vote = await prismadb.sessionMemberVote.update({
      where: {
        id,
      },
      data: {
        ...(voteType && { voteType }),
        ...(participationStatus && { participationStatus }),
        votePosition: votePosition || null,
        followsMemberId: followsMemberId || null,
        ...(isQualityVote !== undefined && { isQualityVote }),
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
    });

    return NextResponse.json(vote);
  } catch (error) {
    console.log('[VOTE_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    const vote = await prismadb.sessionMemberVote.findUnique({
      where: {
        id,
      },
    });

    if (!vote) {
      return new NextResponse('Voto não encontrado', { status: 404 });
    }

    // Hard delete - votos não têm dependências
    await prismadb.sessionMemberVote.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Voto removido com sucesso' });
  } catch (error) {
    console.log('[VOTE_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
