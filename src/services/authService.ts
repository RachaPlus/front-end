export interface LoginDTO {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.rachaplus.site";

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
    let errorMessage = "";

    try {
      const errorData = await response.json();
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData.message) {
        errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignora erro ao parsear JSON
    }

    if (!errorMessage) {
      if (response.status === 401 || response.status === 400 || response.status === 403) {
        errorMessage = "E-mail ou senha incorretos.";
      } else if (response.status >= 500) {
        errorMessage = "Erro interno do servidor. Tente novamente mais tarde.";
      } else {
        errorMessage = `Erro ao realizar login (${response.status}).`;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
