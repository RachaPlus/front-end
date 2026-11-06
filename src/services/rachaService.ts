import { apiRequest, ApiError } from "./apiClient";
import { DEMO_USERNAME, isDemoToken } from "./tokenService";

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

// ── Dados e Persistência Local para Modo Demo ──
const DEMO_RACHAS_KEY = "rachaplus:demo:rachas";
const DEMO_MEMBERS_PREFIX = "rachaplus:demo:members:";

const DEMO_DEFAULT_RACHAS: Racha[] = [
  {
    id: "demo-futebol-1",
    nome: "Pelada de Sexta",
    descricao: "Society semanal na Arena Parque",
    esporte: "Futebol",
    data: "2026-11-13",
    horario: "19:30",
    local: "Arena Parque",
    confirmados: 14,
    vagas: 14,
  },
  {
    id: "demo-basquete-2",
    nome: "Basquete de Domingo",
    descricao: "Rachão 5x5 meia quadra e quadra toda",
    esporte: "Basquete",
    data: "2026-11-15",
    horario: "09:00",
    local: "Ginásio Central",
    confirmados: 10,
    vagas: 12,
  },
  {
    id: "demo-volei-3",
    nome: "Vôlei de Quarta",
    descricao: "Vôlei misto 6x6",
    esporte: "Vôlei",
    data: "2026-11-11",
    horario: "20:00",
    local: "Quadra Beira-Mar",
    confirmados: 12,
    vagas: 18,
  },
];

function gerarMembrosIniciaisDemo(esporte: string): MembroRacha[] {
  const chave = esporte.toLowerCase();
  if (chave.includes("basquet")) {
    return [
      { id: "m-b1", nome: DEMO_USERNAME, posicao: "Armador", notaInicial: 4.5, userId: "demo-user-id", username: DEMO_USERNAME },
      { id: "m-b2", nome: "Lucas", posicao: "Ala", notaInicial: 4.0 },
      { id: "m-b3", nome: "Mateus", posicao: "Pivô", notaInicial: 4.5 },
      { id: "m-b4", nome: "Rafael", posicao: "Armador", notaInicial: 5.0 },
      { id: "m-b5", nome: "Gabriel", posicao: "Ala", notaInicial: 3.5 },
      { id: "m-b6", nome: "Pedro", posicao: "Pivô", notaInicial: 4.0 },
      { id: "m-b7", nome: "Bruno", posicao: "Ala", notaInicial: 3.5 },
      { id: "m-b8", nome: "Thiago", posicao: "Armador", notaInicial: 4.0 },
      { id: "m-b9", nome: "Diego", posicao: "Ala", notaInicial: 4.5 },
      { id: "m-b10", nome: "Gustavo", posicao: "Pivô", notaInicial: 3.5 },
    ];
  }
  if (chave.includes("volei") || chave.includes("vôlei")) {
    return [
      { id: "m-v1", nome: DEMO_USERNAME, posicao: "Levantador", notaInicial: 4.5, userId: "demo-user-id", username: DEMO_USERNAME },
      { id: "m-v2", nome: "André", posicao: "Ponteiro", notaInicial: 4.0 },
      { id: "m-v3", nome: "Carlos", posicao: "Central", notaInicial: 4.5 },
      { id: "m-v4", nome: "Rodrigo", posicao: "Oposto", notaInicial: 5.0 },
      { id: "m-v5", nome: "Marcos", posicao: "Líbero", notaInicial: 4.0 },
      { id: "m-v6", nome: "Vitor", posicao: "Ponteiro", notaInicial: 3.5 },
      { id: "m-v7", nome: "Henrique", posicao: "Levantador", notaInicial: 4.0 },
      { id: "m-v8", nome: "Caio", posicao: "Central", notaInicial: 4.0 },
      { id: "m-v9", nome: "Leonardo", posicao: "Oposto", notaInicial: 4.5 },
      { id: "m-v10", nome: "Daniel", posicao: "Líbero", notaInicial: 3.5 },
      { id: "m-v11", nome: "Igor", posicao: "Ponteiro", notaInicial: 4.0 },
      { id: "m-v12", nome: "Renan", posicao: "Central", notaInicial: 3.5 },
    ];
  }
  return [
    { id: "m-f1", nome: DEMO_USERNAME, posicao: "Meio-Campista", notaInicial: 4.5, userId: "demo-user-id", username: DEMO_USERNAME },
    { id: "m-f2", nome: "Carlos", posicao: "Atacante", notaInicial: 4.0 },
    { id: "m-f3", nome: "Bruno", posicao: "Zagueiro", notaInicial: 3.5 },
    { id: "m-f4", nome: "Gabriel", posicao: "Goleiro", notaInicial: 4.5 },
    { id: "m-f5", nome: "Ricardo", posicao: "Goleiro", notaInicial: 4.0 },
    { id: "m-f6", nome: "Fernando", posicao: "Meio-Campista", notaInicial: 4.0 },
    { id: "m-f7", nome: "Lucas", posicao: "Atacante", notaInicial: 4.5 },
    { id: "m-f8", nome: "Matheus", posicao: "Zagueiro", notaInicial: 4.0 },
    { id: "m-f9", nome: "Diego", posicao: "Meio-Campista", notaInicial: 3.5 },
    { id: "m-f10", nome: "Rafael", posicao: "Atacante", notaInicial: 5.0 },
    { id: "m-f11", nome: "Gustavo", posicao: "Zagueiro", notaInicial: 3.5 },
    { id: "m-f12", nome: "Thiago", posicao: "Meio-Campista", notaInicial: 4.0 },
    { id: "m-f13", nome: "Felipe", posicao: "Atacante", notaInicial: 4.0 },
    { id: "m-f14", nome: "Leonardo", posicao: "Zagueiro", notaInicial: 3.0 },
  ];
}

