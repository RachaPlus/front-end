import { apiRequest, ApiError } from "./apiClient";

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

export interface MembroRacha {
  id: string;
  nome: string;
  posicao: string;
  notaInicial: number;
  userId?: string;
  username?: string;
}

export interface SalvarMembroDTO {
  nome: string;
  posicao: string;
  notaInicial: number;
}

export interface TimeEquilibradoAPI {
  id: number;
  nome: string;
  mediaOvr: number;
  jogadores: MembroRacha[];
}

export interface ResultadoEquilibrioTimes {
  times: TimeEquilibradoAPI[];
  deFora: MembroRacha[];
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
  const body: Record<string, string> = {
    nome: dados.nome,
    name: dados.nome,
    esporte: ESPORTE_PARA_API[dados.esporte] ?? dados.esporte.toUpperCase(),
  };

  if (dados.descricao?.trim()) {
    body.descricao = dados.descricao.trim();
    body.description = dados.descricao.trim();
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
  const notaBruta = pegar(bruto, [
    "ovr",
    "mediaAvaliacao",
    "notaMedia",
    "notaAtual",
    "notaInicial",
    "nota",
    "rating",
    "nivel",
  ]);
  const notaConvertida =
    typeof notaBruta === "number"
      ? Number(notaBruta.toFixed(1))
      : typeof notaBruta === "string" && !Number.isNaN(Number(notaBruta))
        ? Number(Number(notaBruta).toFixed(1))
        : 4;

  const usuarioObj =
    bruto["usuario"] && typeof bruto["usuario"] === "object"
      ? (bruto["usuario"] as Bruto)
      : bruto["user"] && typeof bruto["user"] === "object"
        ? (bruto["user"] as Bruto)
        : undefined;

  const userIdBruto =
    pegar(bruto, ["userId", "usuarioId"]) ??
    (usuarioObj ? pegar(usuarioObj, ["id", "uuid"]) : undefined);
  const usernameBruto =
    pegar(bruto, ["username"]) ??
    (usuarioObj ? pegar(usuarioObj, ["username", "nome"]) : undefined);

  return {
    id: String(pegar(bruto, ["id", "memberId", "membroId", "uuid"]) ?? ""),
    nome: texto(pegar(bruto, ["nome", "name", "username"])) ?? "Jogador",
    posicao: texto(pegar(bruto, ["posicao", "position"])) ?? "",
    notaInicial: notaConvertida,
    userId: userIdBruto !== undefined ? String(userIdBruto) : undefined,
    username: texto(usernameBruto),
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

export async function avaliarMembro(
  token: string,
  rachaId: string,
  memberId: string,
  nota: number
): Promise<number> {
  const payload = JSON.stringify({
    nota,
    rating: nota,
    valor: nota,
    estrelas: nota,
  });

  const rotasTentativa = [
    `/api/v1/rachas/${rachaId}/members/${memberId}/avaliacoes`,
    `/api/v1/rachas/${rachaId}/members/${memberId}/ratings`,
    `/api/v1/rachas/${rachaId}/members/${memberId}/avaliar`,
  ];

  let ultimoErro: unknown;

  for (const rota of rotasTentativa) {
    try {
      const data = await apiRequest<unknown>(
        rota,
        {
          method: "POST",
          body: payload,
        },
        token
      );

      if (typeof data === "number") {
        return Number(data.toFixed(1));
      }

      if (data && typeof data === "object") {
        const obj = data as Bruto;
        const ovrBruto = pegar(obj, [
          "ovr",
          "novaMedia",
          "mediaAvaliacao",
          "notaMedia",
          "notaAtual",
          "notaInicial",
          "media",
          "nota",
          "rating",
        ]);
        if (typeof ovrBruto === "number") {
          return Number(ovrBruto.toFixed(1));
        }
        if (typeof ovrBruto === "string" && !Number.isNaN(Number(ovrBruto))) {
          return Number(Number(ovrBruto).toFixed(1));
        }
      }

      return Number(nota.toFixed(1));
    } catch (erro) {
      ultimoErro = erro;
      // Se a rota específica retornar 404, tenta a próxima variação
      if (erro instanceof ApiError && erro.status === 404) {
        continue;
      }
      throw erro;
    }
  }

  throw ultimoErro ?? new Error("Não foi possível registrar a avaliação.");
}

export async function equilibrarTimes(
  token: string,
  rachaId: string,
  memberIds: string[],
  jogadoresPorTime: number
): Promise<ResultadoEquilibrioTimes> {
  const data = await apiRequest<unknown>(
    `/api/v1/rachas/${rachaId}/equilibrar-times`,
    {
      method: "POST",
      body: JSON.stringify({
        memberIds,
        membrosIds: memberIds,
        jogadoresIds: memberIds,
        playerIds: memberIds,
        jogadoresConfirmadosIds: memberIds,
        jogadoresPorTime,
        tamanhoTime: jogadoresPorTime,
        playersPerTeam: jogadoresPorTime,
      }),
    },
    token
  );

  const obj = (data && typeof data === "object" ? data : {}) as Bruto;

  const timesBrutos =
    pegar(obj, ["times", "teams", "equipes"]) ??
    (Array.isArray(data) ? data : []);
  const listaTimes = Array.isArray(timesBrutos) ? timesBrutos : [];

  const times: TimeEquilibradoAPI[] = listaTimes.map((item, idx) => {
    const tObj = (item && typeof item === "object" ? item : {}) as Bruto;
    const jogadoresBrutos =
      pegar(tObj, ["jogadores", "membros", "players", "integrantes"]) ?? [];
    const jogadores = Array.isArray(jogadoresBrutos)
      ? jogadoresBrutos.map((j) => normalizarMembro(j as Bruto))
      : [];

    const mediaBruta = pegar(tObj, [
      "media",
      "mediaOvr",
      "ovrMedio",
      "avgRating",
      "mediaNota",
    ]);
    let mediaOvr =
      typeof mediaBruta === "number"
        ? Number(mediaBruta.toFixed(1))
        : typeof mediaBruta === "string" && !Number.isNaN(Number(mediaBruta))
          ? Number(Number(mediaBruta).toFixed(1))
          : 0;

    if (!mediaOvr && jogadores.length > 0) {
      const soma = jogadores.reduce((acc, j) => acc + j.notaInicial, 0);
      mediaOvr = Number((soma / jogadores.length).toFixed(1));
    }

    return {
      id: numero(pegar(tObj, ["id", "numero"])) ?? idx + 1,
      nome:
        texto(pegar(tObj, ["nome", "name", "titulo"])) ?? `Time ${idx + 1}`,
      mediaOvr,
      jogadores,
    };
  });

  const deForaBruto =
    pegar(obj, [
      "deFora",
      "reservas",
      "sobra",
      "excedentes",
      "jogadoresDeFora",
      "semTime",
      "bench",
      "out",
    ]) ?? [];
  const deFora = Array.isArray(deForaBruto)
    ? deForaBruto.map((j) => normalizarMembro(j as Bruto))
    : [];

  return { times, deFora };
}
