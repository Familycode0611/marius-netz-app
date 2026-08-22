// Netz — lokale Daten, kein Server, nichts verlässt das Gerät.

const STORAGE_KEY = "netz-daten-v1";

function heute() {
  return new Date().toISOString().slice(0, 10);
}

function jetzt() {
  return Date.now();
}

function ladeDaten() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    bloecke: [],
    energieLog: [],
    erfolge: [],
    berufReaktionen: [],
    wellen: []
  };
}

function speichereDaten() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(daten));
}

let daten = ladeDaten();

// ---------- Ideen-Pools ----------

const ALLTAG_POOL = [
  "5 Minuten raus an die frische Luft.",
  "Ein Glas Wasser trinken und kurz durchatmen.",
  "Kurz strecken oder ein paar Kniebeugen.",
  "Fenster aufmachen, tief durchatmen.",
  "Eine Sache aufräumen, die dir gerade ins Auge fällt.",
  "Jemandem eine Nachricht schreiben, den du lange nicht gesprochen hast.",
  "Musik an und 3 Minuten bewegen, wie du willst.",
  "Dich kurz ans Fenster oder auf den Balkon stellen, Licht tanken.",
  "Ein Lied singen oder laut mitsingen.",
  "2 Minuten nichts tun, nur atmen.",
  "Ein paar Klimmzüge im Türrahmen.",
  "Ein paar Sportübungen auf der Matte.",
  "Eine Runde Parcours im Wald drehen.",
  "Was Gesundes kochen."
];

const BERUF_POOL = [
  "Schau dir ein kurzes Video über einen Beruf im Bereich Kommunikation/Medien an.",
  "Frag jemanden aus deinem Umfeld, was ihm an seinem Job gefällt und was nicht.",
  "Schau dir eine Stellenanzeige an, die dich neugierig macht — nur lesen, nichts bewerben.",
  "Recherchier 10 Minuten zu einem Beruf im Bereich Verkauf, Marketing oder Medien.",
  "Überleg: welche Aufgabe hat dir zuletzt richtig Spaß gemacht — auch außerhalb von Schule/Studium?",
  "Schau dir an, was ein Ausbildungsberuf im sozialen oder kommunikativen Bereich beinhaltet.",
  "Sprich 5 Minuten mit jemandem darüber, was er an dir für eine Stärke sieht.",
  "Schau, ob es in deiner Nähe einen Schnuppertag oder ein kurzes Praktikum gibt, das dich reizt.",
  "Denk an eine Situation, in der du jemandem geholfen hast, eine Lösung zu finden — was hat dir dabei gefallen?",
  "Schau dir ein Interview mit jemandem an, der in einem Beruf mit viel Kontakt zu Menschen arbeitet."
];

function zufallAusPool(pool, letzterIndexKey) {
  let letzter = sessionStorage.getItem(letzterIndexKey);
  let index;
  do {
    index = Math.floor(Math.random() * pool.length);
  } while (pool.length > 1 && String(index) === letzter);
  sessionStorage.setItem(letzterIndexKey, String(index));
  return { index, text: pool[index] };
}

// ---------- Navigation ----------

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.target;
    document.querySelectorAll(".modul").forEach(sec => {
      sec.classList.toggle("hidden", sec.dataset.modul !== target);
    });
    if (target === "rueckblick") renderRueckblick();
    if (target === "update") renderUpdate();
  });
});

// ---------- Modul 1: Spinnensinn ----------

document.querySelectorAll(".btn.energie").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn.energie").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    const wert = btn.dataset.wert;

    if (wert === "frustriert") {
      document.getElementById("frust-frage").classList.remove("hidden");
      document.getElementById("spinnensinn-feedback").classList.add("hidden");
    } else {
      document.getElementById("frust-frage").classList.add("hidden");
      daten.energieLog.push({ zeit: jetzt(), datum: heute(), wert });
      speichereDaten();
      zeigeFeedback("spinnensinn-feedback", "Notiert.");
    }
  });
});

document.querySelectorAll("[data-frust]").forEach(btn => {
  btn.addEventListener("click", () => {
    daten.energieLog.push({ zeit: jetzt(), datum: heute(), wert: "frustriert", grund: btn.dataset.frust });
    speichereDaten();
    document.getElementById("frust-frage").classList.add("hidden");
    zeigeFeedback("spinnensinn-feedback", "Notiert. Kein Muss, das gleich zu lösen.");
  });
});

