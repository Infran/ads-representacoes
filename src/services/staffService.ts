/**
 * staffService — leitura do perfil/papel do próprio usuário.
 *
 * A coleção `staff/{uid}` sempre foi a allowlist de acesso (SEG-02): existir nela
 * é o que `isStaff()` verifica nas regras. O papel `admin` é um CAMPO desse mesmo
 * doc, provisionado manualmente no Console — não há auto-cadastro de admin.
 *
 * As regras liberam apenas `get` do PRÓPRIO doc (`request.auth.uid == uid`);
 * `list` e escrita seguem negados. Então este módulo só sabe ler um perfil: o seu.
 */
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { logger } from "../utils/logger";

export type StaffRole = "admin" | "staff";

export interface IStaffProfile {
  uid: string;
  role: StaffRole;
  name?: string;
  email?: string;
}

/**
 * Cache do papel em `sessionStorage`, ao lado de `loginTime`.
 *
 * MOTIVO: sem ele, `getStaffProfile` fica na frente de TODA a árvore (o provider
 * segura o app com `{!loading && children}`), então cada abertura de aba paga
 * uma ida ao Firestore antes de desenhar qualquer coisa — e o login pagava
 * duas leituras, porque `login()` resolve o papel e o `onAuthStateChanged`
 * dispara logo atrás resolvendo de novo.
 *
 * MESMO CICLO DE VIDA DA SESSÃO, de propósito: `browserSessionPersistence` +
 * `sessionStorage` morrem juntos ao fechar a aba, e o logout automático de 2h
 * limita a validade. Nunca `localStorage` — sobreviveria à sessão.
 *
 * SEGURANÇA: adulterar este valor só muda o que a UI desenha. Quem autoriza de
 * fato é `isAdmin()` nas firestore.rules; um "admin" forjado aqui veria o
 * painel e receberia `permission-denied` em cada leitura.
 */
const ROLE_CACHE_KEY = "ads_staff_role";

interface CachedRole {
  uid: string;
  role: StaffRole;
}

/** Papel em cache, e só se for do MESMO uid (troca de conta invalida). */
export const getCachedRole = (uid: string): StaffRole | null => {
  if (!uid) return null;
  try {
    const raw = sessionStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedRole;
    if (cached.uid !== uid) return null;
    return cached.role === "admin" ? "admin" : "staff";
  } catch {
    return null;
  }
};

export const setCachedRole = (uid: string, role: StaffRole): void => {
  try {
    sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ uid, role }));
  } catch {
    // Storage indisponível: seguir sem cache só custa a leitura de sempre.
  }
};

export const clearCachedRole = (): void => {
  try {
    sessionStorage.removeItem(ROLE_CACHE_KEY);
  } catch {
    // Nada a fazer — o logout não pode falhar por causa do storage.
  }
};

/**
 * Papel do usuário, do cache quando possível.
 *
 * Só vai ao Firestore quando não há entrada em cache para este uid, e grava o
 * resultado. É a função que o `AuthProvider` deve chamar; `getStaffProfile`
 * continua disponível para quem precisar do documento inteiro.
 */
export const resolveRole = async (uid: string): Promise<StaffRole> => {
  const cached = getCachedRole(uid);
  if (cached) return cached;

  const profile = await getStaffProfile(uid);
  const role = profile?.role ?? "staff";
  setCachedRole(uid, role);
  return role;
};

/**
 * Lê o perfil do próprio usuário em `staff/{uid}`.
 *
 * Retorna `null` quando o doc não existe ou a leitura falha — nunca lança. Quem
 * chama deve tratar `null` como staff comum: um atraso no deploy das regras (ou
 * uma indisponibilidade momentânea) não pode nem travar o app nem, no outro
 * extremo, conceder admin por acidente.
 */
export const getStaffProfile = async (
  uid: string
): Promise<IStaffProfile | null> => {
  if (!uid) return null;

  try {
    const snap = await getDoc(doc(db, "staff", uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      uid: snap.id,
      // Qualquer valor diferente de "admin" (inclusive ausente) vira "staff".
      role: data?.role === "admin" ? "admin" : "staff",
      name: data?.name,
      email: data?.email,
    };
  } catch (error) {
    logger.error("Erro ao ler o perfil de staff:", error);
    return null;
  }
};
