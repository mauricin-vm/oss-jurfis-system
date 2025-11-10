import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';
import { canAccessSubjects, canEditSubject, canDeleteSubject } from '@/lib/permissions';

// Helper para verificar se criar ciclo na hierarquia
async function wouldCreateCycle(
  subjectId: string,
  newParentId: string | null
): Promise<boolean> {
  if (!newParentId) return false;

  // Se o novo pai é o próprio assunto, é um ciclo
  if (subjectId === newParentId) return true;

  // Buscar a hierarquia do novo pai
  let currentId: string | null = newParentId;
  while (currentId) {
    const parent: { parentId: string | null } | null = await prismadb.subject.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!parent) break;

    // Se encontrar o assunto na hierarquia, é um ciclo
    if (parent.parentId === subjectId) return true;

    currentId = parent.parentId;
  }

  return false;
}

// GET /api/ccr/subjects/[id] - Busca um assunto específico
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canAccessSubjects(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    const subject = await prismadb.subject.findUnique({
      where: {
        id,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            children: true,
            resourceLinks: true,
          },
        },
      },
    });

    if (!subject) {
      return new NextResponse('Assunto não encontrado', { status: 404 });
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.log('[SUBJECT_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT /api/ccr/subjects/[id] - Atualiza um assunto
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canEditSubject(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, parentId, isActive } = body;

    if (!name) {
      return new NextResponse('Nome é obrigatório', { status: 400 });
    }

    // Verificar se o assunto existe
    const existingSubject = await prismadb.subject.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      return new NextResponse('Assunto não encontrado', { status: 404 });
    }

    // Se está mudando o pai, verificar ciclos
    if (parentId && parentId !== existingSubject.parentId) {
      const wouldCycle = await wouldCreateCycle(id, parentId);

      if (wouldCycle) {
        return new NextResponse(
          'Não é possível criar ciclo na hierarquia de assuntos',
          { status: 400 }
        );
      }

      // Verificar se o novo pai existe
      const parentExists = await prismadb.subject.findUnique({
        where: { id: parentId },
      });

      if (!parentExists) {
        return new NextResponse('Assunto pai não encontrado', { status: 400 });
      }
    }

    const subject = await prismadb.subject.update({
      where: {
        id,
      },
      data: {
        name,
        description: description || null,
        parentId: parentId || null,
        isActive: isActive ?? true,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.log('[SUBJECT_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE /api/ccr/subjects/[id] - Remove um assunto (soft delete)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canDeleteSubject(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    // Verificar se o assunto existe
    const existingSubject = await prismadb.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            resourceLinks: true,
          },
        },
      },
    });

    if (!existingSubject) {
      return new NextResponse('Assunto não encontrado', { status: 404 });
    }

    // Verificar se tem filhos ou recursos vinculados
    if (existingSubject._count.children > 0) {
      return new NextResponse(
        'Não é possível excluir assunto com sub-itens. Remova os sub-itens primeiro.',
        { status: 400 }
      );
    }

    if (existingSubject._count.resourceLinks > 0) {
      // Soft delete - apenas desativa
      const subject = await prismadb.subject.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: 'Assunto desativado (possui recursos vinculados)',
        subject,
      });
    }

    // Se não tem vínculos, pode deletar permanentemente
    await prismadb.subject.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Assunto removido com sucesso' });
  } catch (error) {
    console.log('[SUBJECT_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