function zeigeFeedback(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

// ---------- Modul 1: Netz auswerfen (Alltag) ----------

document.getElementById("btn-netz-alltag").addEventListener("click", () => {
  const { text } = zufallAusPool(ALLTAG_POOL, "letzterAlltag");
  document.getElementById("netz-alltag-text").textContent = text;
  document.getElementById("netz-alltag-ergebnis").classList.remove("hidden");
  document.getElementById("netz-alltag-ergebnis").dataset.text = text;
});

document.getElementById("btn-alltag-uebernehmen").addEventListener("click", () => {
  const text = document.getElementById("netz-alltag-ergebnis").dataset.text;
  daten.bloecke.push({ id: cryptoId(), zeit: "", aufgabe: text });
  speichereDaten();
  renderBloecke();
  document.getElementById("netz-alltag-ergebnis").classList.add("hidden");
});

// ---------- Modul 1: Tagesrahmen ----------

function cryptoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

document.getElementById("form-block").addEventListener("submit", e => {
  e.preventDefault();
  const zeit = document.getElementById("input-zeit").value.trim();
  const aufgabe = document.getElementById("input-aufgabe").value.trim();
  if (!aufgabe) return;
  daten.bloecke.push({ id: cryptoId(), zeit, aufgabe });
  speichereDaten();
  e.target.reset();
  renderBloecke();
});

function renderBloecke() {
  const ul = document.getElementById("liste-bloecke");
  ul.innerHTML = "";
  if (daten.bloecke.length === 0) {
    ul.innerHTML = '<li class="liste-leer" style="background:none;border:none;">Noch nichts eingetragen — ganz dir überlassen. Falls du nicht weißt, womit du anfangen sollst: probier oben das Netz auswerfen.</li>';
    return;
  }
  daten.bloecke.forEach(b => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${b.zeit ? `<span class="meta">${escapeHtml(b.zeit)}</span> ` : ""}${escapeHtml(b.aufgabe)}</span>
      <button class="del" data-id="${b.id}">✕</button>`;
    ul.appendChild(li);
  });
  ul.querySelectorAll(".del").forEach(btn => {
    btn.addEventListener("click", () => {
      daten.bloecke = daten.bloecke.filter(b => b.id !== btn.dataset.id);
      speichereDaten();
      renderBloecke();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Modul 1: Erfolgs-Log ----------

document.getElementById("form-erfolg").addEventListener("submit", e => {
  e.preventDefault();
  const text = document.getElementById("input-erfolg").value.trim();
  if (!text) return;
  daten.erfolge.push({ id: cryptoId(), datum: heute(), zeit: jetzt(), text });
  speichereDaten();
  e.target.reset();
  renderErfolge();
});

function renderErfolge() {
  const ul = document.getElementById("liste-erfolge");
  ul.innerHTML = "";
  if (daten.erfolge.length === 0) {
    ul.innerHTML = '<li class="liste-leer" style="background:none;border:none;">Noch nichts festgehalten.</li>';
    return;
  }
  [...daten.erfolge].reverse().forEach(x => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${escapeHtml(x.text)}</span><span class="meta">${formatDatum(x.datum)}</span>`;
    ul.appendChild(li);
  });
}

