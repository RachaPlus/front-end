"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { loginUser } from "@/services/authService";

interface FormErrors {
  email?: string;
  senha?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Informe seu email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Digite um email válido";
    }

    if (!formData.senha) {
      newErrors.senha = "Informe sua senha";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!validate()) return;

    setIsLoading(true);
    setIsSlowLoading(false);

    const slowTimer = setTimeout(() => {
      setIsSlowLoading(true);
    }, 3000);

    try {
      const response = await loginUser({
        email: formData.email.trim(),
        senha: formData.senha,
      });

      // Salva o token retornado pela API no localStorage
      if (typeof window !== "undefined" && response.token) {
        localStorage.setItem("token", response.token);
      }

      setApiSuccess("Login efetuado com sucesso! Redirecionando...");

      setTimeout(() => {
        router.push("/menu");
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("Ocorreu um erro inesperado ao realizar o login.");
      }
    } finally {
      clearTimeout(slowTimer);
      setIsLoading(false);
      setIsSlowLoading(false);
    }
  }

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

          {apiError && (
            <div className={`${styles.alert} ${styles.alertError}`} role="alert" id="login-api-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className={`${styles.alert} ${styles.alertSuccess}`} role="status" id="login-api-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{apiSuccess}</span>
            </div>
          )}

          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            {/* Email */}
            <div className={styles.fieldGroup}>
              <label htmlFor="login-email" className={styles.label}>
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={isLoading}
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <label htmlFor="login-senha" className={styles.label}>
                Senha
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="login-senha"
                  name="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`${styles.input} ${errors.senha ? styles.inputError : ""}`}
                  value={formData.senha}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  id="toggle-password"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  disabled={isLoading}
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
              {errors.senha && <span className={styles.errorText}>{errors.senha}</span>}
              <div className={styles.forgotRow}>
                <Link href="/esqueci-senha" className={styles.forgotLink} id="forgot-password-link">
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                id="login-submit-btn"
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
              {isSlowLoading && (
                <p className={styles.slowNotice}>
                  ⏳ O servidor está sendo inicializado. Isso pode levar até 1 minuto no primeiro acesso...
                </p>
              )}
            </div>
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