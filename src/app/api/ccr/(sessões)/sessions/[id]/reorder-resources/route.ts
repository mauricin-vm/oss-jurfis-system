import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

export async function PATCH(
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
    const { resourceOrders } = body as {
      resourceOrders: { id: string; order: number }[];
    };

    if (!resourceOrders || !Array.isArray(resourceOrders)) {
      return new NextResponse('Resource orders are required', { status: 400 });
    }

    // Verificar se a sessão existe
    const sessionData = await prismadb.session.findUnique({
      where: { id },
    });

    if (!sessionData) {
      return new NextResponse('Session not found', { status: 404 });
    }

    // Atualizar a ordem de cada recurso
    await Promise.all(
      resourceOrders.map((item) =>
        prismadb.sessionResource.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('[SESSION_REORDER_RESOURCES]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
