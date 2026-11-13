import { API_BASE_URL, ApiError, apiRequest, parseApiError } from "./apiClient";
import { DEMO_EMAIL, DEMO_USERNAME, isDemoToken } from "./tokenService";

export interface CreateUserDTO {
  username: string;
  email: string;
  senha: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  nome?: string;
}

export async function registerUser(data: CreateUserDTO): Promise<UserResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65000);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: data.username,
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
    console.error("Erro na requisição de cadastro:", error);
    throw new ApiError(
      0,
      "Erro de conexão com o servidor. Verifique sua internet e tente novamente."
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const { message, fieldErrors } = await parseApiError(response, "cadastro");
    throw new ApiError(response.status, message, fieldErrors);
  }

  const texto = await response.text();
  return (
    texto
      ? JSON.parse(texto)
      : { id: "", username: data.username, email: data.email }
  ) as UserResponse;
}

export async function getCurrentUser(token: string): Promise<UserResponse> {
  if (isDemoToken(token)) {
    return {
      id: "demo-user-id",
      username: DEMO_USERNAME,
      email: DEMO_EMAIL,
      nome: "Usuário Demo",
    };
  }
  return apiRequest<UserResponse>("/api/v1/users/me", {}, token);
}