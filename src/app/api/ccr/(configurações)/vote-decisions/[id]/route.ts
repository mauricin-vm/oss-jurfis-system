import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

// GET /api/ccr/vote-decisions/[id] - Busca uma decisão específica
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // EXTERNAL users não têm acesso a configurações
    if (session.user.role === 'EXTERNAL') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    const decision = await prismadb.sessionVoteDecision.findUnique({
      where: {
        id,
      },
    });

    if (!decision) {
      return NextResponse.json(
        { error: 'Decisão não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(decision);
  } catch (error) {
    console.log('[VOTE_DECISION_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT /api/ccr/vote-decisions/[id] - Atualiza uma decisão
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // EXTERNAL users não têm acesso a configurações
    if (session.user.role === 'EXTERNAL') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;
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

    // Verificar se a decisão existe
    const existingDecision = await prismadb.sessionVoteDecision.findUnique({
      where: { id },
    });

    if (!existingDecision) {
      return NextResponse.json(
        { error: 'Decisão não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe outra decisão com mesmo identificador
    const duplicateDecision = await prismadb.sessionVoteDecision.findFirst({
      where: {
        identifier: identifier.trim(),
        id: { not: id },
      },
    });

    if (duplicateDecision) {
      return NextResponse.json(
        { error: 'Já existe outra decisão com este identificador' },
        { status: 400 }
      );
    }

    const decision = await prismadb.sessionVoteDecision.update({
      where: {
        id,
      },
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
    console.log('[VOTE_DECISION_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE /api/ccr/vote-decisions/[id] - Remove uma decisão
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Apenas ADMIN pode deletar
    if (session.user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    // Verificar se a decisão existe
    const existingDecision = await prismadb.sessionVoteDecision.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            votePreliminarDecisions: true,
            voteMeritoDecisions: true,
            voteOficioDecisions: true,
            votingPreliminarDecisions: true,
          },
        },
      },
    });

    if (!existingDecision) {
      return NextResponse.json(
        { error: 'Decisão não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a decisão está sendo usada
    const isInUse =
      existingDecision._count.votePreliminarDecisions > 0 ||
      existingDecision._count.voteMeritoDecisions > 0 ||
      existingDecision._count.voteOficioDecisions > 0 ||
      existingDecision._count.votingPreliminarDecisions > 0;

    if (isInUse) {
      return NextResponse.json(
        { error: 'Este voto não pode ser excluído pois está sendo utilizado em votações' },
        { status: 400 }
      );
    }

    // Deletar permanentemente
    await prismadb.sessionVoteDecision.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Decisão removida com sucesso' });
  } catch (error) {
    console.log('[VOTE_DECISION_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
