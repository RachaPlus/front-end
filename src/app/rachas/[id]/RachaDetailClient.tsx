"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import styles from "./page.module.css";

// Interface definitions
export interface Player {
  id: string;
  name: string;
  position: "Meio-Campista" | "Atacante" | "Zagueiro" | "Goleiro" | "Ala" | "Pivô";
  rating: number; // 1 to 5
  confirmed: boolean;
  isAdmin?: boolean;
}

export interface Team {
  id: number;
  name: string;
  color: string;
  players: Player[];
  avgRating: number;
}

export interface MVPItem {
  id: string;
  name: string;
  mvpCount: number;
  matches: number;
  rating: number;
  position: string;
}

const MOCK_INITIAL_PLAYERS: Player[] = [
  { id: "1", name: "Yuri", position: "Meio-Campista", rating: 4.5, confirmed: true, isAdmin: true },
  { id: "2", name: "Carlos", position: "Atacante", rating: 4.0, confirmed: true },
  { id: "3", name: "Bruno", position: "Zagueiro", rating: 3.5, confirmed: true },
  { id: "4", name: "Gabriel", position: "Goleiro", rating: 4.5, confirmed: true },
  { id: "5", name: "Ricardo", position: "Goleiro", rating: 4.0, confirmed: true },
  { id: "6", name: "Fernando", position: "Meio-Campista", rating: 4.0, confirmed: true },
  { id: "7", name: "Lucas", position: "Atacante", rating: 4.5, confirmed: true },
  { id: "8", name: "Matheus", position: "Zagueiro", rating: 4.0, confirmed: true },
  { id: "9", name: "Diego", position: "Meio-Campista", rating: 3.5, confirmed: true },
  { id: "10", name: "Rafael", position: "Atacante", rating: 5.0, confirmed: true },
  { id: "11", name: "Gustavo", position: "Zagueiro", rating: 3.5, confirmed: true },
  { id: "12", name: "Thiago", position: "Meio-Campista", rating: 4.0, confirmed: true },
  { id: "13", name: "Felipe", position: "Atacante", rating: 4.0, confirmed: true },
  { id: "14", name: "Leonardo", position: "Zagueiro", rating: 3.0, confirmed: true },
];

const MOCK_RANKING: MVPItem[] = [
  { id: "1", name: "Yuri", mvpCount: 7, matches: 42, rating: 4.8, position: "Meio-Campista" },
  { id: "2", name: "Rafael", mvpCount: 6, matches: 38, rating: 4.9, position: "Atacante" },
  { id: "3", name: "Gabriel", mvpCount: 5, matches: 40, rating: 4.7, position: "Goleiro" },
  { id: "4", name: "Lucas", mvpCount: 4, matches: 35, rating: 4.6, position: "Atacante" },
  { id: "5", name: "Fernando", mvpCount: 3, matches: 30, rating: 4.4, position: "Meio-Campista" },
];

const FORMAT_OPTIONS = ["5x5", "6x6", "7x7", "8x8", "11x11"];

