"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface Racha {
  id: string;
  nome: string;
  esporte: string;
  data: string; 
  horario: string;
  local: string;
  confirmados: number;
  vagas: number;
}

const usuarioMock = "Lucas";

const MOCK_RACHAS: Racha[] = [
  {
    id: "1",
    nome: "Pelada de Sexta",
    esporte: "Futebol",
    data: "2026-10-09",
    horario: "19:00",
    local: "Quadra do Parque",
    confirmados: 8,
    vagas: 10,
  },
  {
    id: "2",
    nome: "Basquete de Domingo",
    esporte: "Basquete",
    data: "2026-10-11",
    horario: "09:00",
    local: "Ginásio Central",
    confirmados: 6,
    vagas: 10,
  },
  {
    id: "3",
    nome: "Vôlei de Quarta",
    esporte: "Vôlei",
    data: "2026-10-14",
    horario: "20:00",
    local: "Arena Beira-Mar",
    confirmados: 9,
    vagas: 12,
  },
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toKey(ano: number, mes: number, dia: number) {
  return `${ano}-${pad(mes + 1)}-${pad(dia)}`;
}

function parseKey(key: string) {
  const [ano, mes, dia] = key.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatData(key: string) {
  const d = parseKey(key);
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getIniciais(nome: string) {
  return nome
    .split(" ")
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MenuPage() {
  const rachas = MOCK_RACHAS;

  const [busca, setBusca] = useState("");
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date();
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
  });
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const rachasFiltradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return rachas;
    return rachas.filter((r) =>
      normalizar(`${r.nome} ${r.esporte} ${r.local}`).includes(termo)
    );
  }, [busca, rachas]);

  const rachasPorDia = useMemo(() => {
    const mapa: Record<string, Racha[]> = {};
    rachas.forEach((r) => {
      if (!mapa[r.data]) mapa[r.data] = [];
      mapa[r.data].push(r);
    });
    return mapa;
  }, [rachas]);

  useEffect(() => {
    if (!calendarioAberto) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setCalendarioAberto(false);
    }

    document.addEventListener("keydown", onKeyDown);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAnterior;
    };
  }, [calendarioAberto]);

  function abrirCalendario() {
    const hoje = new Date();
    setMesVisivel({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
    setDiaSelecionado(null);
    setCalendarioAberto(true);
  }

  function mudarMes(delta: number) {
    setMesVisivel(({ ano, mes }) => {
      const d = new Date(ano, mes + delta, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
    setDiaSelecionado(null);
  }

  function handleLogout() {
    window.location.href = "/login";
  }

  const { ano, mes } = mesVisivel;
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array<null>(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  const hoje = new Date();
  const hojeKey = toKey(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  const prefixoMes = `${ano}-${pad(mes + 1)}`;
  const jogosDoMes = rachas.filter((r) => r.data.startsWith(prefixoMes));
  const jogosExibidos = (
    diaSelecionado ? (rachasPorDia[diaSelecionado] ?? []) : jogosDoMes
  )
    .slice()
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
  const tituloLista = diaSelecionado
    ? `Jogos em ${formatData(diaSelecionado)}`
    : `Jogos de ${MESES[mes]}`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/menu" className={styles.logo} id="menu-logo">
            <span className={styles.logoIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8 21h8M12 17v4M7 4H4a1 1 0 0 0-1 1v3c0 2.21 1.79 4 4 4h1M17 4h3a1 1 0 0 1 1 1v3c0 2.21-1.79 4-4 4h-1M7 4h10v8a5 5 0 0 1-10 0V4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Racha<span className={styles.logoPlus}>+</span>
          </Link>

          <div className={styles.userArea}>
            <div className={styles.avatar} aria-hidden="true">
              {getIniciais(usuarioMock)}
            </div>
            <span className={styles.userName}>{usuarioMock}</span>
            <button
              type="button"
              id="menu-logout-btn"
              className={styles.logoutBtn}
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.welcome}>
          <h1 className={styles.welcomeTitle}>Olá, {usuarioMock} 👋</h1>
          <p className={styles.welcomeSubtitle}>Pronto pra organizar sua próxima racha?</p>
        </section>

        <section className={styles.actionsRow}>
          <h2 className={styles.sectionTitle}>Minhas rachas</h2>
          <div className={styles.actionButtons}>
            <button
              type="button"
              id="menu-calendar-btn"
              className={styles.calendarBtn}
              onClick={abrirCalendario}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Calendário
            </button>
            <Link href="/rachas/criar" className={styles.createBtn} id="menu-criar-racha-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Criar racha
            </Link>
          </div>
        </section>

        {rachas.length > 0 && (
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id="menu-search-input"
              type="search"
              placeholder="Pesquisar por nome, esporte ou local..."
              aria-label="Pesquisar rachas"
              autoComplete="off"
              className={styles.searchInput}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button
                type="button"
                id="menu-search-clear"
                className={styles.searchClear}
                onClick={() => setBusca("")}
                aria-label="Limpar pesquisa"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        )}

        {rachas.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className={styles.emptyText}>Você ainda não tem nenhuma racha marcada.</p>
            <Link href="/rachas/criar" className={styles.emptyCreateLink} id="menu-empty-criar-link">
              Criar minha primeira racha
            </Link>
          </div>
        ) : rachasFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className={styles.emptyText}>Nenhuma racha encontrada para “{busca}”.</p>
            <button
              type="button"
              id="menu-empty-clear-search"
              className={styles.emptyCreateLink}
              onClick={() => setBusca("")}
            >
              Limpar pesquisa
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {rachasFiltradas.map((racha) => (
              <Link href={`/rachas/${racha.id}`} key={racha.id} className={styles.card} id={`racha-card-${racha.id}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.sportBadge}>{racha.esporte}</span>
                </div>

                <h3 className={styles.cardTitle}>{racha.nome}</h3>

                <div className={styles.cardInfo}>
                  <div className={styles.infoRow}>
                    <svg className={styles.infoIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {formatData(racha.data)} às {racha.horario}
                  </div>
                  <div className={styles.infoRow}>
                    <svg className={styles.infoIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    {racha.local}
                  </div>
                </div>

                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(racha.confirmados / racha.vagas) * 100}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {racha.confirmados}/{racha.vagas} confirmados
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {calendarioAberto && (
        <div className={styles.overlay} onClick={() => setCalendarioAberto(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendario-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id="calendario-titulo" className={styles.modalTitle}>
                Calendário de jogos
              </h2>
              <button
                type="button"
                id="calendar-close-btn"
                className={styles.closeBtn}
                onClick={() => setCalendarioAberto(false)}
                aria-label="Fechar calendário"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className={styles.monthNav}>
              <button
                type="button"
                id="calendar-prev-btn"
                className={styles.navBtn}
                onClick={() => mudarMes(-1)}
                aria-label="Mês anterior"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className={styles.monthLabel}>
                {MESES[mes]} {ano}
              </span>
              <button
                type="button"
                id="calendar-next-btn"
                className={styles.navBtn}
                onClick={() => mudarMes(1)}
                aria-label="Próximo mês"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className={styles.weekdays} aria-hidden="true">
              {DIAS_SEMANA.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className={styles.daysGrid}>
              {celulas.map((dia, i) => {
                if (dia === null) return <span key={`vazio-${i}`} />;

                const key = toKey(ano, mes, dia);
                const jogos = rachasPorDia[key];
                const classes = [
                  styles.day,
                  jogos ? styles.dayHasGame : "",
                  key === hojeKey ? styles.dayToday : "",
                  key === diaSelecionado ? styles.daySelected : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    type="button"
                    key={key}
                    className={classes}
                    onClick={() => setDiaSelecionado((prev) => (prev === key ? null : key))}
                    aria-pressed={key === diaSelecionado}
                    aria-label={`${dia} de ${MESES[mes]}${jogos ? `, ${jogos.length} jogo(s)` : ""}`}
                  >
                    {dia}
                    {jogos && <span className={styles.dayDot} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <div className={styles.gamesList}>
              <h3 className={styles.gamesTitle}>{tituloLista}</h3>
              {jogosExibidos.length === 0 ? (
                <p className={styles.gamesEmpty}>Nenhum jogo marcado.</p>
              ) : (
                jogosExibidos.map((r) => (
                  <Link href={`/rachas/${r.id}`} key={r.id} className={styles.gameItem}>
                    <span className={styles.gameTime}>{r.horario}</span>
                    <span className={styles.gameInfo}>
                      <span className={styles.gameName}>{r.nome}</span>
                      <span className={styles.gameLocal}>
                        {diaSelecionado ? r.local : `${formatData(r.data)} · ${r.local}`}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}