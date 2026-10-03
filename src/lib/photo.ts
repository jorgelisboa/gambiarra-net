import { uid } from "./id";
import { supabase } from "./supabase";

/**
 * Foto do personagem. A ficha guarda só a URL (`Character.photo`):
 * - nuvem: URL pública do bucket `portraits` (migration `portraits`), em `<user_id>/<character_id>/<arquivo>`;
 * - modo local: data URL, salva junto com a ficha no localStorage.
 * Toda foto nova ganha um nome novo, então a URL muda e o cache nunca mostra a antiga.
 */

const BUCKET = "portraits";
/** Retrato salvo: cabe em 576×960 (3:5). O palco da iniciativa mostra a foto na altura da tela. */
const MAX_W = 576;
const MAX_H = 960;
/** Antes de reduzir: acima disso o navegador pode engasgar pra decodificar. */
const MAX_INPUT_MB = 20;

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));

/**
 * Recorta pelo centro e reduz pra caber em MAX_W×MAX_H. Foto em pé fica em pé (até 3:5),
 * deitada vira quadrado. Transparência vira o fundo do app.
 */
async function portraitImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  // largura/altura entre 3:5 e 1:1; o que passar disso é cortado
  const ratio = Math.min(1, Math.max(MAX_W / MAX_H, bmp.width / bmp.height));
  const sw = Math.min(bmp.width, bmp.height * ratio);
  const sh = sw / ratio;
  const scale = Math.min(1, MAX_W / sw, MAX_H / sh);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#08080a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
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
    blob = await portraitImage(file);
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
