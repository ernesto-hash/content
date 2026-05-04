/**
 * rbac.ts — Role-Based Access Control
 *
 * Roles disponíveis (do menos ao mais privilegiado):
 *   "user"    — utilizador registado, acesso ao conteúdo autenticado
 *   "creator" — pode fazer upload, gerir studio, analytics
 *   "admin"   — acesso total, moderação, gestão de utilizadores
 *
 * O role é guardado na tabela `profiles` na coluna `role` (TEXT).
 * O valor padrão na BD deve ser "user".
 *
 * SQL para adicionar a coluna:
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
 *     CHECK (role IN ('user', 'creator', 'admin'));
 *
 * Política RLS para role (apenas admins podem atualizar o role de outros):
 *   CREATE POLICY "profiles_role_update_admin_only"
 *   ON profiles FOR UPDATE
 *   USING (
 *     id = auth.uid()
 *     OR EXISTS (
 *       SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
 *     )
 *   );
 */

export type UserRole = "user" | "creator" | "admin";

/** Hierarquia numérica para comparação de roles */
const ROLE_LEVEL: Record<UserRole, number> = {
  user:    1,
  creator: 2,
  admin:   3,
};

/**
 * Verifica se um role tem permissão mínima requerida.
 * Ex: hasMinRole("creator", "creator") → true
 *     hasMinRole("user", "creator")    → false
 *     hasMinRole("admin", "creator")   → true
 */
export function hasMinRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[required];
}

/**
 * Permissões por feature — lista canónica de o que cada role pode fazer.
 * Adicionar novas permissões aqui conforme a app cresce.
 */
export const PERMISSIONS = {
  // Conteúdo autenticado
  VIEW_AUTHENTICATED_CONTENT: ["user", "creator", "admin"] as UserRole[],

  // Galeria premium (requer subscrição E role mínimo "user")
  VIEW_GALLERY:               ["user", "creator", "admin"] as UserRole[],

  // Studio
  ACCESS_STUDIO:              ["creator", "admin"] as UserRole[],
  UPLOAD_VIDEO:               ["creator", "admin"] as UserRole[],
  VIEW_ANALYTICS:             ["creator", "admin"] as UserRole[],
  MANAGE_OWN_VIDEOS:          ["creator", "admin"] as UserRole[],

  // Administração
  MODERATE_CONTENT:           ["admin"] as UserRole[],
  MANAGE_USERS:               ["admin"] as UserRole[],
  VIEW_ALL_ANALYTICS:         ["admin"] as UserRole[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Verifica se um role tem uma permissão específica.
 */
export function can(userRole: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as UserRole[]).includes(userRole);
}

/**
 * Verifica múltiplas permissões — retorna true se tiver TODAS.
 */
export function canAll(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => can(userRole, p));
}

/**
 * Verifica múltiplas permissões — retorna true se tiver ALGUMA.
 */
export function canAny(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => can(userRole, p));
}
