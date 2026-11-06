import { API_BASE_URL, parseResponseError } from "./apiClient";

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface UsuarioLoginDTO {
  username: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  token: string;
  usuario?: UsuarioLoginDTO;
  user?: UsuarioLoginDTO;
}

export async function loginUser(data: LoginDTO): Promise<LoginResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65000); // 65s timeout for Render cold start

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tempo limite esgotado. O servidor demorou muito para responder. Tente novamente.");
    }
    console.error("Erro na requisição de login:", error);
    throw new Error("Erro de conexão com o servidor. Verifique sua internet e tente novamente.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorMessage = await parseResponseError(response, "login");
    throw new Error(errorMessage);
  }

  return response.json();
}
