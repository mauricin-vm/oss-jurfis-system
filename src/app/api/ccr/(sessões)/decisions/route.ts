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
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    const decisions = await prismadb.decision.findMany({
      where: {
        ...(year && { year: parseInt(year) }),
        ...(status && { status: status as any }),
      },
      include: {
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            processNumber: true,
            processName: true,
          },
        },
        publications: {
          orderBy: {
            publicationOrder: 'desc',
          },
          take: 1, // Pegar apenas a última publicação
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            publications: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { sequenceNumber: 'desc' },
      ],
    });

    return NextResponse.json(decisions);
  } catch (error) {
    console.error('[DECISIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verificar se é EXTERNAL
    if (session.user.role === 'EXTERNAL') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { resourceId, ementaTitle, ementaBody, votePath } = body;

    if (!resourceId) {
      return new NextResponse('Recurso é obrigatório', { status: 400 });
    }

    if (!ementaTitle) {
      return new NextResponse('Título da ementa é obrigatório', { status: 400 });
    }

    if (!ementaBody) {
      return new NextResponse('Corpo da ementa é obrigatório', { status: 400 });
    }

    // Verificar se o recurso existe e foi julgado
    const resource = await prismadb.resource.findUnique({
      where: { id: resourceId },
      include: {
        sessionResults: {
          take: 1,
        },
      },
    });

    if (!resource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
    }

    // Verificar se já existe acórdão para este recurso
    const existingDecision = await prismadb.decision.findFirst({
      where: { resourceId },
    });

    if (existingDecision) {
      return new NextResponse('Já existe um acórdão para este recurso', { status: 400 });
    }

    // Buscar o ano do julgamento (do resultado da sessão)
    const sessionResult = await prismadb.sessionResult.findFirst({
      where: { resourceId },
      include: {
        session: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Usar o ano do julgamento ou o ano atual
    const judgmentYear = sessionResult?.session?.year || new Date().getFullYear();

    // Buscar o último sequenceNumber para o ano do julgamento
    const lastDecision = await prismadb.decision.findFirst({
      where: { year: judgmentYear },
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    });

    const sequenceNumber = lastDecision ? lastDecision.sequenceNumber + 1 : 1;
    const decisionNumber = `${String(sequenceNumber).padStart(4, '0')}/${judgmentYear}`;

    const decision = await prismadb.decision.create({
      data: {
        decisionNumber,
        sequenceNumber,
        year: judgmentYear,
        resourceId,
        ementaTitle,
        ementaBody,
        votePath: votePath || null,
        status: 'PENDENTE',
        createdBy: session.user.id,
      },
      include: {
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            processNumber: true,
            processName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(decision);
  } catch (error) {
    console.error('[DECISIONS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
