import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

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
    const { memberIds } = body;

    if (!Array.isArray(memberIds)) {
      return new NextResponse('memberIds deve ser um array', { status: 400 });
    }

    // Verificar se a sessão existe
    const existingSession = await prismadb.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return new NextResponse('Sessão não encontrada', { status: 404 });
    }

    // Remover todos os membros existentes
    await prismadb.sessionMember.deleteMany({
      where: {
        sessionId: id,
      },
    });

    // Adicionar os novos membros
    if (memberIds.length > 0) {
      await prismadb.sessionMember.createMany({
        data: memberIds.map((memberId: string) => ({
          sessionId: id,
          memberId,
        })),
      });
    }

    // Buscar a sessão atualizada com os membros
    const updatedSession = await prismadb.session.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            member: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.log('[SESSION_MEMBERS_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
