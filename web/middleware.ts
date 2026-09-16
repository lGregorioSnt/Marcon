// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  const token = request.cookies.get('marcon_token')?.value; 
  const { pathname } = request.nextUrl;

  const isPublicPage = pathname.startsWith('/login');

  // 🛡️ Cenário 1: Usuário está logado e tenta acessar a página de login.
  // Ação: Redirecionar para a página inicial ('/').
  if (token && isPublicPage) {
    console.log("✅ Já tem token! Pulando o login e indo pra Dashboard.");
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 🛡️ Cenário 2: Usuário NÃO está logado e tenta acessar uma página protegida.
  // Ação: Redirecionar para a página de login.
  if (!token && !isPublicPage) {
    console.log("🚫 Sem token! Bloqueando acesso e mandando pro login.");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se nenhum dos cenários acima se aplicar, o acesso é permitido.
  // (Ex: usuário logado em página protegida, ou usuário não logado na página de login).
  return NextResponse.next();
}

export const config = {
  // O matcher define em quais rotas o middleware vai rodar.
  // A expressão abaixo faz com que ele rode em TODAS as rotas, exceto as que são
  // tipicamente arquivos estáticos ou rotas de API.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login.png|logo.png).*)'],
};