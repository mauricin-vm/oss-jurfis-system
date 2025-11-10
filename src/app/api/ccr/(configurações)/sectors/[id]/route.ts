import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';
import { canAccessSectors, canEditSector, canDeleteSector } from '@/lib/permissions';

// GET /api/ccr/sectors/[id] - Busca um setor específico
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canAccessSectors(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    const sector = await prismadb.sector.findUnique({
      where: {
        id,
      },
    });

    if (!sector) {
      return new NextResponse('Setor não encontrado', { status: 404 });
    }

    return NextResponse.json(sector);
  } catch (error) {
    console.log('[SECTOR_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT /api/ccr/sectors/[id] - Atualiza um setor
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canEditSector(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, abbreviation, dispatchCode, description, phone, email, address, isActive } = body;

    if (!name) {
      return new NextResponse('Nome é obrigatório', { status: 400 });
    }

    // Verificar se o setor existe
    const existingSector = await prismadb.sector.findUnique({
      where: { id },
    });

    if (!existingSector) {
      return new NextResponse('Setor não encontrado', { status: 404 });
    }

    const sector = await prismadb.sector.update({
      where: {
        id,
      },
      data: {
        name,
        abbreviation: abbreviation || null,
        dispatchCode: dispatchCode || null,
        description: description || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(sector);
  } catch (error) {
    console.log('[SECTOR_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE /api/ccr/sectors/[id] - Remove um setor
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canDeleteSector(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    // Verificar se o setor existe
    const existingSector = await prismadb.sector.findUnique({
      where: { id },
    });

    if (!existingSector) {
      return new NextResponse('Setor não encontrado', { status: 404 });
    }

    // Deletar permanentemente
    await prismadb.sector.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Setor removido com sucesso' });
  } catch (error) {
    console.log('[SECTOR_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
