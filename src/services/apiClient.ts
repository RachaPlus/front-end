export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.rachaplus.site";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export interface ParsedApiError {
  message: string;
  fieldErrors?: Record<string, string>;
}

export async function parseApiError(
  response: Response,
  contexto?: "login" | "cadastro" | "geral"
): Promise<ParsedApiError> {
  if (response.status >= 500) {
    return {
      message:
        "Ocorreu um erro no servidor. Tente novamente em instantes ou verifique os dados informados",
    };
  }

  if (response.status === 409) {
    return {
      message: "Este e-mail ou nome de usuário já está em uso",
    };
  }

  let rawText = "";
  try {
    rawText = await response.text();
  } catch {
    // Falha ao ler corpo da resposta
  }

  let errorMessage = "";
  const fieldErrors: Record<string, string> = {};

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
              if (campo && mensagem) {
                const campoStr = String(campo);
                const msgStr = String(mensagem);
                fieldErrors[campoStr] = fieldErrors[campoStr]
                  ? `${fieldErrors[campoStr]}; ${msgStr}`
                  : msgStr;
                return `${campoStr}: ${msgStr}`;
              }
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
          const msgStr = String(obj.mensagem);
          if (obj.campo) {
            fieldErrors[String(obj.campo)] = msgStr;
            errorMessage = `${obj.campo}: ${msgStr}`;
          } else {
            errorMessage = msgStr;
          }
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
      // Texto puro retornado pelo Spring Boot
      const textoLimpo = rawText.trim();
      if (!textoLimpo.startsWith("<html") && !textoLimpo.startsWith("<!DOCTYPE")) {
        errorMessage = textoLimpo;
      }
    }
  }

  if (!errorMessage) {
    if (
      contexto === "login" &&
      (response.status === 401 || response.status === 400 || response.status === 403)
    ) {
      errorMessage = "E-mail ou senha incorretos.";
    } else if (response.status === 400) {
      errorMessage = "Dados inválidos. Verifique as informações e tente novamente.";
    } else if (response.status === 401 || response.status === 403) {
      errorMessage = "Acesso não autorizado.";
    } else {
      errorMessage = `Erro ao processar requisição (${response.status}).`;
    }
  }

  return {
    message: errorMessage,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };
}

export async function parseResponseError(
  response: Response,
  contexto?: "login" | "cadastro" | "geral"
): Promise<string> {
  const { message } = await parseApiError(response, contexto);
  return message;
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
        Accept: "application/json",
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
    const { message, fieldErrors } = await parseApiError(response, "geral");
    throw new ApiError(response.status, message, fieldErrors);
  }

  const texto = await response.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}