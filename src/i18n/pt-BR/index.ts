import { auth } from "./auth";
import { characters } from "./characters";
import { combat } from "./combat";
import { common } from "./common";
import { creation } from "./creation";
import { cyber } from "./cyber";
import { gear } from "./gear";
import { infra } from "./infra";
import { net } from "./net";
import { roles } from "./roles";
import { sheet } from "./sheet";
import { shell } from "./shell";
import { skills } from "./skills";
import { stats } from "./stats";
import { telao } from "./telao";
import { weapons } from "./weapons";

/** pt-BR: um objeto por setor. */
export const ptBR = {
  common,
  stats,
  auth,
  shell,
  telao,
  characters,
  creation,
  roles,
  sheet,
  skills,
  weapons,
  gear,
  combat,
  cyber,
  net,
  infra,
} as const;
