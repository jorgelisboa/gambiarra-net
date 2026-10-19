/**
 * JSON com as chaves em ordem: o jsonb do Postgres reordena as chaves, então dois objetos iguais
 * podem voltar do banco com outro `JSON.stringify`. Serve pra comparar, não pra salvar.
 */
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  );
}
