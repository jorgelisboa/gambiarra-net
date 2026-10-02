/** Munição que uma arma usa (o "tipo" embaixo do pente na tabela do livro). */
export type AmmoType = "mPistol" | "hPistol" | "vhPistol" | "slug" | "rifle" | "shell" | "arrow" | "grenade" | "rocket";

interface CatalogBase {
  /** Chave salva na ficha: não renomeie. */
  id: string;
  /** Nome do livro (en). */
  name: string;
  namePt: string;
  desc: string;
  /** Eurobucks por compra; null quando o preço não está nestas tabelas. */
  cost: number | null;
}

export interface WeaponStats {
  /** Id da perícia (src/lib/rpg/skills.ts). */
  skill: string;
  /** "3d6"; vazio quando o livro não dá dano direto. */
  damage: string;
  rof: number;
  magazine?: number;
  ammo?: AmmoType;
  /** Null = varia com a arma (armas brancas). */
  hands: number | null;
  concealable: boolean;
  features: string[];
  /** BODY mínimo pra disparar. */
  requiresBody?: number;
}

export type WeaponClass = "melee" | "ranged" | "exotic";

export interface WeaponDef extends CatalogBase, Partial<WeaponStats> {
  kind: "weapon";
  class: WeaponClass;
  examples?: string;
  /** Exótica: a arma comum que ela segue, com as diferenças por cima. */
  base?: string;
}

export interface ArmorDef extends CatalogBase {
  kind: "armor";
  sp: number;
  /** Em REF, DEX e MOVE (0, −2 ou −4). */
  penalty: number;
}

export interface ShieldDef extends CatalogBase {
  kind: "shield";
  hp: number;
}

export interface AmmoDef extends CatalogBase {
  kind: "ammo";
  ammo: AmmoType;
  /** Unidades por compra (munição básica vem de 10 em 10). */
  pack: number;
}

export interface GearDef extends CatalogBase {
  kind: "gear" | "program";
}

export interface FashionDef extends CatalogBase {
  kind: "fashion";
  style: string;
  piece: string;
}

export type CatalogItem = WeaponDef | ArmorDef | ShieldDef | AmmoDef | GearDef | FashionDef;
