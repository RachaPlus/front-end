import { apiRequest } from "./apiClient";

export interface Racha {
  id: string;
  nome: string;
  description?: string;
  descricao?: string;
  esporte: string;
  data?: string; 
  horario?: string; 
  local?: string;
  confirmados: number;
  vagas?: number;
}

export interface MembroRacha {
  id: string;
  nome: string;
  posicao: string;
  notaInicial: number;
}

export interface SalvarMembroDTO {
  nome: string;
  posicao: string;
  notaInicial: number;
}

type Bruto = Record<string, unknown>;

function pegar(obj: Bruto, chaves: string[]): unknown {
  for (const chave of chaves) {
    const valor = obj[chave];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return undefined;
}

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

function numero(valor: unknown): number | undefined {
  return typeof valor === "number" ? valor : undefined;
}

const ESPORTES_EXIBICAO: Record<string, string> = {
  futebol: "Futebol",
  basquete: "Basquete",
  basquetebol: "Basquete",
  volei: "Vôlei",
  voleibol: "Vôlei",
};

function formatarEsporte(valor: string): string {
  const chave = valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    ESPORTES_EXIBICAO[chave] ??
    valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase()
  );
}

function normalizarRacha(bruto: Bruto): Racha {
  const dataHora = texto(
    pegar(bruto, ["dataHora", "dataHorario", "dataJogo", "data"])
  );
  let horario = texto(pegar(bruto, ["horario", "hora"]));
  let data: string | undefined;

  if (dataHora) {
    data = dataHora.slice(0, 10);
    if (!horario && dataHora.length > 10) horario = dataHora.slice(11, 16);
  }

  const participantes = bruto["participantes"];

  return {
    id: String(pegar(bruto, ["id", "uuid"]) ?? ""),
    nome: texto(pegar(bruto, ["nome", "name", "titulo"])) ?? "Racha sem nome",
    description: texto(pegar(bruto, ["description", "descricao"])),
    descricao: texto(pegar(bruto, ["descricao", "description"])),
    esporte: formatarEsporte(
      texto(pegar(bruto, ["esporte", "modalidade", "sport"])) ?? ""
    ),
    data,
    horario: horario?.slice(0, 5),
    local: texto(pegar(bruto, ["local", "localizacao", "endereco"])),
    confirmados:
      numero(
        pegar(bruto, ["confirmados", "qtdConfirmados", "totalConfirmados"])
      ) ?? (Array.isArray(participantes) ? participantes.length : 0),
    vagas: numero(
      pegar(bruto, ["vagas", "limiteJogadores", "maxJogadores", "numeroVagas"])
    ),
  };
}

export async function listarRachas(token: string): Promise<Racha[]> {
  const data = await apiRequest<unknown>("/api/v1/rachas", {}, token);

  const lista = Array.isArray(data)
    ? data
    : Array.isArray((data as { content?: unknown } | undefined)?.content)
      ? (data as { content: unknown[] }).content
      : [];

  return lista.map((item) => normalizarRacha(item as Bruto));
}

const ESPORTE_PARA_API: Record<string, string> = {
  Futebol: "FUTEBOL",
  Basquete: "BASQUETE",
  Vôlei: "VOLEI",
};

export async function criarRacha(
  token: string,
  nome: string,
  esporte: string,
  descricao?: string
): Promise<void> {
  const body: Record<string, string> = {
    nome,
    name: nome,
    esporte: ESPORTE_PARA_API[esporte] ?? esporte.toUpperCase(),
  };

  if (descricao?.trim()) {
    body.descricao = descricao.trim();
    body.description = descricao.trim();
  }

  await apiRequest<unknown>(
    "/api/v1/rachas",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    token
  );
}

export const createRacha = criarRacha;

function normalizarMembro(bruto: Bruto): MembroRacha {
  const notaBruta = pegar(bruto, ["notaInicial", "nota", "rating", "nivel"]);
  const notaConvertida =
    typeof notaBruta === "number"
      ? notaBruta
      : typeof notaBruta === "string" && !Number.isNaN(Number(notaBruta))
        ? Number(notaBruta)
        : 4;

  return {
    id: String(pegar(bruto, ["id", "memberId", "uuid"]) ?? ""),
    nome: texto(pegar(bruto, ["nome", "name", "username"])) ?? "Jogador",
    posicao: texto(pegar(bruto, ["posicao", "position"])) ?? "",
    notaInicial: notaConvertida,
  };
}

export async function obterRacha(token: string, rachaId: string): Promise<Racha> {
  const data = await apiRequest<unknown>(`/api/v1/rachas/${rachaId}`, {}, token);
  return normalizarRacha((data ?? {}) as Bruto);
}

export async function listarMembros(
  token: string,
  rachaId: string
): Promise<MembroRacha[]> {
  const data = await apiRequest<unknown>(
    `/api/v1/rachas/${rachaId}/members`,
    {},
    token
  );

  const lista = Array.isArray(data)
    ? data
    : Array.isArray((data as { content?: unknown } | undefined)?.content)
      ? (data as { content: unknown[] }).content
      : [];

  return lista.map((item) => normalizarMembro(item as Bruto));
}

export async function adicionarMembro(
  token: string,
  rachaId: string,
  dados: SalvarMembroDTO
): Promise<MembroRacha> {
  const data = await apiRequest<unknown>(
    `/api/v1/rachas/${rachaId}/members`,
    {
      method: "POST",
      body: JSON.stringify({
        nome: dados.nome,
        posicao: dados.posicao,
        notaInicial: dados.notaInicial,
      }),
    },
    token
  );

  return normalizarMembro(((data ?? dados) as unknown) as Bruto);
}

export async function atualizarMembro(
  token: string,
  rachaId: string,
  memberId: string,
  dados: SalvarMembroDTO
): Promise<MembroRacha> {
  const data = await apiRequest<unknown>(
    `/api/v1/rachas/${rachaId}/members/${memberId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        nome: dados.nome,
        posicao: dados.posicao,
        notaInicial: dados.notaInicial,
      }),
    },
    token
  );

  return normalizarMembro(((data ?? { ...dados, id: memberId }) as unknown) as Bruto);
}

export async function removerMembro(
  token: string,
  rachaId: string,
  memberId: string
): Promise<void> {
  await apiRequest<unknown>(
    `/api/v1/rachas/${rachaId}/members/${memberId}`,
    {
      method: "DELETE",
    },
    token
  );
}