function obterRachasDemo(): Racha[] {
  if (typeof window === "undefined") return DEMO_DEFAULT_RACHAS;
  try {
    const salvo = localStorage.getItem(DEMO_RACHAS_KEY);
    if (salvo) return JSON.parse(salvo) as Racha[];
  } catch {
    // ignore
  }
  localStorage.setItem(DEMO_RACHAS_KEY, JSON.stringify(DEMO_DEFAULT_RACHAS));
  return DEMO_DEFAULT_RACHAS;
}

function salvarRachasDemo(rachas: Racha[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_RACHAS_KEY, JSON.stringify(rachas));
}

function obterMembrosDemo(rachaId: string): MembroRacha[] {
  if (typeof window === "undefined") return [];
  const chave = `${DEMO_MEMBERS_PREFIX}${rachaId}`;
  try {
    const salvo = localStorage.getItem(chave);
    if (salvo) return JSON.parse(salvo) as MembroRacha[];
  } catch {
    // ignore
  }
  const racha = obterRachasDemo().find((r) => r.id === rachaId);
  const iniciais = gerarMembrosIniciaisDemo(racha?.esporte ?? "Futebol");
  localStorage.setItem(chave, JSON.stringify(iniciais));
  return iniciais;
}

function salvarMembrosDemo(rachaId: string, membros: MembroRacha[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${DEMO_MEMBERS_PREFIX}${rachaId}`, JSON.stringify(membros));
  const rachas = obterRachasDemo().map((r) =>
    r.id === rachaId ? { ...r, confirmados: membros.length } : r
  );
  salvarRachasDemo(rachas);
}

// GET /api/v1/rachas  →  lista de rachas (array ou página { content: [...] })
export async function listarRachas(token: string): Promise<Racha[]> {
  if (isDemoToken(token)) {
    return obterRachasDemo();
  }

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
  if (isDemoToken(token)) {
    const esporteFormatado = formatarEsporte(dados.esporte);
    const novoId = `demo-${Date.now()}`;
    const membrosIniciais = gerarMembrosIniciaisDemo(esporteFormatado);
    const nova: Racha = {
      id: novoId,
      nome: dados.nome,
      descricao: dados.descricao?.trim() || undefined,
      esporte: esporteFormatado,
      confirmados: membrosIniciais.length,
    };
    const atuais = obterRachasDemo();
    salvarRachasDemo([nova, ...atuais]);
    salvarMembrosDemo(novoId, membrosIniciais);
    return;
  }

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
  if (isDemoToken(token)) {
    const encontrado = obterRachasDemo().find((r) => r.id === rachaId);
    return (
      encontrado ?? {
        id: rachaId,
        nome: "Racha Demo",
        esporte: "Futebol",
        confirmados: 0,
      }
    );
  }

  const data = await apiRequest<unknown>(`/api/v1/rachas/${rachaId}`, {}, token);
  return normalizarRacha((data ?? {}) as Bruto);
}

export async function listarMembros(
  token: string,
  rachaId: string
): Promise<MembroRacha[]> {
  if (isDemoToken(token)) {
    return obterMembrosDemo(rachaId);
  }

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
  if (isDemoToken(token)) {
    const novo: MembroRacha = {
      id: `m-${Date.now()}`,
      nome: dados.nome,
      posicao: dados.posicao,
      notaInicial: Number(dados.notaInicial.toFixed(1)),
    };
    const atuais = obterMembrosDemo(rachaId);
    salvarMembrosDemo(rachaId, [...atuais, novo]);
    return novo;
  }

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
  if (isDemoToken(token)) {
    const atuais = obterMembrosDemo(rachaId);
    const atualizado: MembroRacha = {
      id: memberId,
      nome: dados.nome,
      posicao: dados.posicao,
      notaInicial: Number(dados.notaInicial.toFixed(1)),
    };
    salvarMembrosDemo(
      rachaId,
      atuais.map((m) => (m.id === memberId ? { ...m, ...atualizado } : m))
    );
    return atualizado;
  }

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
  if (isDemoToken(token)) {
    const atuais = obterMembrosDemo(rachaId);
    salvarMembrosDemo(
      rachaId,
      atuais.filter((m) => m.id !== memberId)
    );
    return;
  }

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
  if (isDemoToken(token)) {
    const atuais = obterMembrosDemo(rachaId);
    let novoOvr = Number(nota.toFixed(1));
    const atualizados = atuais.map((m) => {
      if (m.id !== memberId) return m;
      novoOvr = Number(((m.notaInicial + nota) / 2).toFixed(1));
      return { ...m, notaInicial: novoOvr };
    });
    salvarMembrosDemo(rachaId, atualizados);
    return novoOvr;
  }

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
  if (isDemoToken(token)) {
    const todos = obterMembrosDemo(rachaId);
    const setIds = new Set(memberIds);
    const confirmados = todos.filter((m) => setIds.has(m.id));
    const qtdTimes = Math.max(2, Math.floor(confirmados.length / jogadoresPorTime));
    const capacidadeTotal = qtdTimes * jogadoresPorTime;

    const ordenados = [...confirmados].sort(
      (a, b) => b.notaInicial - a.notaInicial
    );
    const entram = ordenados.slice(0, capacidadeTotal);
    const deFora = ordenados.slice(capacidadeTotal);

    const buckets: MembroRacha[][] = Array.from({ length: qtdTimes }, () => []);
    entram.forEach((jogador) => {
      let menorIdx = 0;
      let menorSoma = Infinity;
      buckets.forEach((b, idx) => {
        if (b.length >= jogadoresPorTime) return;
        const soma = b.reduce((acc, item) => acc + item.notaInicial, 0);
        if (soma < menorSoma) {
          menorSoma = soma;
          menorIdx = idx;
        }
      });
      buckets[menorIdx].push(jogador);
    });

    const times: TimeEquilibradoAPI[] = buckets.map((jogadores, idx) => {
      const soma = jogadores.reduce((acc, j) => acc + j.notaInicial, 0);
      const mediaOvr =
        jogadores.length > 0 ? Number((soma / jogadores.length).toFixed(1)) : 0;
      return {
        id: idx + 1,
        nome: `Time ${idx + 1}`,
        mediaOvr,
        jogadores,
      };
    });

    return { times, deFora };
  }

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
