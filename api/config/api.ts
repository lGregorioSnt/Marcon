import Cookies from 'js-cookie';

/**
 * Um wrapper em torno da função fetch nativa que adiciona automaticamente
 * o cabeçalho de autorização com o token JWT lido dos cookies.
 * @param url O endpoint da API para o qual fazer a requisição.
 * @param options Opções de requisição padrão do fetch (method, body, etc.).
 * @returns A resposta da API em formato JSON.
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = Cookies.get('marcon_token');

  // Define os cabeçalhos padrão, incluindo o Content-Type.
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Se um token existir, adiciona ao cabeçalho de Autorização.
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Erro na requisição: ${response.statusText}` }));
    throw new Error(errorData.message || 'Ocorreu um erro desconhecido na API.');
  }

  return response.json();
};