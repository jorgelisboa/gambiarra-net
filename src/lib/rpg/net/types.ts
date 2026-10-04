import type { CatalogBase } from "../gear/types";

export interface CyberdeckDef extends CatalogBase {
  kind: "cyberdeck";
  /** Programas e hardware dividem estes slots. */
  slots: number;
}
