import { apiRequest } from "./apiClient";

export interface Racha {
  id: string;
  nome: string;
  esporte: string;
  data?: string; 
  horario?: string; 
  local?: string;
  confirmados: number;
  vagas?: number;
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
  esporte: string
): Promise<void> {
  await apiRequest<unknown>(
    "/api/v1/rachas",
    {
      method: "POST",
      body: JSON.stringify({
        nome,
        esporte: ESPORTE_PARA_API[esporte] ?? esporte.toUpperCase(),
      }),
    },
    token
  );
}
