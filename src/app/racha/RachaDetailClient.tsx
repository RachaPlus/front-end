"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken, clearToken } from "../../services/tokenService";
import { ApiError } from "../../services/apiClient";
import {
  obterRacha,
  listarMembros,
  adicionarMembro,
  atualizarMembro,
  removerMembro,
  type MembroRacha,
} from "../../services/rachaService";
import styles from "./page.module.css";

export type EsporteChave = "FUTEBOL" | "BASQUETE" | "VOLEI";

export interface Player {
  id: string;
  name: string;
  position: string;
  rating: number; // 1 to 5
  confirmed: boolean;
}

export interface Team {
  id: number;
  name: string;
  color: string;
  players: Player[];
  avgRating: number;
}

const FORMATOS_POR_ESPORTE: Record<
  EsporteChave,
  { opcoes: string[]; padrao: string }
> = {
  FUTEBOL: { opcoes: ["5x5", "6x6", "7x7", "8x8", "11x11"], padrao: "7x7" },
  BASQUETE: { opcoes: ["2x2", "3x3", "4x4", "5x5"], padrao: "5x5" },
  VOLEI: { opcoes: ["2x2", "4x4", "5x5", "6x6"], padrao: "6x6" },
};

const POSICOES_POR_ESPORTE: Record<EsporteChave, string[]> = {
  FUTEBOL: ["Goleiro", "Zagueiro", "Meio-Campista", "Atacante"],
  BASQUETE: ["Armador", "Ala", "Pivô"],
  VOLEI: ["Levantador", "Ponteiro", "Central", "Oposto", "Líbero"],
};

