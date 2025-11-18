import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

/**
 * GET /api/ccr/sessions/[id]/processos/[resourceId]/presenca
 * Busca as partes do processo e as presenças já registradas
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id, resourceId } = await params;

    // Buscar o sessionResource
    const sessionResource = await prismadb.sessionResource.findUnique({
      where: { id: resourceId },
      include: {
        resource: {
          include: {
            protocol: {
              include: {
                parts: {
                  include: {
                    part: {
                      include: {
                        contacts: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        attendances: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            part: true,
          },
        },
      },
    });

    if (!sessionResource) {
      return new NextResponse('Recurso de sessão não encontrado', { status: 404 });
    }

    // Extrair as partes do protocolo (opcionais para adicionar rapidamente)
    const availableParts = sessionResource.resource.protocol?.parts.map(pp => pp.part) || [];

    return NextResponse.json({
      sessionResource: {
        id: sessionResource.id,
        resource: {
          id: sessionResource.resource.id,
          processNumber: sessionResource.resource.processNumber,
          processName: sessionResource.resource.processName,
        },
      },
      availableParts, // Partes disponíveis no sistema para seleção rápida
      attendances: sessionResource.attendances, // Presenças já registradas
    });
  } catch (error) {
    console.log('[SESSION_RESOURCE_ATTENDANCE_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

/**
 * PUT /api/ccr/sessions/[id]/processos/[resourceId]/presenca
 * Salva as presenças das partes
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { resourceId } = await params;
    const body = await req.json();
    const { attendances } = body as {
      attendances: Array<{
        id?: string; // Se já existe
        partId?: string; // Se for parte cadastrada
        customName?: string; // Se for pessoa não cadastrada
        customRole?: string; // Se for pessoa não cadastrada
      }>;
    };

    if (!Array.isArray(attendances)) {
      return new NextResponse('attendances deve ser um array', { status: 400 });
    }

    // Verificar se o sessionResource existe
    const sessionResource = await prismadb.sessionResource.findUnique({
      where: { id: resourceId },
    });

    if (!sessionResource) {
      return new NextResponse('Recurso de sessão não encontrado', { status: 404 });
    }

    // Deletar todas as presenças antigas
    await prismadb.sessionResourceAttendance.deleteMany({
      where: {
        sessionResourceId: resourceId,
      },
    });

    // Criar as novas presenças
    if (attendances.length > 0) {
      await prismadb.sessionResourceAttendance.createMany({
        data: attendances.map(attendance => ({
          sessionResourceId: resourceId,
          partId: attendance.partId || null,
          customName: attendance.customName || null,
          customRole: attendance.customRole || null,
        })),
      });
    }

    // Reordenar a pauta: processos com presença vêm primeiro
    const sessionId = sessionResource.sessionId;

    // Buscar todos os recursos da sessão
    const allSessionResources = await prismadb.sessionResource.findMany({
      where: {
        sessionId,
      },
      include: {
        attendances: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Separar em dois grupos: com presença e sem presença
    const withAttendance: typeof allSessionResources = [];
    const withoutAttendance: typeof allSessionResources = [];

    for (const resource of allSessionResources) {
      if (resource.attendances.length > 0) {
        withAttendance.push(resource);
      } else {
        withoutAttendance.push(resource);
      }
    }

    // Concatenar: processos com presença primeiro, depois os sem presença
    const reorderedResources = [...withAttendance, ...withoutAttendance];

    // Atualizar a ordem de cada recurso
    for (let i = 0; i < reorderedResources.length; i++) {
      await prismadb.sessionResource.update({
        where: { id: reorderedResources[i].id },
        data: { order: i + 1 },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('[SESSION_RESOURCE_ATTENDANCE_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
