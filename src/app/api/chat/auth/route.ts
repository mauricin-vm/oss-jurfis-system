import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    // Validação simples (em produção usar autenticação real)
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Verificar se o usuário é válido (mock)
    const validUsers = {
      'admin': 'admin123',
      'atendente': 'atendente123'
    };

    if (validUsers[username as keyof typeof validUsers] !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Gerar token simples (em produção usar JWT)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      token,
      user: {
        username,
        role: username === 'admin' ? 'admin' : 'operator'
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}