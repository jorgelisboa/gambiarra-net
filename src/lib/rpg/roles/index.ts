import type { Role } from "../../types";
import type { RoleDef } from "../types";
import { exec } from "./exec";
import { fixer } from "./fixer";
import { lawman } from "./lawman";
import { media } from "./media";
import { medtech } from "./medtech";
import { netrunner } from "./netrunner";
import { nomad } from "./nomad";
import { rockerboy } from "./rockerboy";
import { solo } from "./solo";
import { tech } from "./tech";

/** Um por role. O Record garante que nenhum role de `ROLES` fica sem definição. */
export const ROLE_DEFS: Record<Role, RoleDef> = {
  Rockerboy: rockerboy,
  Solo: solo,
  Netrunner: netrunner,
  Tech: tech,
  Medtech: medtech,
  Media: media,
  Lawman: lawman,
  Exec: exec,
  Fixer: fixer,
  Nomad: nomad,
};

export const roleDef = (role: Role) => ROLE_DEFS[role];
