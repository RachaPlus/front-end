import { API_BASE_URL, ApiError, parseApiError } from "./apiClient";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_TOKEN,
  DEMO_USERNAME,
} from "./tokenService";

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
  const emailNormalizado = data.email.trim().toLowerCase();
  if (
    (emailNormalizado === DEMO_EMAIL || emailNormalizado === "demo") &&
    (data.senha === DEMO_PASSWORD || data.senha === "demo")
  ) {
    return {
      token: DEMO_TOKEN,
      usuario: { username: DEMO_USERNAME },
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65000); // 65s timeout for Render cold start

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        senha: data.senha,
      }),
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        0,
        "Tempo limite esgotado. O servidor demorou muito para responder. Tente novamente."
      );
    }
    console.error("Erro na requisição de login:", error);
    throw new ApiError(
      0,
      "Erro de conexão com o servidor. Verifique sua internet e tente novamente."
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const { message, fieldErrors } = await parseApiError(response, "login");
    throw new ApiError(response.status, message, fieldErrors);
  }

  return response.json();
}
