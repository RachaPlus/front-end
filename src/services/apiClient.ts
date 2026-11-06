export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.rachaplus.site";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function parseResponseError(
  response: Response,
  contexto?: "login" | "cadastro" | "geral"
): Promise<string> {
  let rawText = "";
  try {
    rawText = await response.text();
  } catch {
    // Falha ao ler corpo da resposta
  }

  let errorMessage = "";

  if (rawText && rawText.trim()) {
    try {
      const parsed = JSON.parse(rawText);

      if (Array.isArray(parsed)) {
        const mensagens = parsed
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const obj = item as Record<string, unknown>;
              const mensagem = obj.mensagem ?? obj.message;
              const campo = obj.campo ?? obj.field;
              if (campo && mensagem) return `${campo}: ${mensagem}`;
              if (mensagem) return String(mensagem);
            }
            return JSON.stringify(item);
          })
          .filter(Boolean);

        if (mensagens.length > 0) {
          errorMessage = mensagens.join(", ");
        }
      } else if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        if (obj.mensagem) {
          errorMessage = obj.campo ? `${obj.campo}: ${obj.mensagem}` : String(obj.mensagem);
        } else if (obj.message) {
          errorMessage = Array.isArray(obj.message)
            ? obj.message.join(", ")
            : String(obj.message);
        } else if (obj.error) {
          errorMessage = String(obj.error);
        }
      } else if (typeof parsed === "string") {
        errorMessage = parsed;
      }
    } catch {
      // Texto puro retornado pelo Spring Boot (ex: status 409 ou mensagem direta)
      const textoLimpo = rawText.trim();
      if (!textoLimpo.startsWith("<html") && !textoLimpo.startsWith("<!DOCTYPE")) {
        errorMessage = textoLimpo;
      }
    }
  }

  if (!errorMessage) {
    if (contexto === "login" && (response.status === 401 || response.status === 400 || response.status === 403)) {
      errorMessage = "E-mail ou senha incorretos.";
    } else if (response.status === 409) {
      errorMessage = "Este usuário ou e-mail já está cadastrado.";
    } else if (response.status === 400) {
      errorMessage = "Dados inválidos. Verifique as informações e tente novamente.";
    } else if (response.status === 401 || response.status === 403) {
      errorMessage = "Acesso não autorizado.";
    } else if (response.status >= 500) {
      errorMessage = "Erro interno do servidor. Tente novamente mais tarde.";
    } else {
      errorMessage = `Erro ao processar requisição (${response.status}).`;
    }
  }

  return errorMessage;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65000);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        0,
        "Tempo limite esgotado. O servidor demorou muito para responder. Tente novamente."
      );
    }
    throw new ApiError(
      0,
      "Erro de conexão com o servidor. Verifique sua internet e tente novamente."
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorMessage = await parseResponseError(response, "geral");
    throw new ApiError(response.status, errorMessage);
  }

  const texto = await response.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}