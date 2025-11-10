import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

// Gerar número de protocolo no formato XXX/MM-YYYY
async function generateProtocolNumber(): Promise<{
  number: string;
  sequenceNumber: number;
  month: number;
  year: number;
}> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Buscar o último protocolo do mês/ano
  const lastProtocol = await prismadb.protocol.findFirst({
    where: {
      month: currentMonth,
      year: currentYear,
    },
    orderBy: {
      sequenceNumber: 'desc',
    },
  });

  const sequenceNumber = lastProtocol ? lastProtocol.sequenceNumber + 1 : 1;

  // Formatar: XXX/MM-YYYY
  const formattedSeq = sequenceNumber.toString().padStart(3, '0');
  const formattedMonth = currentMonth.toString().padStart(2, '0');
  const number = `${formattedSeq}/${formattedMonth}-${currentYear}`;

  return {
    number,
    sequenceNumber,
    month: currentMonth,
    year: currentYear,
  };
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const year = searchParams.get('year');

    const protocols = await prismadb.protocol.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(year && { year: parseInt(year) }),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parts: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            status: true,
          },
        },
        _count: {
          select: {
            tramitations: true,
            parts: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { sequenceNumber: 'desc' },
      ],
    });

    return NextResponse.json(protocols);
  } catch (error) {
    console.log('[PROTOCOLS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { processNumber, presenter } = body;

    if (!processNumber) {
      return new NextResponse('Número do processo é obrigatório', { status: 400 });
    }

    if (!presenter) {
      return new NextResponse('Apresentante é obrigatório', { status: 400 });
    }

    // Gerar número do protocolo
    const protocolNumberData = await generateProtocolNumber();

    const protocol = await prismadb.protocol.create({
      data: {
        ...protocolNumberData,
        processNumber,
        presenter,
        employeeId: session.user.id,
        status: 'PENDENTE',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            parts: true,
            tramitations: true,
          },
        },
      },
    });

    return NextResponse.json(protocol);
  } catch (error) {
    console.log('[PROTOCOLS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