function identificarEsporte(esporteBruto?: string): EsporteChave {
  const limpo = (esporteBruto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (limpo.includes("basquet")) return "BASQUETE";
  if (limpo.includes("volei")) return "VOLEI";
  return "FUTEBOL";
}

function membroParaPlayer(m: MembroRacha, confirmed = true): Player {
  return {
    id: m.id,
    name: m.nome,
    position: m.posicao || "Meio-Campista",
    rating: m.notaInicial,
    confirmed,
  };
}

export default function RachaDetailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rachaId = searchParams.get("id") || "";

  // Racha state
  const [rachaNome, setRachaNome] = useState("Carregando...");
  const [esporteChave, setEsporteChave] = useState<EsporteChave>("FUTEBOL");
  const [carregandoDados, setCarregandoDados] = useState(true);

  // Players & Teams state
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("7x7");
  const [teams, setTeams] = useState<Team[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form state for add/edit player
  const [formName, setFormName] = useState("");
  const [formPosition, setFormPosition] = useState<string>("Goleiro");
  const [formRating, setFormRating] = useState<number>(4);
  const [salvandoJogador, setSalvandoJogador] = useState(false);
  const [erroModal, setErroModal] = useState("");

  const formatOptions = FORMATOS_POR_ESPORTE[esporteChave].opcoes;
  const posicoesDisponiveis = POSICOES_POR_ESPORTE[esporteChave];

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Load racha details and members from API
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!rachaId) {
      router.replace("/menu");
      return;
    }

    let cancelado = false;
    setCarregandoDados(true);

    Promise.all([obterRacha(token, rachaId), listarMembros(token, rachaId)])
      .then(([dadosRacha, listaMembros]) => {
        if (cancelado) return;
        const chave = identificarEsporte(dadosRacha.esporte);
        setRachaNome(dadosRacha.nome || "Detalhes do Racha");
        setEsporteChave(chave);
        setSelectedFormat(FORMATOS_POR_ESPORTE[chave].padrao);
        setPlayers(
          listaMembros.map((m) => ({
            id: m.id,
            name: m.nome,
            position: m.posicao || POSICOES_POR_ESPORTE[chave][0],
            rating: m.notaInicial,
            confirmed: true,
          }))
        );
      })
      .catch((falha) => {
        if (cancelado) return;
        if (
          falha instanceof ApiError &&
          (falha.status === 401 || falha.status === 403)
        ) {
          clearToken();
          router.replace("/login");
          return;
        }
        showToast(
          falha instanceof Error
            ? falha.message
            : "Não foi possível carregar os dados do racha."
        );
      })
      .finally(() => {
        if (!cancelado) setCarregandoDados(false);
      });

    return () => {
      cancelado = true;
    };
  }, [rachaId, router, showToast]);

  const confirmedCount = useMemo(
    () => players.filter((p) => p.confirmed).length,
    [players]
  );
  const totalCount = players.length;

  // Toggle player confirmed state (local attendance control)
  const toggleConfirmed = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, confirmed: !p.confirmed } : p))
    );
  };

  // Open add player modal
  const openAddModal = () => {
    setFormName("");
    setFormPosition(posicoesDisponiveis[0]);
    setFormRating(4);
    setErroModal("");
    setShowAddModal(true);
  };

  // Save new player via POST /api/v1/rachas/{id}/members
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = formName.trim();
    if (!nomeLimpo || salvandoJogador) return;

    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setSalvandoJogador(true);
    setErroModal("");

    try {
      const criado = await adicionarMembro(token, rachaId, {
        nome: nomeLimpo,
        posicao: formPosition,
        notaInicial: Number(formRating),
      });

      if (criado.id) {
        const novoJogador = membroParaPlayer(
          {
            id: criado.id,
            nome: criado.nome || nomeLimpo,
            posicao: criado.posicao || formPosition,
            notaInicial: criado.notaInicial ?? Number(formRating),
          },
          true
        );
        setPlayers((prev) => [...prev, novoJogador]);
      } else {
        const atualizados = await listarMembros(token, rachaId);
        setPlayers((prev) => {
          const mapaConfirmados = new Map(prev.map((p) => [p.id, p.confirmed]));
          return atualizados.map((m) =>
            membroParaPlayer(m, mapaConfirmados.get(m.id) ?? true)
          );
        });
      }

      setShowAddModal(false);
      showToast(`Jogador "${nomeLimpo}" adicionado com sucesso!`);
    } catch (falha) {
      if (
        falha instanceof ApiError &&
        (falha.status === 401 || falha.status === 403)
      ) {
        clearToken();
        router.replace("/login");
        return;
      }
      setErroModal(
        falha instanceof Error
          ? falha.message
          : "Não foi possível adicionar o jogador."
      );
    } finally {
      setSalvandoJogador(false);
    }
  };

  // Open edit modal
  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFormName(player.name);
    setFormPosition(
      posicoesDisponiveis.includes(player.position)
        ? player.position
        : posicoesDisponiveis[0]
    );
    setFormRating(player.rating);
    setErroModal("");
    setShowEditModal(true);
  };

  // Save edited player via PUT /api/v1/rachas/{id}/members/{memberId}
  const handleEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = formName.trim();
    if (!editingPlayer || !nomeLimpo || salvandoJogador) return;

    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setSalvandoJogador(true);
    setErroModal("");

    try {
      const atualizado = await atualizarMembro(
        token,
        rachaId,
        editingPlayer.id,
        {
          nome: nomeLimpo,
          posicao: formPosition,
          notaInicial: Number(formRating),
        }
      );

      const novoNome = atualizado.nome || nomeLimpo;
      const novaPosicao = atualizado.posicao || formPosition;
      const novaNota = atualizado.notaInicial ?? Number(formRating);

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === editingPlayer.id
            ? {
                ...p,
                name: novoNome,
                position: novaPosicao,
                rating: novaNota,
              }
            : p
        )
      );

      // Update inside formed teams if any
      setTeams((prev) =>
        prev.map((team) => {
          const updatedPlayers = team.players.map((tp) =>
            tp.id === editingPlayer.id
              ? { ...tp, name: novoNome, position: novaPosicao, rating: novaNota }
              : tp
          );
          const totalRating = updatedPlayers.reduce((acc, p) => acc + p.rating, 0);
          const avg =
            updatedPlayers.length > 0
              ? Number((totalRating / updatedPlayers.length).toFixed(1))
              : 0;
          return { ...team, players: updatedPlayers, avgRating: avg };
        })
      );

      setShowEditModal(false);
      setEditingPlayer(null);
      showToast(`Jogador "${novoNome}" atualizado!`);
    } catch (falha) {
      if (
        falha instanceof ApiError &&
        (falha.status === 401 || falha.status === 403)
      ) {
        clearToken();
        router.replace("/login");
        return;
      }
      setErroModal(
        falha instanceof Error
          ? falha.message
          : "Não foi possível atualizar o jogador."
      );
    } finally {
      setSalvandoJogador(false);
    }
  };

  // Delete player via DELETE /api/v1/rachas/{id}/members/{memberId}
  const handleDeletePlayer = async (player: Player) => {
    if (salvandoJogador) return;

    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setSalvandoJogador(true);
    setErroModal("");

    try {
      await removerMembro(token, rachaId, player.id);

      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
      setTeams((prev) =>
        prev.map((team) => {
          const remaining = team.players.filter((tp) => tp.id !== player.id);
          const totalRating = remaining.reduce((acc, p) => acc + p.rating, 0);
          const avg =
            remaining.length > 0
              ? Number((totalRating / remaining.length).toFixed(1))
              : 0;
          return { ...team, players: remaining, avgRating: avg };
        })
      );

      if (showEditModal && editingPlayer?.id === player.id) {
        setShowEditModal(false);
        setEditingPlayer(null);
      }

      showToast(`Jogador "${player.name}" removido!`);
    } catch (falha) {
      if (
        falha instanceof ApiError &&
        (falha.status === 401 || falha.status === 403)
      ) {
        clearToken();
        router.replace("/login");
        return;
      }
      const msg =
        falha instanceof Error
          ? falha.message
          : "Não foi possível remover o jogador.";
      if (showEditModal) {
        setErroModal(msg);
      } else {
        showToast(msg);
      }
    } finally {
      setSalvandoJogador(false);
    }
  };

  // Team drawer algorithm
  const handleFormarTimes = () => {
    const activePlayers = players.filter((p) => p.confirmed);
    if (activePlayers.length < 2) {
      showToast(
        "Selecione pelo menos 2 jogadores confirmados para formar os times."
      );
      return;
    }

    // Determine target size per team based on format (5x5 -> 5, 7x7 -> 7, etc)
    const perTeam = parseInt(selectedFormat.split("x")[0], 10) || 5;
    const numTeams = Math.max(2, Math.ceil(activePlayers.length / perTeam));

    // Separate goalkeepers/liberos from field players for balanced distribution
    const especialistas = activePlayers.filter(
      (p) => p.position === "Goleiro" || p.position === "Líbero"
    );
    const linha = activePlayers.filter(
      (p) => p.position !== "Goleiro" && p.position !== "Líbero"
    );

    const shuffleArray = <T,>(arr: T[]): T[] =>
      [...arr].sort(() => Math.random() - 0.5);

    const sortedLinha = shuffleArray(linha).sort((a, b) => b.rating - a.rating);
    const shuffledEspecialistas = shuffleArray(especialistas);

    // Initialize team buckets
    const teamBuckets: Player[][] = Array.from({ length: numTeams }, () => []);

    // Distribute goalkeepers/liberos evenly
    shuffledEspecialistas.forEach((esp, idx) => {
      teamBuckets[idx % numTeams].push(esp);
    });

    // Snake draft distribution for field players to balance total rating
    sortedLinha.forEach((player) => {
      let minScoreIdx = 0;
      let minScore = Infinity;

      teamBuckets.forEach((bucket, idx) => {
        const bucketScore = bucket.reduce((sum, p) => sum + p.rating, 0);
        if (bucketScore < minScore) {
          minScore = bucketScore;
          minScoreIdx = idx;
        }
      });

      teamBuckets[minScoreIdx].push(player);
    });

    const colors = [
      "#34d35a",
      "#3b82f6",
      "#f59e0b",
      "#ec4899",
      "#8b5cf6",
      "#06b6d4",
    ];
    const teamNames = [
      "Time Verde",
      "Time Azul",
      "Time Amarelo",
      "Time Rosa",
      "Time Roxo",
      "Time Ciano",
    ];

    const generatedTeams: Team[] = teamBuckets.map((plist, idx) => {
      const totalRating = plist.reduce((acc, p) => acc + p.rating, 0);
      const avg =
        plist.length > 0
          ? Number((totalRating / plist.length).toFixed(1))
          : 0;
      return {
        id: idx + 1,
        name: teamNames[idx % teamNames.length] || `Time ${idx + 1}`,
        color: colors[idx % colors.length],
        players: plist,
        avgRating: avg,
      };
    });

    setTeams(generatedTeams);
    showToast("Times formados e balanceados com sucesso!");
  };

  // Copy teams formatted for WhatsApp
  const handleCopyTeams = () => {
    if (teams.length === 0) return;

    const emojiEsporte =
      esporteChave === "BASQUETE"
        ? "🏀"
        : esporteChave === "VOLEI"
          ? "🏐"
          : "⚽";

    let text = `${emojiEsporte} *${rachaNome.toUpperCase()} - TIMES FORMADOS (${selectedFormat})*\n\n`;
    teams.forEach((t) => {
      text += `🛡️ *${t.name.toUpperCase()}* (Média: ${t.avgRating}★)\n`;
      t.players.forEach((p) => {
        const icon = p.position === "Goleiro" ? "🧤" : "👟";
        text += `${icon} ${p.name} (${p.position}) - ${p.rating}★\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    showToast("Times copiados no formato WhatsApp!");
  };

  // Copy link
  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link do racha copiado para a área de transferência!");
    }
  };

  // Render position badge with styled background & color
  const renderPositionBadge = (pos: string) => {
    switch (pos) {
      case "Goleiro":
      case "Pivô":
      case "Oposto":
        return (
          <span className={`${styles.posBadge} ${styles.posAmber}`}>{pos}</span>
        );
      case "Zagueiro":
      case "Ala":
      case "Central":
      case "Líbero":
        return (
          <span className={`${styles.posBadge} ${styles.posBlue}`}>{pos}</span>
        );
      case "Atacante":
      case "Ponteiro":
        return (
          <span className={`${styles.posBadge} ${styles.posPink}`}>{pos}</span>
        );
      case "Meio-Campista":
      case "Armador":
      case "Levantador":
      default:
        return (
          <span className={`${styles.posBadge} ${styles.posGreen}`}>{pos}</span>
        );
    }
  };

  // Render rating stars (1-5 with half star support)
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="#facc15"
            stroke="none"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (rating >= i - 0.5) {
        stars.push(
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id={`half-star-${i}`}>
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#374151" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#half-star-${i})`}
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        );
      } else {
        stars.push(
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="#374151"
            stroke="none"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }
    return <div className={styles.starRating}>{stars}</div>;
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

      {/* ── Top Header Navigation Bar ── */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <Link
            href="/menu"
            className={styles.backBtn}
            aria-label="Voltar para o Menu"
            id="racha-back-btn"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.rachaTitle}>{rachaNome}</h1>
            <span className={styles.rachaSubtitle}>
              {confirmedCount}/{totalCount} Confirmados
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Action Toolbar Icons (Ranking & Cronômetro ocultos nesta sprint) */}
          <div className={styles.toolbarIcons}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleShareLink}
              title="Compartilhar Racha"
              aria-label="Compartilhar Racha"
              id="btn-share-racha"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>

          {/* Dynamic format selector pills */}
          <div
            className={styles.formatSelector}
            role="radiogroup"
            aria-label="Selecione o formato do racha"
          >
            {formatOptions.map((fmt) => (
              <button
                key={fmt}
                type="button"
                className={`${styles.formatPill} ${
                  selectedFormat === fmt ? styles.formatPillActive : ""
                }`}
                onClick={() => setSelectedFormat(fmt)}
                id={`format-pill-${fmt}`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Content Grid (Jogadores vs Times) ── */}
      <main className={styles.mainGrid}>
        {/* Left Column: Jogadores */}
        <section
          className={styles.columnSection}
          aria-labelledby="jogadores-heading"
        >
          <div className={styles.sectionHeader}>
            <h2 id="jogadores-heading" className={styles.columnTitle}>
              Jogadores
            </h2>
            <button
              type="button"
              className={styles.btnPrimaryGreen}
              onClick={openAddModal}
              id="btn-adicionar-jogador"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Adicionar
            </button>
          </div>

          <div className={styles.playersList}>
            {carregandoDados ? (
              <div className={styles.emptyPlayersText}>
                Carregando jogadores...
              </div>
            ) : players.length === 0 ? (
              <div className={styles.emptyPlayersText}>
                Nenhum jogador cadastrado ainda. Clique em{" "}
                <strong>Adicionar</strong> para incluir o primeiro!
              </div>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  className={`${styles.playerCard} ${
                    !player.confirmed ? styles.playerCardUnconfirmed : ""
                  }`}
                  id={`player-card-${player.id}`}
                >
                  {/* Attendance toggle checkbox */}
                  <button
                    type="button"
                    className={`${styles.checkCircleBtn} ${
                      player.confirmed ? styles.checkCircleActive : ""
                    }`}
                    onClick={() => toggleConfirmed(player.id)}
                    title={
                      player.confirmed
                        ? "Desmarcar presença"
                        : "Confirmar presença"
                    }
                    aria-label={`Confirmar presença de ${player.name}`}
                    id={`check-player-${player.id}`}
                  >
                    {player.confirmed && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Avatar initial circle */}
                  <div className={styles.playerAvatar}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Player details */}
                  <div className={styles.playerInfo}>
                    <div className={styles.playerNameRow}>
                      <span className={styles.playerName}>{player.name}</span>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => openEditModal(player)}
                        title="Editar jogador"
                        aria-label={`Editar ${player.name}`}
                        id={`edit-player-${player.id}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleDeletePlayer(player)}
                        disabled={salvandoJogador}
                        title="Excluir jogador"
                        aria-label={`Excluir ${player.name}`}
                        id={`delete-player-${player.id}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                    {renderPositionBadge(player.position)}
                  </div>

                  {/* Star rating on the right */}
                  <div className={styles.playerRatingRight}>
                    {renderStars(player.rating)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Times */}
        <section
          className={styles.columnSection}
          aria-labelledby="times-heading"
        >
          <div className={styles.sectionHeader}>
            <h2 id="times-heading" className={styles.columnTitle}>
              Times
            </h2>
            <div className={styles.timesHeaderActions}>
              {teams.length > 0 && (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleCopyTeams}
                  id="btn-copiar-whatsapp"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copiar WhatsApp
                </button>
              )}
              <button
                type="button"
                className={styles.btnPrimaryGreen}
                onClick={handleFormarTimes}
                id="btn-formar-times"
              >
                Formar Times
              </button>
            </div>
          </div>

          {/* Teams container view */}
          {teams.length === 0 ? (
            <div className={styles.emptyStateBox} id="times-empty-state">
              <div className={styles.emptyStateIconCircle}>
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8a9a8a"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <p className={styles.emptyStateText}>
                Selecione os jogadores e clique em{" "}
                <span className={styles.emptyHighlight}>Formar Times</span> para
                balancear os times automaticamente
              </p>
            </div>
          ) : (
            <div className={styles.teamsGrid}>
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={styles.teamCard}
                  id={`team-card-${team.id}`}
                >
                  <div
                    className={styles.teamCardHeader}
                    style={{ borderLeftColor: team.color }}
                  >
                    <div className={styles.teamTitleRow}>
                      <span
                        className={styles.teamBadgeDot}
                        style={{ backgroundColor: team.color }}
                      />
                      <h3 className={styles.teamName}>{team.name}</h3>
                    </div>
                    <span className={styles.teamAvgRating}>
                      Média: {team.avgRating} ★
                    </span>
                  </div>

                  <div className={styles.teamPlayersList}>
                    {team.players.map((tp) => (
                      <div key={tp.id} className={styles.teamPlayerItem}>
                        <div className={styles.teamPlayerAvatar}>
                          {tp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.teamPlayerName}>{tp.name}</span>
                        {renderPositionBadge(tp.position)}
                        <span className={styles.teamPlayerStars}>
                          {tp.rating}★
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Add Player Modal ── */}
      {showAddModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => !salvandoJogador && setShowAddModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Adicionar Jogador</h3>
            <form onSubmit={handleAddPlayer} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="add-name">Nome do Jogador</label>
                <input
                  id="add-name"
                  type="text"
                  placeholder="Ex: Yuri Melo"
                  value={formName}
                  disabled={salvandoJogador}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="add-pos">Posição</label>
                <select
                  id="add-pos"
                  value={formPosition}
                  disabled={salvandoJogador}
                  onChange={(e) => setFormPosition(e.target.value)}
                >
                  {posicoesDisponiveis.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="add-rating">
                  Nível (1 a 5 estrelas): {formRating}★
                </label>
                <input
                  id="add-rating"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={formRating}
                  disabled={salvandoJogador}
                  onChange={(e) => setFormRating(parseFloat(e.target.value))}
                />
              </div>

              {erroModal && (
                <p className={styles.modalError} role="alert">
                  {erroModal}
                </p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={salvandoJogador}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimaryGreen}
                  disabled={salvandoJogador}
                >
                  {salvandoJogador ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Player Modal ── */}
      {showEditModal && editingPlayer && (
        <div
          className={styles.modalOverlay}
          onClick={() => !salvandoJogador && setShowEditModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Editar Jogador</h3>
            <form onSubmit={handleEditPlayer} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="edit-name">Nome</label>
                <input
                  id="edit-name"
                  type="text"
                  value={formName}
                  disabled={salvandoJogador}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="edit-pos">Posição</label>
                <select
                  id="edit-pos"
                  value={formPosition}
                  disabled={salvandoJogador}
                  onChange={(e) => setFormPosition(e.target.value)}
                >
                  {posicoesDisponiveis.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="edit-rating">
                  Nível (1 a 5 estrelas): {formRating}★
                </label>
                <input
                  id="edit-rating"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={formRating}
                  disabled={salvandoJogador}
                  onChange={(e) => setFormRating(parseFloat(e.target.value))}
                />
              </div>

              {erroModal && (
                <p className={styles.modalError} role="alert">
                  {erroModal}
                </p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnDanger}
                  disabled={salvandoJogador}
                  onClick={() => handleDeletePlayer(editingPlayer)}
                  id="btn-excluir-jogador"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={salvandoJogador}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimaryGreen}
                  disabled={salvandoJogador}
                >
                  {salvandoJogador ? "Atualizando..." : "Atualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
