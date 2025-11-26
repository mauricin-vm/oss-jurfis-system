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

    // Buscar sessões como atas
    const sessions = await prismadb.session.findMany({
      where: {
        ...(year && { year: parseInt(year) }),
        ...(status && { minutesStatus: status as any }),
      },
      select: {
        id: true,
        sessionNumber: true,
        sequenceNumber: true,
        year: true,
        ordinalNumber: true,
        type: true,
        date: true,
        startTime: true,
        endTime: true,
        minutesStatus: true,
        minutesFilePath: true,
        administrativeMatters: true,
        president: {
          select: {
            id: true,
            name: true,
          },
        },
        resources: {
          select: {
            id: true,
            resource: {
              select: {
                id: true,
                sessionResults: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            resources: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { sequenceNumber: 'desc' },
      ],
    });

    // Processar para verificar se todos os recursos têm resultado
    const processedSessions = sessions.map(session => {
      const allResourcesHaveResults = session.resources.length === 0 ||
        session.resources.every(sr => sr.resource.sessionResults && sr.resource.sessionResults.length > 0);

      return {
        ...session,
        resources: undefined, // Remover detalhes dos recursos
        allResourcesHaveResults,
      };
    });

    return NextResponse.json(processedSessions);
  } catch (error) {
    console.error('[MINUTES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
