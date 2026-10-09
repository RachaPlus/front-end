"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

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

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    router.push("/menu");
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

            <button type="submit" id="cadastro-submit-btn" className={styles.submitBtn}>
              Criar conta
            </button>
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