function formatDatum(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

// ---------- Modul 2: Netz auswerfen (Beruf) ----------

let aktuellerBerufImpuls = null;

document.getElementById("btn-netz-beruf").addEventListener("click", () => {
  const { text } = zufallAusPool(BERUF_POOL, "letzterBeruf");
  aktuellerBerufImpuls = text;
  document.getElementById("netz-beruf-text").textContent = text;
  document.getElementById("netz-beruf-ergebnis").classList.remove("hidden");
});

document.getElementById("btn-beruf-ja").addEventListener("click", () => reagiereAufBeruf("ja"));
document.getElementById("btn-beruf-nein").addEventListener("click", () => reagiereAufBeruf("nein"));

function reagiereAufBeruf(reaktion) {
  if (!aktuellerBerufImpuls) return;
  daten.berufReaktionen.push({ id: cryptoId(), datum: heute(), zeit: jetzt(), text: aktuellerBerufImpuls, reaktion });
  speichereDaten();
  document.getElementById("netz-beruf-ergebnis").classList.add("hidden");
  renderJaListe();
}

function renderJaListe() {
  const ul = document.getElementById("liste-ja");
  const jaEintraege = daten.berufReaktionen.filter(r => r.reaktion === "ja");
  ul.innerHTML = "";
  if (jaEintraege.length === 0) {
    ul.innerHTML = '<li class="liste-leer" style="background:none;border:none;">Noch keine Ja-Reaktionen gesammelt.</li>';
    return;
  }
  [...jaEintraege].reverse().forEach(x => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${escapeHtml(x.text)}</span><span class="meta">${formatDatum(x.datum)}</span>`;
    ul.appendChild(li);
  });
}

// ---------- Modul 2: Wellen-Modus ----------

const WELLE_WARTEZEIT_MS = 24 * 60 * 60 * 1000;

document.getElementById("form-welle").addEventListener("submit", e => {
  e.preventDefault();
  const titel = document.getElementById("input-welle").value.trim();
  if (!titel) return;
  daten.wellen.push({
    id: cryptoId(),
    titel,
    erstellt: jetzt(),
    freigabeAb: jetzt() + WELLE_WARTEZEIT_MS,
    status: "wartend"
  });
  speichereDaten();
  e.target.reset();
  renderWellen();
});

function renderWellen() {
  const ul = document.getElementById("liste-wellen");
  ul.innerHTML = "";
  if (daten.wellen.length === 0) {
    ul.innerHTML = '<li class="liste-leer" style="background:none;border:none;">Noch keine große Entscheidung eingetragen.</li>';
    return;
  }
  [...daten.wellen].reverse().forEach(w => {
    const li = document.createElement("li");
    li.style.flexDirection = "column";
    li.style.alignItems = "stretch";

    const bereit = jetzt() >= w.freigabeAb;
    let statusHtml = "";
    let extraHtml = "";

    if (w.status === "bestaetigt") {
      statusHtml = '<span class="welle-status bestaetigt">Fühlt sich gut an</span>';
    } else if (w.status === "verworfen") {
      statusHtml = '<span class="welle-status verworfen">Verworfen</span>';
    } else if (!bereit) {
      const restMs = w.freigabeAb - jetzt();
      statusHtml = `<span class="welle-status wartend">Noch ${formatRest(restMs)}</span>`;
    } else {
      statusHtml = '<span class="welle-status bereit">Bereit zum Reinspüren</span>';
      extraHtml = `
        <div class="welle-reinspueren">
          <button class="btn" data-welle-ja="${w.id}">Fühlt sich heute noch gut an</button>
          <button class="btn btn-secondary" data-welle-mehr="${w.id}">Brauch noch mehr Zeit</button>
          <button class="btn btn-secondary" data-welle-nein="${w.id}">Nein, doch nicht</button>
        </div>`;
    }

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <span>${escapeHtml(w.titel)}</span>
        ${statusHtml}
      </div>
      ${extraHtml}
    `;
    ul.appendChild(li);
  });

  ul.querySelectorAll("[data-welle-ja]").forEach(btn => {
    btn.addEventListener("click", () => setWellenStatus(btn.dataset.welleJa, "bestaetigt"));
  });
  ul.querySelectorAll("[data-welle-nein]").forEach(btn => {
    btn.addEventListener("click", () => setWellenStatus(btn.dataset.welleNein, "verworfen"));
  });
  ul.querySelectorAll("[data-welle-mehr]").forEach(btn => {
    btn.addEventListener("click", () => {
      const w = daten.wellen.find(x => x.id === btn.dataset.welleMehr);
      if (w) w.freigabeAb = jetzt() + WELLE_WARTEZEIT_MS;
      speichereDaten();
      renderWellen();
    });
  });
}

function setWellenStatus(id, status) {
  const w = daten.wellen.find(x => x.id === id);
  if (w) w.status = status;
  speichereDaten();
  renderWellen();
}

function formatRest(ms) {
  const std = Math.floor(ms / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  return `${std}h ${min}min`;
}

setInterval(() => {
  if (document.getElementById("modul-beruf") && !document.getElementById("modul-beruf").classList.contains("hidden")) {
    renderWellen();
  }
}, 60000);

// ---------- Modul 3: Wochenrückblick ----------

function letzte7Tage() {
  const tage = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    tage.push(d.toISOString().slice(0, 10));
  }
  return tage;
}

function renderRueckblick() {
  const tage = letzte7Tage();

  const energieEl = document.getElementById("rueckblick-energie");
  energieEl.innerHTML = "";
  tage.forEach(tag => {
    const eintraege = daten.energieLog.filter(e => e.datum === tag);
    const div = document.createElement("div");
    div.className = "rueckblick-tag";
    const dots = eintraege.length
      ? eintraege.map(e => `<span class="dot ${e.wert}"></span>`).join("")
      : '<span class="hint" style="margin:0;">—</span>';
    div.innerHTML = `<span class="datum">${formatDatum(tag)}</span><span>${dots}</span>`;
    energieEl.appendChild(div);
  });

  const berufEl = document.getElementById("rueckblick-beruf");
  const berufDieseWoche = daten.berufReaktionen.filter(r => tage.includes(r.datum));
  berufEl.innerHTML = "";
  if (berufDieseWoche.length === 0) {
    berufEl.innerHTML = '<p class="hint" style="margin:0;">Diese Woche noch keine Reaktion.</p>';
  } else {
    [...berufDieseWoche].reverse().forEach(r => {
      const div = document.createElement("div");
      div.className = "rueckblick-tag";
      div.innerHTML = `<span class="datum">${formatDatum(r.datum)}</span><span><span class="dot ${r.reaktion}"></span>${escapeHtml(r.text)}</span>`;
      berufEl.appendChild(div);
    });
  }

  const erfolgeEl = document.getElementById("rueckblick-erfolge");
  const erfolgeDieseWoche = daten.erfolge.filter(e => tage.includes(e.datum));
  erfolgeEl.innerHTML = "";
  if (erfolgeDieseWoche.length === 0) {
    erfolgeEl.innerHTML = '<p class="hint" style="margin:0;">Diese Woche noch nichts festgehalten.</p>';
  } else {
    [...erfolgeDieseWoche].reverse().forEach(e => {
      const div = document.createElement("div");
      div.className = "rueckblick-tag";
      div.innerHTML = `<span class="datum">${formatDatum(e.datum)}</span><span>${escapeHtml(e.text)}</span>`;
      erfolgeEl.appendChild(div);
    });
  }
}

