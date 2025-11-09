import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// GET - Visualizar/baixar documento
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar registro
    const record = await prisma.overtimeRecord.findUnique({
      where: { id }
    });

    if (!record) {
      return NextResponse.json({ success: false, error: 'Registro não encontrado' }, { status: 404 });
    }

    // Verificar permissão (usuário só pode ver seus próprios documentos, exceto admin)
    const isAdmin = session.user.role === 'ADMIN';

    // Verificar se o registro pertence à organização do usuário
    if (record.organizationId !== session.user.organizationId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
    }

    if (!isAdmin && record.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
    }

    if (!record.documentPath) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado' }, { status: 404 });
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(record.documentPath)) {
      return NextResponse.json({ success: false, error: 'Arquivo não encontrado no servidor' }, { status: 404 });
    }

    // Ler arquivo
    const fileBuffer = fs.readFileSync(record.documentPath);
    const fileName = path.basename(record.documentPath);

    // Determinar tipo de conteúdo
    const ext = path.extname(record.documentPath).toLowerCase();
    let contentType = 'application/octet-stream';

    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    }

    // Retornar arquivo
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar documento' }, { status: 500 });
  }
}
