import { uid } from "./id";
import { supabase } from "./supabase";

/**
 * Foto do personagem. A ficha guarda só a URL (`Character.photo`):
 * - nuvem: URL pública do bucket `portraits` (migration `portraits`), em `<user_id>/<character_id>/<arquivo>`;
 * - modo local: data URL, salva junto com a ficha no localStorage.
 * Toda foto nova ganha um nome novo, então a URL muda e o cache nunca mostra a antiga.
 */

const BUCKET = "portraits";
/** Lado do quadrado salvo: o palco da iniciativa mostra a 144px, então aguenta tela 2x sem pesar. */
const SIZE = 384;
/** Antes de reduzir: acima disso o navegador pode engasgar pra decodificar. */
const MAX_INPUT_MB = 20;

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));

/** Recorta o centro num quadrado e reduz pra SIZE px. Transparência vira o fundo do app. */
async function squareImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const out = Math.min(SIZE, side);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = out;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#08080a";
  ctx.fillRect(0, 0, out, out);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out);
  bmp.close();
  // navegador que não gera webp devolve png: aí vai jpeg
  const webp = await toBlob(canvas, "image/webp");
  const blob = webp?.type === "image/webp" ? webp : await toBlob(canvas, "image/jpeg");
  if (!blob) throw new Error("canvas vazio");
  return blob;
}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/**
 * Prepara e guarda a foto; devolve a URL pra pôr na ficha. `owner` é o auth.users.id
 * (null no modo local). Os erros já vêm com a mensagem pra mostrar.
 */
export async function storePhoto(owner: string | null, characterId: string, file: File): Promise<string> {
  if (file.size > MAX_INPUT_MB * 1024 * 1024) {
    throw new Error(`imagem grande demais (máx. ${MAX_INPUT_MB} MB).`);
  }
  let blob: Blob;
  try {
    blob = await squareImage(file);
  } catch {
    throw new Error("não deu pra ler essa imagem. use png, jpg ou webp.");
  }
  if (!owner || !supabase) return toDataUrl(blob);

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${owner}/${characterId}/${uid()}.${ext}`;
  const bucket = supabase.storage.from(BUCKET);
  const { error } = await bucket.upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
  if (error) throw new Error(`a foto não subiu: ${error.message}`);
  return bucket.getPublicUrl(path).data.publicUrl;
}

const PUBLIC_PREFIX = `/object/public/${BUCKET}/`;

/** Apaga do Storage uma foto que saiu da ficha. Data URL (modo local) não tem o que apagar. */
export function removePhoto(url: string | undefined) {
  const at = url?.indexOf(PUBLIC_PREFIX) ?? -1;
  if (!url || at < 0 || !supabase) return;
  const path = decodeURIComponent(url.slice(at + PUBLIC_PREFIX.length));
  // sem await: se falhar, sobra só um arquivo solto no bucket
  void supabase.storage.from(BUCKET).remove([path]);
}
