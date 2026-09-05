"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.container}>
      {/* ── Left: Sports Photo ── */}
      <div className={styles.photoSide} aria-hidden="true">
        <Image
          src="/basketball-court.jpg"
          alt="Quadra de basquete"
          fill
          priority
          sizes="50vw"
          className={styles.photo}
        />
        <div className={styles.photoOverlay} />
      </div>

      {/* ── Right: Login Form ── */}
      <div className={styles.formSide}>
        <div className={styles.card}>
          {/* Icon */}
          <div className={styles.iconWrap} aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.subtitle}>Entre para gerenciar suas rachas</p>
          </div>

          <form className={styles.form} noValidate>
            {/* Email */}
            <div className={styles.fieldGroup}>
              <label htmlFor="login-email" className={styles.label}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                className={styles.input}
              />
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <label htmlFor="login-senha" className={styles.label}>
                Senha
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="login-senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={styles.input}
                />
                <button
                  type="button"
                  id="toggle-password"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className={styles.forgotRow}>
                <Link href="/esqueci-senha" className={styles.forgotLink} id="forgot-password-link">
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit-btn"
              className={styles.submitBtn}
            >
              Entrar
            </button>
          </form>

          <p className={styles.registerText}>
            Não tem conta?{" "}
            <Link href="/cadastro" className={styles.registerLink} id="login-register-link">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
