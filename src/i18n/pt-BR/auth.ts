import type { UserRole } from "../../lib/types";

/** Entrar na mesa: login, papel (mestre ou jogador) e modo local. */
export const auth = {
  tagline: {
    base: "vtt não oficial pra cyberpunk red.",
    cloud: "suas fichas ficam salvas na sua conta.",
    local: "tudo fica salvo neste navegador.",
  },
  /** Os dois papéis: o rótulo aparece no login e no cabeçalho. */
  roles: {
    mestre: { label: "mestre", hint: "combate, net e fichas da mesa" },
    jogador: { label: "jogador", hint: "criar e ver seus personagens" },
  } satisfies Record<UserRole, { label: string; hint: string }>,
  roleLegend: "entrar como",
  /** Depois do cadastro com confirmação por email: "conta criada. abra o link ... pra {email} e você entra direto." */
  sent: {
    before: "conta criada. abra o link que enviamos pra",
    after: "e você entra direto.",
  },
  fields: {
    login: { label: "login", placeholder: "nome de usuário" },
    name: { label: "nome / apelido", placeholder: "como a mesa te chama" },
    email: { label: "email", placeholder: "voce@exemplo.com" },
    password: { label: "senha", labelNew: "senha (mín. 6)" },
  },
  tabs: { aria: "acesso", signIn: "entrar", signUp: "criar conta" },
  signedInAs: "conectado como",
  switchAccount: "trocar conta",
  submit: { connect: "conectar", busy: "conectando..." },
  errors: {
    noSupabase: "supabase não configurado.",
    /** Erro que o supabase devolveu sem código conhecido: mostra o que ele disse. */
    other: (detail: string) => `não deu certo: ${detail}`,
    /** Por código de erro do supabase. */
    byCode: {
      invalid_credentials: "email ou senha errados.",
      email_not_confirmed: "confirme o email antes de entrar (veja sua caixa de entrada).",
      user_already_exists: "esse email já tem conta. use entrar.",
      weak_password: "senha fraca: use pelo menos 6 caracteres.",
      email_address_invalid: "email inválido.",
      email_address_not_authorized: "o supabase não conseguiu enviar o email de confirmação pra esse endereço.",
      over_email_send_rate_limit: "muitos emails enviados. tente de novo em alguns minutos.",
      over_request_rate_limit: "muitas tentativas. espere um pouco.",
      signup_disabled: "cadastro desativado.",
    },
  },
  /** Nome que a conta recebe quando o login não traz nenhum. */
  defaultName: "netrunner",
} as const;
