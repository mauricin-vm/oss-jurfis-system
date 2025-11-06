import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lista registros do usuário logado
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Filtros
    const where: Prisma.OvertimeRecordWhereInput = {
      userId: user.id
    };

    if (year) {
      where.year = parseInt(year);
    }

    const records = await prisma.overtimeRecord.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar registros' }, { status: 500 });
  }
}

// POST - Criar novo registro
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);
    const extraHours = parseFloat(formData.get('extraHours') as string);
    const lateHours = parseFloat(formData.get('lateHours') as string);
    const file = formData.get('document') as File | null;

    // Validações
    if (!month || !year || extraHours === undefined || lateHours === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios faltando'
      }, { status: 400 });
    }

    if (month < 1 || month > 12) {
      return NextResponse.json({
        success: false,
        error: 'Mês inválido'
      }, { status: 400 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar duplicação
    const existing = await prisma.overtimeRecord.findUnique({
      where: {
        userId_month_year: {
          userId: user.id,
          month,
          year
        }
      }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Já existe um registro para este mês/ano'
      }, { status: 400 });
    }

    // Calcular saldo mensal
    const balance = extraHours - lateHours;

    // Buscar saldo acumulado do mês anterior
    const previousRecords = await prisma.overtimeRecord.findMany({
      where: {
        userId: user.id,
        OR: [
          { year: { lt: year } },
          { year: year, month: { lt: month } }
        ]
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      take: 1
    });

    const previousBalance = previousRecords.length > 0 ? previousRecords[0].accumulatedBalance : 0;
    const accumulatedBalance = previousBalance + balance;

    // Upload do arquivo (se fornecido)
    let documentPath: string | undefined;
    if (file) {
      // Importar módulos necessários
      const fs = await import('fs');
      const path = await import('path');

      // Caminho base do servidor de rede
      const basePath = '\\\\10.20.3.249\\setores\\JURFIS\\Programa\\JURFIS\\Horas-Extras';
      const userFolder = path.join(basePath, user.email);

      // Criar pasta do usuário se não existir
      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
      }

      // Nome do arquivo: "MM YYYY.ext"
      const ext = file.name.split('.').pop();
      const fileName = `${String(month).padStart(2, '0')} ${year}.${ext}`;
      const filePath = path.join(userFolder, fileName);

      // Salvar arquivo
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      documentPath = filePath;
    }

    // Criar registro
    const record = await prisma.overtimeRecord.create({
      data: {
        userId: user.id,
        month,
        year,
        extraHours,
        lateHours,
        balance,
        accumulatedBalance,
        documentPath
      }
    });

    // Recalcular saldos acumulados de todos os registros posteriores
    await recalculateSubsequentBalances(user.id, year, month);

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Erro ao criar registro:', error);
    return NextResponse.json({ success: false, error: 'Erro ao criar registro' }, { status: 500 });
  }
}

// Função auxiliar para recalcular saldos acumulados
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function recalculateSubsequentBalances(userId: string, _fromYear: number, _fromMonth: number) {
  // Buscar todos os registros do usuário ordenados por data
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

    // Atualizar se o saldo acumulado mudou
    if (record.accumulatedBalance !== accumulatedBalance) {
      await prisma.overtimeRecord.update({
        where: { id: record.id },
        data: { accumulatedBalance }
      });
    }
  }
}
