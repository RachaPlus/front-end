export interface CreateRachaDTO {
  name: string;
  description?: string;
}

export interface RachaResponse {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.rachaplus.site";

export async function createRacha(data: CreateRachaDTO, token: string): Promise<RachaResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/rachas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: data.name,
        ...(data.description ? { description: data.description } : {}),
      }),
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tempo limite esgotado. O servidor demorou muito para responder. Tente novamente.");
    }
    console.error("Erro na requisição de criação de racha:", error);
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
      // Ignora erro ao decodificar JSON
    }

    if (!errorMessage) {
      if (response.status === 401) {
        errorMessage = "Sua sessão expirou. Faça login novamente.";
      } else if (response.status === 403) {
        errorMessage = "Você não tem permissão para realizar esta ação.";
      } else if (response.status === 400) {
        errorMessage = "Dados inválidos para criar o racha. Verifique os campos.";
      } else if (response.status >= 500) {
        errorMessage = "Erro interno do servidor. Tente novamente mais tarde.";
      } else {
        errorMessage = `Erro ao criar racha (código ${response.status}).`;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
