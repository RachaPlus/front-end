import { apiRequest } from "./apiClient";

export interface Racha {
  id: string;
  nome: string;
  descricao?: string;
  esporte: string;
  data?: string; // formato ISO: AAAA-MM-DD
  horario?: string; // HH:MM
  local?: string;
  confirmados: number;
  vagas?: number;
}

type Bruto = Record<string, unknown>;

// Pega o primeiro campo existente entre vários nomes possíveis
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

// "FUTEBOL" / "volei" / "Vôlei" → "Futebol" / "Vôlei"
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

// Converte o JSON da API para o formato usado nos cards
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

// GET /api/v1/rachas  →  lista de rachas (array ou página { content: [...] })
export async function listarRachas(token: string): Promise<Racha[]> {
  const data = await apiRequest<unknown>("/api/v1/rachas", {}, token);

  const lista = Array.isArray(data)
    ? data
    : Array.isArray((data as { content?: unknown } | undefined)?.content)
      ? (data as { content: unknown[] }).content
      : [];

  return lista.map((item) => normalizarRacha(item as Bruto));
}

// Esporte como aparece no modal → valor enviado para a API
const ESPORTE_PARA_API: Record<string, string> = {
  Futebol: "FUTEBOL",
  Basquete: "BASQUETE",
  Vôlei: "VOLEI",
};

export interface NovaRacha {
  nome: string;
  descricao?: string;
  esporte: string;
}

// POST /api/v1/rachas  →  { nome, descricao, esporte }
export async function criarRacha(
  token: string,
  dados: NovaRacha
): Promise<void> {
  await apiRequest<unknown>(
    "/api/v1/rachas",
    {
      method: "POST",
      body: JSON.stringify({
        nome: dados.nome,
        // A descrição é opcional no modal: só vai no payload se foi preenchida
        ...(dados.descricao ? { descricao: dados.descricao } : {}),
        esporte: ESPORTE_PARA_API[dados.esporte] ?? dados.esporte.toUpperCase(),
      }),
    },
    token
  );
}