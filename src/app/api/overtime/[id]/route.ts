import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Atualizar registro
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const formData = await req.formData();
    const extraHours = parseFloat(formData.get('extraHours') as string);
    const lateHours = parseFloat(formData.get('lateHours') as string);
    const file = formData.get('document') as File | null;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar registro existente
    const existingRecord = await prisma.overtimeRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return NextResponse.json({ success: false, error: 'Registro não encontrado' }, { status: 404 });
    }

    // Verificar permissão (usuário só pode editar seus próprios registros, exceto admin)
    const isAdmin = session.user.role === 'ADMIN';
    if (!isAdmin && existingRecord.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
    }

    // Calcular novo saldo
    const balance = extraHours - lateHours;

    // Upload do novo arquivo (se fornecido)
    let documentPath = existingRecord.documentPath;
    if (file) {
      const fs = await import('fs');
      const path = await import('path');

      const basePath = '\\\\10.20.3.249\\setores\\JURFIS\\Programa\\JURFIS\\Horas-Extras';
      const userFolder = path.join(basePath, user.email);

      // Criar pasta se não existir
      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
      }

      // Excluir arquivo antigo se existir
      if (existingRecord.documentPath && fs.existsSync(existingRecord.documentPath)) {
        try {
          fs.unlinkSync(existingRecord.documentPath);
        } catch (error) {
          console.error('Erro ao excluir arquivo antigo:', error);
        }
      }

      // Salvar novo arquivo
      const ext = file.name.split('.').pop();
      const fileName = `${String(existingRecord.month).padStart(2, '0')} ${existingRecord.year}.${ext}`;
      const filePath = path.join(userFolder, fileName);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      documentPath = filePath;
    }

    // Atualizar registro
    const record = await prisma.overtimeRecord.update({
      where: { id },
      data: {
        extraHours,
        lateHours,
        balance,
        documentPath
      }
    });

    // Recalcular saldos acumulados de todos os registros
    await recalculateAllBalances(user.id);

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar registro' }, { status: 500 });
  }
}

// DELETE - Deletar registro
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

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

    // Verificar permissão (usuário só pode excluir seus próprios registros, exceto admin)
    const isAdmin = session.user.role === 'ADMIN';
    if (!isAdmin && record.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
    }

    // Excluir arquivo físico se existir
    if (record.documentPath) {
      const fs = await import('fs');
      if (fs.existsSync(record.documentPath)) {
        try {
          fs.unlinkSync(record.documentPath);
        } catch (error) {
          console.error('Erro ao excluir arquivo:', error);
        }
      }
    }

    // Excluir registro
    await prisma.overtimeRecord.delete({
      where: { id }
    });

    // Recalcular saldos acumulados
    await recalculateAllBalances(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar registro:', error);
    return NextResponse.json({ success: false, error: 'Erro ao deletar registro' }, { status: 500 });
  }
}

// Função auxiliar para recalcular todos os saldos acumulados
async function recalculateAllBalances(userId: string) {
  const allRecords = await prisma.overtimeRecord.findMany({
    where: { userId },
    orderBy: [
      { year: 'asc' },
      { month: 'asc' }
    ]
  });

  let accumulatedBalance = 0;

  for (const record of allRecords) {
    accumulatedBalance += record.balance;

    if (record.accumulatedBalance !== accumulatedBalance) {
      await prisma.overtimeRecord.update({
        where: { id: record.id },
        data: { accumulatedBalance }
      });
    }
  }
}
