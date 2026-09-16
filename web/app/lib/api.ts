import Cookies from "js-cookie";

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("marcon_token") || Cookies.get("marcon_token")
      : null;

  if (!token) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sem token");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      Cookies.remove("marcon_token", { path: '/' });
      localStorage.removeItem("marcon_token");
      localStorage.removeItem("marcon_user");
      window.location.href = "/login";
    }
    throw new Error("Sessão expirada");
  }

  if (!response.ok) {
    // Handle HTTP errors (e.g., 500 Internal Server Error)
    const errorBody = await response.text().catch(() => 'Could not read error body.');
    try {
      // Attempt to parse a JSON error message from the backend
      const errorJson = JSON.parse(errorBody);
      throw new Error(errorJson.message || errorJson.error || `API Error: ${response.statusText}`);
    } catch {
      // If the error response is not JSON, throw a more generic error.
      throw new Error(`Server error (status ${response.status}): ${errorBody}`);
    }
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("A resposta da API não é um JSON válido.");
  }
};