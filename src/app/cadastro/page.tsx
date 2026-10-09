"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { registerUser } from "@/services/userService";

interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

interface FormErrors {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
}

export default function CadastroPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpa os erros ao modificar o campo
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Informe seu nome completo";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Informe seu email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Digite um email válido";
    }

    if (!formData.senha) {
      newErrors.senha = "Informe uma senha";
    } else if (formData.senha.length < 6) {
      newErrors.senha = "A senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = "Confirme sua senha";
    } else if (formData.confirmarSenha !== formData.senha) {
      newErrors.confirmarSenha = "As senhas não coincidem";
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
      await registerUser({
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        senha: formData.senha,
      });

      setApiSuccess("Conta criada com sucesso! Redirecionando para o login...");
      setFormData({
        nome: "",
        email: "",
        senha: "",
        confirmarSenha: "",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("Ocorreu um erro inesperado ao cadastrar.");
      }
    } finally {
      clearTimeout(slowTimer);
      setIsLoading(false);
      setIsSlowLoading(false);
    }
  }

  return (
    <div className={styles.container}>
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

      <div className={styles.formSide}>
        <div className={styles.card}>
          <div className={styles.iconWrap} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="8.5"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>Criar conta</h1>
            <p className={styles.subtitle}>Cadastre-se para organizar suas rachas</p>
          </div>

          {apiError && (
            <div className={`${styles.alert} ${styles.alertError}`} role="alert" id="cadastro-api-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className={`${styles.alert} ${styles.alertSuccess}`} role="status" id="cadastro-api-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{apiSuccess}</span>
            </div>
          )}

          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="cadastro-nome" className={styles.label}>
                Nome completo
              </label>
              <input
                id="cadastro-nome"
                name="nome"
                type="text"
                placeholder="Seu nome completo"
                autoComplete="name"
                disabled={isLoading}
                className={`${styles.input} ${errors.nome ? styles.inputError : ""}`}
                value={formData.nome}
                onChange={handleChange}
              />
              {errors.nome && <span className={styles.errorText}>{errors.nome}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="cadastro-email" className={styles.label}>
                Email
              </label>
              <input
                id="cadastro-email"
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

            <div className={styles.fieldGroup}>
              <label htmlFor="cadastro-senha" className={styles.label}>
                Senha
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="cadastro-senha"
                  name="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
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
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.senha && <span className={styles.errorText}>{errors.senha}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="cadastro-confirmar-senha" className={styles.label}>
                Confirmar senha
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="cadastro-confirmar-senha"
                  name="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className={`${styles.input} ${errors.confirmarSenha ? styles.inputError : ""}`}
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  id="toggle-confirm-password"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmarSenha && <span className={styles.errorText}>{errors.confirmarSenha}</span>}
            </div>

            <div>
              <button
                type="submit"
                id="cadastro-submit-btn"
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" />
                    Cadastrando...
                  </>
                ) : (
                  "Criar conta"
                )}
              </button>
              {isSlowLoading && (
                <p className={styles.slowNotice}>
                  ⏳ O servidor está sendo inicializado. Isso pode levar até 1 minuto no primeiro acesso...
                </p>
              )}
            </div>
          </form>

          <p className={styles.loginText}>
            Já tem conta?{" "}
            <Link href="/login" className={styles.loginLink} id="cadastro-login-link">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}