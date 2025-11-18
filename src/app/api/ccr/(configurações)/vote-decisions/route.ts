import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

// GET /api/ccr/vote-decisions - Lista todas as decisões de voto
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // EXTERNAL users não têm acesso a configurações
    if (session.user.role === 'EXTERNAL') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type');

    const decisions = await prismadb.sessionVoteDecision.findMany({
      where: {
        ...(isActive !== null && { isActive: isActive === 'true' }),
        ...(type && ['PRELIMINAR', 'MERITO', 'OFICIO'].includes(type) && { type: type as 'PRELIMINAR' | 'MERITO' | 'OFICIO' }),
      },
      include: {
        _count: {
          select: {
            sessionVotingResults: true,
            memberVoteDecisions: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { identifier: 'asc' },
      ],
    });

    // Adicionar flag isInUse para indicar se a decisão está sendo usada
    const decisionsWithFlag = decisions.map(decision => ({
      ...decision,
      isInUse: decision._count.sessionVotingResults > 0 || decision._count.memberVoteDecisions > 0,
    }));

    return NextResponse.json(decisionsWithFlag);
  } catch (error) {
    console.log('[VOTE_DECISIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST /api/ccr/vote-decisions - Cria uma nova decisão de voto
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // EXTERNAL users não têm acesso a configurações
    if (session.user.role === 'EXTERNAL') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { type, identifier, acceptText, rejectText, text, isActive } = body;

    if (!type || !['PRELIMINAR', 'MERITO', 'OFICIO'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo é obrigatório e deve ser PRELIMINAR, MERITO ou OFICIO' },
        { status: 400 }
      );
    }

    if (!identifier || identifier.trim() === '') {
      return NextResponse.json(
        { error: 'Identificador é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma decisão com mesmo identificador
    const existingDecision = await prismadb.sessionVoteDecision.findFirst({
      where: {
        identifier: identifier.trim(),
      },
    });

    if (existingDecision) {
      return NextResponse.json(
        { error: 'Já existe uma decisão com este identificador' },
        { status: 400 }
      );
    }

    const decision = await prismadb.sessionVoteDecision.create({
      data: {
        type,
        identifier: identifier.trim(),
        acceptText: acceptText ? acceptText.trim() : null,
        rejectText: rejectText ? rejectText.trim() : null,
        text: text ? text.trim() : null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(decision);
  } catch (error) {
    console.log('[VOTE_DECISIONS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
