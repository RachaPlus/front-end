"use client";

import type { ReactNode } from "react";
import styles from "./TimesPanel.module.css";

export interface JogadorTime {
  id: string;
  nome: string;
  posicao: string;
  nota: number;
}

export interface TimeEquilibrado {
  id: number;
  nome: string;
  cor: string;
  mediaOvr: number;
  jogadores: JogadorTime[];
}

export interface TimesPanelProps {
  times: TimeEquilibrado[];
  deFora?: JogadorTime[];
  carregando?: boolean;
  renderPositionBadge?: (posicao: string) => ReactNode;
}

export default function TimesPanel({
  times,
  deFora = [],
  carregando = false,
  renderPositionBadge,
}: TimesPanelProps) {
  if (carregando) {
    return (
      <div className={styles.emptyStateBox} id="times-loading-state">
        <p className={styles.emptyStateText}>
          Equilibrando os times...
        </p>
      </div>
    );
  }

  if (times.length === 0) {
    return (
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
    );
  }

  return (
    <div className={styles.panelWrapper}>
      <div className={styles.teamsGrid}>
        {times.map((team) => (
          <div
            key={team.id}
            className={styles.teamCard}
            id={`team-card-${team.id}`}
          >
            <div
              className={styles.teamCardHeader}
              style={{ borderLeftColor: team.cor }}
            >
              <div className={styles.teamTitleRow}>
                <span
                  className={styles.teamBadgeDot}
                  style={{ backgroundColor: team.cor }}
                />
                <h3 className={styles.teamName}>{team.nome}</h3>
              </div>
              <span className={styles.teamAvgRating}>
                Média: {team.mediaOvr} ★
              </span>
            </div>

            <div className={styles.teamPlayersList}>
              {team.jogadores.map((tp) => (
                <div key={tp.id} className={styles.teamPlayerItem}>
                  <div className={styles.teamPlayerAvatar}>
                    {tp.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className={styles.teamPlayerName}>{tp.nome}</span>
                  {renderPositionBadge ? renderPositionBadge(tp.posicao) : null}
                  <span className={styles.teamPlayerStars}>{tp.nota}★</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {deFora.length > 0 && (
        <div className={styles.benchCard} id="card-de-fora">
          <div className={styles.benchHeader}>
            <h3 className={styles.benchTitle}>De fora</h3>
            <span className={styles.benchCount}>
              {deFora.length}{" "}
              {deFora.length === 1 ? "jogador excedente" : "jogadores excedentes"}
            </span>
          </div>

          <div className={styles.benchPlayersGrid}>
            {deFora.map((jp) => (
              <div key={jp.id} className={styles.teamPlayerItem}>
                <div className={styles.teamPlayerAvatar}>
                  {jp.nome.charAt(0).toUpperCase()}
                </div>
                <span className={styles.teamPlayerName}>{jp.nome}</span>
                {renderPositionBadge ? renderPositionBadge(jp.posicao) : null}
                <span className={styles.teamPlayerStars}>{jp.nota}★</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

