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
    const protocolId = searchParams.get('protocolId');
    const resourceId = searchParams.get('resourceId');
    const sectorId = searchParams.get('sectorId');

    const tramitations = await prismadb.tramitation.findMany({
      where: {
        ...(protocolId && { protocolId }),
        ...(resourceId && { resourceId }),
        ...(sectorId && { sectorId }),
      },
      include: {
        protocol: {
          select: {
            id: true,
            number: true,
            processNumber: true,
          },
        },
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            year: true,
          },
        },
        sector: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tramitations);
  } catch (error) {
    console.log('[TRAMITATIONS_GET]', error);
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
      protocolId,
      resourceId,
      purpose,
      sectorId,
      memberId,
      destination,
      deadline,
      observations,
    } = body;

    // Deve ter protocolo OU recurso, mas não ambos
    if (!protocolId && !resourceId) {
      return new NextResponse(
        'É necessário fornecer protocolId ou resourceId',
        { status: 400 }
      );
    }

    if (protocolId && resourceId) {
      return new NextResponse(
        'Não é possível tramitar protocolo e recurso ao mesmo tempo',
        { status: 400 }
      );
    }

    // Validar finalidade obrigatória
    if (!purpose) {
      return new NextResponse('Finalidade da tramitação é obrigatória', { status: 400 });
    }

    // Deve ter pelo menos um destino (setor, membro ou destino texto)
    if (!sectorId && !memberId && !destination) {
      return new NextResponse('É necessário fornecer um destino (setor, membro ou descrição)', { status: 400 });
    }

    // Validar se o setor existe (se fornecido)
    if (sectorId) {
      const sector = await prismadb.sector.findUnique({
        where: { id: sectorId },
      });

      if (!sector) {
        return new NextResponse('Setor não encontrado', { status: 404 });
      }
    }

    // Validar se o membro existe (se fornecido)
    if (memberId) {
      const member = await prismadb.member.findUnique({
        where: { id: memberId },
      });

      if (!member) {
        return new NextResponse('Membro não encontrado', { status: 404 });
      }
    }

    // Validar se protocolo ou recurso existe
    if (protocolId) {
      const protocol = await prismadb.protocol.findUnique({
        where: { id: protocolId },
      });

      if (!protocol) {
        return new NextResponse('Protocolo não encontrado', { status: 404 });
      }
    }

    if (resourceId) {
      const resource = await prismadb.resource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        return new NextResponse('Recurso não encontrado', { status: 404 });
      }
    }

    const tramitation = await prismadb.tramitation.create({
      data: {
        protocolId: protocolId || null,
        resourceId: resourceId || null,
        purpose,
        sectorId: sectorId || null,
        memberId: memberId || null,
        destination: destination || null,
        deadline: deadline ? new Date(deadline) : null,
        observations: observations || null,
        createdBy: session.user.id,
      },
      include: {
        protocol: {
          select: {
            id: true,
            number: true,
            processNumber: true,
          },
        },
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            year: true,
          },
        },
        sector: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(tramitation);
  } catch (error) {
    console.log('[TRAMITATIONS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
