export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.rachaplus.site";
 
export class ApiError extends Error {
  status: number;
 
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
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
    throw new ApiError(response.status, `Erro ${response.status}`);
  }
 
  const texto = await response.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}