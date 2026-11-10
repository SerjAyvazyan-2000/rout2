// Скачивает фото салона (2ГИС, DIKIDI) в assets/images/salon
// и заменяет ссылки в assets/js/config.js на локальные пути.
// Запуск из корня проекта:  node scripts/download-photos.mjs   (нужен Node 18+)
import { readFile, writeFile, mkdir } from "node:fs/promises";

const CFG = "assets/js/config.js";
const DIR = "assets/images/salon";
let src = await readFile(CFG, "utf8");
await mkdir(DIR, { recursive: true });

const jobs = [];
// G("i8|30258560169922238_c477") — фото из 2ГИС
for (const m of src.matchAll(/(?<![A-Z])G\("([^"|]+)\|([^"]+)"\)/g)) {
  jobs.push({ code: m[0], url: `https://${m[1]}.photo.2gis.com/images/branch/0/${m[2]}.jpg`, file: `2gis-${m[2]}.jpg` });
}
// GG("i4|uuid") — фото посетителей из 2ГИС
for (const m of src.matchAll(/GG\("([^"|]+)\|([^"]+)"\)/g)) {
  jobs.push({ code: m[0], url: `https://${m[1]}.photo.2gis.com/photo-gallery/${m[2]}_1280x.jpg`, file: `2gis-${m[2]}.jpg` });
}
// "https://f1.dikidi.net/....jpg" — фото из DIKIDI
for (const m of src.matchAll(/"(https:\/\/f\d\.dikidi\.(?:ru|net)\/[^"]+?\.jpg)"/g)) {
  jobs.push({ code: m[0], url: m[1], file: `dikidi-${m[1].split("/").pop()}` });
}

// Y("get-altay/…") — фото с сайта-визитки на Яндексе
for (const m of src.matchAll(/(?<![A-Z])Y\("([^"]+)"\)/g)) {
  jobs.push({ code: m[0], url: `https://avatars.mds.yandex.net/${m[1]}/XXXL`, file: `yandex-${m[1].split("/").pop()}.jpg` });
}
// "https://assets.yclients.com/masters/…" — фото мастеров из YCLIENTS
for (const m of src.matchAll(/"(https:\/\/assets\.yclients\.com\/[^"]+?\.(?:jpe?g|png))"/g)) {
  jobs.push({ code: m[0], url: m[1], file: `yclients-${m[1].split("/").pop()}` });
}

for (const j of jobs) {
  const r = await fetch(j.url);
  if (!r.ok) { console.error("Не скачалось:", j.url, r.status); continue; }
  await writeFile(`${DIR}/${j.file}`, Buffer.from(await r.arrayBuffer()));
  src = src.replace(j.code, `"${DIR}/${j.file}"`);
  console.log("OK", j.file);
}
await writeFile(CFG, src);
console.log(`Готово: ${jobs.length} фото, config.js обновлён.`);