export default function RachaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const rachaId = resolvedParams?.id || "2";

  // Mock title map or default
  const rachaNome = rachaId === "1" ? "Pelada de Sexta" : rachaId === "3" ? "Vôlei de Quarta" : "Rachão Massa";

  // State
  const [players, setPlayers] = useState<Player[]>(MOCK_INITIAL_PLAYERS);
  const [selectedFormat, setSelectedFormat] = useState<string>("7x7");
  const [teams, setTeams] = useState<Team[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);

  // Form state for add/edit player
  const [formName, setFormName] = useState("");
  const [formPosition, setFormPosition] = useState<Player["position"]>("Meio-Campista");
  const [formRating, setFormRating] = useState(4.0);
  const [formIsAdmin, setFormIsAdmin] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 min default
  const [timerActive, setTimerActive] = useState(false);

  const confirmedCount = useMemo(() => players.filter((p) => p.confirmed).length, [players]);
  const totalCount = players.length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Toggle player confirmed state
  const toggleConfirmed = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, confirmed: !p.confirmed } : p))
    );
  };

  // Open add player modal
  const openAddModal = () => {
    setFormName("");
    setFormPosition("Meio-Campista");
    setFormRating(4.0);
    setFormIsAdmin(false);
    setShowAddModal(true);
  };

  // Save new player
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: formName.trim(),
      position: formPosition,
      rating: Number(formRating),
      confirmed: true,
      isAdmin: formIsAdmin,
    };

    setPlayers((prev) => [newPlayer, ...prev]);
    setShowAddModal(false);
    showToast(`Jogador "${newPlayer.name}" adicionado com sucesso!`);
  };

  // Open edit modal
  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFormName(player.name);
    setFormPosition(player.position);
    setFormRating(player.rating);
    setFormIsAdmin(!!player.isAdmin);
    setShowEditModal(true);
  };

  // Save edited player
  const handleEditPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !formName.trim()) return;

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === editingPlayer.id
          ? {
              ...p,
              name: formName.trim(),
              position: formPosition,
              rating: Number(formRating),
              isAdmin: formIsAdmin,
            }
          : p
      )
    );
    setShowEditModal(false);
    setEditingPlayer(null);
    showToast(`Jogador "${formName}" atualizado!`);
  };

  // Team drawer algorithm
  const handleFormarTimes = () => {
    const activePlayers = players.filter((p) => p.confirmed);
    if (activePlayers.length < 2) {
      showToast("Selecione pelo menos 2 jogadores confirmados para formar os times.");
      return;
    }

    // Determine target size per team based on format (5x5 -> 5, 7x7 -> 7, etc)
    const perTeam = parseInt(selectedFormat.split("x")[0]) || 7;
    const numTeams = Math.max(2, Math.ceil(activePlayers.length / perTeam));

    // Separate goalkeepers from field players
    const goleiros = activePlayers.filter((p) => p.position === "Goleiro");
    const linha = activePlayers.filter((p) => p.position !== "Goleiro");

    // Shuffle helper with weighted balance
    const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const sortedLinha = shuffleArray(linha).sort((a, b) => b.rating - a.rating);
    const shuffledGoleiros = shuffleArray(goleiros);

    // Initialize team buckets
    const teamBuckets: Player[][] = Array.from({ length: numTeams }, () => []);

    // Distribute goalkeepers evenly
    shuffledGoleiros.forEach((g, idx) => {
      teamBuckets[idx % numTeams].push(g);
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

    const colors = ["#34d35a", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
    const teamNames = ["Time Verde", "Time Azul", "Time Amarelo", "Time Rosa", "Time Roxo", "Time Ciano"];

    const generatedTeams: Team[] = teamBuckets.map((plist, idx) => {
      const totalRating = plist.reduce((acc, p) => acc + p.rating, 0);
      const avg = plist.length > 0 ? Number((totalRating / plist.length).toFixed(1)) : 0;
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

    let text = `⚽ *RACHÃO MASSA - TIMES FORMADOS (${selectedFormat})*\n\n`;
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
  const renderPositionBadge = (pos: Player["position"]) => {
    switch (pos) {
      case "Meio-Campista":
        return <span className={`${styles.posBadge} ${styles.posGreen}`}>Meio-Campista</span>;
      case "Atacante":
        return <span className={`${styles.posBadge} ${styles.posPink}`}>Atacante</span>;
      case "Zagueiro":
        return <span className={`${styles.posBadge} ${styles.posBlue}`}>Zagueiro</span>;
      case "Goleiro":
        return <span className={`${styles.posBadge} ${styles.posAmber}`}>Goleiro</span>;
      default:
        return <span className={`${styles.posBadge} ${styles.posGreen}`}>{pos}</span>;
    }
  };

  // Render rating stars (1-5 with half star support)
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="none">
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
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#374151" stroke="none">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }
    return <div className={styles.starRating}>{stars}</div>;
  };

  // Timer format (mm:ss)
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

      {/* ── Top Header Navigation Bar ── */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <Link href="/menu" className={styles.backBtn} aria-label="Voltar para o Menu" id="racha-back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.rachaTitle}>{rachaNome}</h1>
            <span className={styles.rachaSubtitle}>{confirmedCount}/{totalCount} Confirmados</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Action Toolbar Icons */}
          <div className={styles.toolbarIcons}>
            <button
              className={styles.iconBtn}
              onClick={() => setShowTimerModal(true)}
              title="Cronômetro de Partida"
              aria-label="Abrir Cronômetro"
              id="btn-timer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>

            <button
              className={styles.iconBtn}
              onClick={() => setShowRankingModal(true)}
              title="Ranking do Racha"
              aria-label="Abrir Ranking"
              id="btn-trophy-icon"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </button>

            <button
              className={styles.textActionBtn}
              onClick={() => setShowRankingModal(true)}
              id="btn-ver-ranking"
            >
              Ver Ranking
            </button>

            <button
              className={styles.iconBtn}
              onClick={() => setShowTimerModal(true)}
              title="Iniciar Partida"
              aria-label="Iniciar Partida"
              id="btn-play-match"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>

            <button
              className={styles.iconBtn}
              onClick={handleShareLink}
              title="Compartilhar Racha"
              aria-label="Compartilhar Racha"
              id="btn-share-racha"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>

          {/* Format selector pills (5x5, 6x6, 7x7, 8x8, 11x11) */}
          <div className={styles.formatSelector} role="radiogroup" aria-label="Selecione o formato do racha">
            {FORMAT_OPTIONS.map((fmt) => (
              <button
                key={fmt}
                type="button"
                className={`${styles.formatPill} ${selectedFormat === fmt ? styles.formatPillActive : ""}`}
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
        <section className={styles.columnSection} aria-labelledby="jogadores-heading">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Adicionar
            </button>
          </div>

          <div className={styles.playersList}>
            {players.map((player) => (
              <div
                key={player.id}
                className={`${styles.playerCard} ${!player.confirmed ? styles.playerCardUnconfirmed : ""}`}
                id={`player-card-${player.id}`}
              >
                {/* Attendance toggle checkbox */}
                <button
                  type="button"
                  className={`${styles.checkCircleBtn} ${player.confirmed ? styles.checkCircleActive : ""}`}
                  onClick={() => toggleConfirmed(player.id)}
                  title={player.confirmed ? "Desmarcar presença" : "Confirmar presença"}
                  aria-label={`Confirmar presença de ${player.name}`}
                  id={`check-player-${player.id}`}
                >
                  {player.confirmed && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
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
                    {player.isAdmin && (
                      <span className={styles.adminCrown} title="Organizador / Admin">👑</span>
                    )}
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={() => openEditModal(player)}
                      title="Editar jogador"
                      aria-label={`Editar ${player.name}`}
                      id={`edit-player-${player.id}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
            ))}
          </div>
        </section>

        {/* Right Column: Times */}
        <section className={styles.columnSection} aria-labelledby="times-heading">
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8a9a8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                <div key={team.id} className={styles.teamCard} id={`team-card-${team.id}`}>
                  <div className={styles.teamCardHeader} style={{ borderLeftColor: team.color }}>
                    <div className={styles.teamTitleRow}>
                      <span className={styles.teamBadgeDot} style={{ backgroundColor: team.color }} />
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
                        <span className={styles.teamPlayerStars}>{tp.rating}★</span>
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
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Adicionar Jogador</h3>
            <form onSubmit={handleAddPlayer} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="add-name">Nome do Jogador</label>
                <input
                  id="add-name"
                  type="text"
                  placeholder="Ex: Yuri Melo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="add-pos">Posição</label>
                <select
                  id="add-pos"
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value as Player["position"])}
                >
                  <option value="Meio-Campista">Meio-Campista</option>
                  <option value="Atacante">Atacante</option>
                  <option value="Zagueiro">Zagueiro</option>
                  <option value="Goleiro">Goleiro</option>
                  <option value="Ala">Ala</option>
                  <option value="Pivô">Pivô</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="add-rating">Nível (1 a 5 estrelas): {formRating}★</label>
                <input
                  id="add-rating"
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={formRating}
                  onChange={(e) => setFormRating(parseFloat(e.target.value))}
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label htmlFor="add-admin">
                  <input
                    id="add-admin"
                    type="checkbox"
                    checked={formIsAdmin}
                    onChange={(e) => setFormIsAdmin(e.target.checked)}
                  />
                  É Organizador / Admin (👑)
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimaryGreen}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Player Modal ── */}
      {showEditModal && editingPlayer && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Editar Jogador</h3>
            <form onSubmit={handleEditPlayer} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="edit-name">Nome</label>
                <input
                  id="edit-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="edit-pos">Posição</label>
                <select
                  id="edit-pos"
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value as Player["position"])}
                >
                  <option value="Meio-Campista">Meio-Campista</option>
                  <option value="Atacante">Atacante</option>
                  <option value="Zagueiro">Zagueiro</option>
                  <option value="Goleiro">Goleiro</option>
                  <option value="Ala">Ala</option>
                  <option value="Pivô">Pivô</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="edit-rating">Nível (1 a 5 estrelas): {formRating}★</label>
                <input
                  id="edit-rating"
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={formRating}
                  onChange={(e) => setFormRating(parseFloat(e.target.value))}
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label htmlFor="edit-admin">
                  <input
                    id="edit-admin"
                    type="checkbox"
                    checked={formIsAdmin}
                    onChange={(e) => setFormIsAdmin(e.target.checked)}
                  />
                  Organizador / Admin (👑)
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimaryGreen}>
                  Atualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Ranking Modal ── */}
      {showRankingModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRankingModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.rankingModalHeader}>
              <h3 className={styles.modalTitle}>🏆 Ranking do Racha & MVPs</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowRankingModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.rankingList}>
              {MOCK_RANKING.map((item, index) => (
                <div key={item.id} className={styles.rankingCard}>
                  <div className={styles.rankPosition}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </div>
                  <div className={styles.rankAvatar}>{item.name.charAt(0)}</div>
                  <div className={styles.rankInfo}>
                    <span className={styles.rankName}>{item.name}</span>
                    <span className={styles.rankPosLabel}>{item.position}</span>
                  </div>
                  <div className={styles.rankStats}>
                    <span className={styles.mvpBadge}>👑 {item.mvpCount} MVPs</span>
                    <span className={styles.rankRating}>{item.rating} ★</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Cronômetro / Timer Modal ── */}
      {showTimerModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTimerModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.rankingModalHeader}>
              <h3 className={styles.modalTitle}>⏱️ Cronômetro de Partida</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowTimerModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.timerDisplayContainer}>
              <div className={styles.timerClock}>{formatTimer(timerSeconds)}</div>

              <div className={styles.timerPresetRow}>
                <button type="button" className={styles.btnSecondary} onClick={() => setTimerSeconds(600)}>10 min</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setTimerSeconds(720)}>12 min</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setTimerSeconds(900)}>15 min</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setTimerSeconds(1200)}>20 min</button>
              </div>

              <div className={styles.timerControls}>
                <button
                  type="button"
                  className={styles.btnPrimaryGreen}
                  onClick={() => setTimerActive(!timerActive)}
                >
                  {timerActive ? "Pausar" : "Iniciar Tempo"}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setTimerActive(false);
                    setTimerSeconds(600);
                  }}
                >
                  Reiniciar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