// ---------- Modul 4: Update für Mama ----------

function renderUpdate() {
  const heuteIstSonntag = new Date().getDay() === 0;
  document.getElementById("update-intro").textContent = heuteIstSonntag
    ? "Heute ist dein Update-Tag. Magst du deiner Mama zeigen, wo du stehst? Komplett deine Entscheidung."
    : "Kein fester Update-Tag heute — aber wenn du magst, kannst du trotzdem jederzeit was zusammenstellen.";

  const tage = letzte7Tage();
  const auswahlEl = document.getElementById("update-auswahl");
  auswahlEl.innerHTML = "";

  const erfolgeDieseWoche = daten.erfolge.filter(e => tage.includes(e.datum));
  const jaDieseWoche = daten.berufReaktionen.filter(r => tage.includes(r.datum) && r.reaktion === "ja");

  if (erfolgeDieseWoche.length === 0 && jaDieseWoche.length === 0) {
    auswahlEl.innerHTML = '<p class="hint" style="margin:0;">Diese Woche noch nichts, das du auswählen könntest — kein Problem, du kannst trotzdem unten einen eigenen Satz schreiben.</p>';
    return;
  }

  erfolgeDieseWoche.forEach(e => {
    auswahlEl.insertAdjacentHTML("beforeend", `
      <label class="auswahl-item">
        <input type="checkbox" data-typ="erfolg" data-id="${e.id}">
        <span>${escapeHtml(e.text)} <span class="meta">(${formatDatum(e.datum)})</span></span>
      </label>`);
  });

  jaDieseWoche.forEach(r => {
    auswahlEl.insertAdjacentHTML("beforeend", `
      <label class="auswahl-item">
        <input type="checkbox" data-typ="beruf" data-id="${r.id}">
        <span>Impuls ausprobiert: ${escapeHtml(r.text)} <span class="meta">(${formatDatum(r.datum)})</span></span>
      </label>`);
  });
}

document.getElementById("btn-update-erstellen").addEventListener("click", () => {
  const ausgewaehlt = [...document.querySelectorAll("#update-auswahl input:checked")];
  const freitext = document.getElementById("update-freitext").value.trim();

  let teile = [];
  ausgewaehlt.forEach(cb => {
    const id = cb.dataset.id;
    if (cb.dataset.typ === "erfolg") {
      const e = daten.erfolge.find(x => x.id === id);
      if (e) teile.push(`✅ ${e.text}`);
    } else {
      const r = daten.berufReaktionen.find(x => x.id === id);
      if (r) teile.push(`🕸️ Ausprobiert: ${r.text}`);
    }
  });

  let text = "Hey Mama,\n\n";
  if (teile.length > 0) {
    text += teile.join("\n") + "\n\n";
  }
  if (freitext) {
    text += freitext + "\n\n";
  }
  if (teile.length === 0 && !freitext) {
    text += "wollte einfach mal Hallo sagen.\n\n";
  }
  text += "Mehr gibt's aktuell nicht zu berichten, ist aber ok so.";

  document.getElementById("update-ergebnis").value = text;
  document.getElementById("update-ergebnis-card").classList.remove("hidden");
});

document.getElementById("btn-update-kopieren").addEventListener("click", async () => {
  const text = document.getElementById("update-ergebnis").value;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.getElementById("update-ergebnis");
    ta.select();
    document.execCommand("copy");
  }
  zeigeFeedback("update-kopiert-feedback", "Kopiert! Jetzt einfach z.B. bei WhatsApp einfügen.");
});

// ---------- Init ----------

renderBloecke();
renderErfolge();
renderJaListe();
renderWellen();

// ---------- PWA: Service Worker ----------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
