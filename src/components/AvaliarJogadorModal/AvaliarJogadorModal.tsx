"use client";

import { useState, useEffect, FormEvent } from "react";
import styles from "./AvaliarJogadorModal.module.css";

export interface JogadorParaAvaliar {
  id: string;
  nome: string;
  posicao: string;
  notaAtual: number;
}

export interface AvaliarJogadorModalProps {
  aberto: boolean;
  jogador: JogadorParaAvaliar | null;
  salvando?: boolean;
  erro?: string;
  onClose: () => void;
  onConfirmar: (nota: number) => void | Promise<void>;
}

export default function AvaliarJogadorModal({
  aberto,
  jogador,
  salvando = false,
  erro = "",
  onClose,
  onConfirmar,
}: AvaliarJogadorModalProps) {
  const [nota, setNota] = useState<number>(4.0);

  useEffect(() => {
    if (aberto && jogador) {
      const inicial = Math.min(5, Math.max(0.5, Math.round(jogador.notaAtual * 2) / 2));
      setNota(inicial);
    }
  }, [aberto, jogador]);

  if (!aberto || !jogador) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    onConfirmar(nota);
  };

  const renderPreviewStars = (valor: number) => {
    const items = [];
    for (let i = 1; i <= 5; i++) {
      if (valor >= i) {
        items.push(
          <svg
            key={i}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#facc15"
            stroke="none"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (valor >= i - 0.5) {
        items.push(
          <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id={`modal-half-star-${i}`}>
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#374151" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#modal-half-star-${i})`}
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        );
      } else {
        items.push(
          <svg
            key={i}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#374151"
            stroke="none"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }
    return <div className={styles.starsPreview}>{items}</div>;
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={() => !salvando && onClose()}
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avaliar-modal-title"
      >
        <div className={styles.header}>
          <h3 id="avaliar-modal-title" className={styles.title}>
            ★ Avaliar Jogador
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className={styles.playerCard}>
          <div className={styles.avatar}>
            {jogador.nome.charAt(0).toUpperCase()}
          </div>
          <div className={styles.playerMeta}>
            <span className={styles.playerName}>{jogador.nome}</span>
            <span className={styles.playerPos}>{jogador.posicao}</span>
          </div>
          <span className={styles.currentOvr}>
            OVR: {jogador.notaAtual.toFixed(1)}★
          </span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.ratingBox}>
            <span className={styles.ratingValueDisplay}>
              {nota.toFixed(1)} ★
            </span>
            {renderPreviewStars(nota)}
            <input
              id="avaliar-nota-range"
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={nota}
              disabled={salvando}
              onChange={(e) => setNota(parseFloat(e.target.value))}
              className={styles.rangeInput}
              aria-label="Nota de 0.5 a 5.0 estrelas"
            />
            <div className={styles.scaleHints}>
              <span>0.5★</span>
              <span>2.5★</span>
              <span>5.0★</span>
            </div>
          </div>

          {erro && (
            <p className={styles.errorBox} role="alert">
              {erro}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={salvando}
              id="btn-confirmar-avaliacao"
            >
              {salvando ? "Salvando..." : "Salvar Avaliação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

