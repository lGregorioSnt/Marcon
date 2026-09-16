const API_URL = "http://localhost:4000/api";

// Função auxiliar para injetar o Token em todas as rotas
function getDefaultHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Pega o token que a tela de login salvou
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: getDefaultHeaders(),
  });

  if (res.status === 401) {
    // Token expirado ou inválido: Limpa a casa e expulsa pro login
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login"; 
    throw new Error(`API Error: 401 - Não autorizado`);
  }

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: getDefaultHeaders(),
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error(`API Error: 401 - Não autorizado`);
  }

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}