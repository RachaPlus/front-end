import styles from "./page.module.css";
import Navbar from "@/components/Navbar/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className={styles.main}>
        {/* ── Hero ── */}
        <section className={styles.hero} aria-labelledby="hero-heading">
          {/* Background glow */}
          <div className={styles.heroGlow} aria-hidden="true" />

          <div className={styles.heroContent}>
            {/* Left */}
            <div className={styles.heroLeft}>
              <h1 id="hero-heading" className={styles.heroTitle}>
                O fim das panelinhas no seu{" "}
                <span className={styles.heroTitleAccent}>racha</span>.
              </h1>
              <p className={styles.heroSubtitle}>
                Organize partidas, equilibre times e crie um ranking de MVPs.
                Futebol, Basquete e Vôlei em um só lugar.
              </p>
              <Link
                href="/cadastro"
                className={styles.heroCta}
                id="hero-cta-primary"
              >
                Organizar meu Racha
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Right — Profile Card */}
            <div className={styles.heroRight} aria-label="Exemplo de perfil">
              <div className={styles.profileCard} id="hero-profile-card">
                <div className={styles.profileHeader}>
                  <div className={styles.profileAvatar} aria-hidden="true">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 21h8M12 17v4M7 4H4a1 1 0 0 0-1 1v3c0 2.21 1.79 4 4 4h1M17 4h3a1 1 0 0 1 1 1v3c0 2.21-1.79 4-4 4h-1M7 4h10v8a5 5 0 0 1-10 0V4Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className={styles.profileInfo}>
                    <span className={styles.profileName}>Yuri</span>
                    <span className={styles.profileRole}>Admin • 7 MVPs</span>
                  </div>
                </div>

                <div className={styles.profileStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Rating</span>
                    <span className={styles.statValueGreen}>4.8/5.0</span>
                  </div>
                  <div className={styles.statDivider} aria-hidden="true" />
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Partidas</span>
                    <span className={styles.statValue}>42</span>
                  </div>
                  <div className={styles.statDivider} aria-hidden="true" />
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Vitórias</span>
                    <span className={styles.statValue}>28</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className={styles.features} aria-labelledby="features-heading">
          <h2 id="features-heading" className={styles.featuresTitle}>
            Tudo o que o admin precisa.
          </h2>

          <div className={styles.featuresGrid} role="list">
            <article className={styles.featureCard} role="listitem" id="feature-algoritmo">
              <div className={styles.featureIcon} aria-hidden="true">
                {/* Balance / scales icon */}
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 3v18M3 6l4 8a4 4 0 0 0 8 0l4-8M3 6h18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Algoritmo Justo</h3>
              <p className={styles.featureDesc}>
                Times equilibrados automaticamente.
              </p>
            </article>

            <article className={styles.featureCard} role="listitem" id="feature-esportes">
              <div className={styles.featureIcon} aria-hidden="true">
                {/* Trophy icon */}
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 21h8M12 17v4M7 4H4a1 1 0 0 0-1 1v3c0 2.21 1.79 4 4 4h1M17 4h3a1 1 0 0 1 1 1v3c0 2.21-1.79 4-4 4h-1M7 4h10v8a5 5 0 0 1-10 0V4Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Multi-Esportes</h3>
              <p className={styles.featureDesc}>
                Regras adaptadas para Basquete, Futebol e Vôlei.
              </p>
            </article>

            <article className={styles.featureCard} role="listitem" id="feature-ranking">
              <div className={styles.featureIcon} aria-hidden="true">
                {/* Medal icon */}
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="14" r="6" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M9 2h6l1 6H8L9 2ZM12 8v6M9.5 14l2.5-3 2.5 3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Ranking & MVP</h3>
              <p className={styles.featureDesc}>
                Gamifique a resenha com votação pós-jogo.
              </p>
            </article>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className={styles.ctaBanner} aria-labelledby="cta-heading">
          <h2 id="cta-heading" className={styles.ctaTitle}>
            Pronto para profissionalizar a várzea?
          </h2>
          <Link
            href="/cadastro"
            className={styles.ctaBtn}
            id="cta-criar-conta"
          >
            Criar Conta Grátis
          </Link>
        </section>
      </main>
    </>
  );
}
