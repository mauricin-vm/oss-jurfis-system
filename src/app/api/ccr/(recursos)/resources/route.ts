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
    const status = searchParams.get('status');
    const year = searchParams.get('year');
    const type = searchParams.get('type');

    const resources = await prismadb.resource.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(year && { year: parseInt(year) }),
        ...(type && { type: type as any }),
      },
      include: {
        protocol: {
          select: {
            id: true,
            number: true,
            processNumber: true,
            presenter: true,
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                parentId: true,
              },
            },
          },
        },
        _count: {
          select: {
            documents: true,
            sessions: true,
            registrations: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { sequenceNumber: 'desc' },
      ],
    });

    // Buscar as partes de cada recurso via processNumber
    const resourcesWithParts = await Promise.all(
      resources.map(async (resource) => {
        const parts = await prismadb.part.findMany({
          where: {
            processNumber: resource.processNumber,
          },
          select: {
            id: true,
            name: true,
            role: true,
            registrationType: true,
            registrationNumber: true,
          },
        });

        return {
          ...resource,
          parts,
        };
      })
    );

    return NextResponse.json(resourcesWithParts);
  } catch (error) {
    console.log('[RESOURCES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
