import styles from "./Navbar.module.css";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo} id="navbar-logo">
          <span className={styles.logoIcon} aria-hidden="true">
            {/* Trophy SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 21h8M12 17v4M7 4H4a1 1 0 0 0-1 1v3c0 2.21 1.79 4 4 4h1M17 4h3a1 1 0 0 1 1 1v3c0 2.21-1.79 4-4 4h-1M7 4h10v8a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          Racha<span className={styles.logoPlus}>+</span>
        </Link>

        <div className={styles.actions}>
          <Link href="/login" className={styles.linkEntrar} id="navbar-entrar">
            Entrar
          </Link>
          <Link href="/cadastro" className={styles.btnComecar} id="navbar-comecar">
            Começar Agora
          </Link>
        </div>
      </nav>
    </header>
  );
}
