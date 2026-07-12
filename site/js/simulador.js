/* ============================================================
   IBK GREEN ENERGY X — Motores de cálculo
   1) Kit fotovoltaico   2) Bateria / backup   3) Carregador VE
   Todos os pressupostos técnicos estão documentados em comentários.
   ============================================================ */

/* ---------- Dados de irradiação (HSP — horas de sol pico médias/dia)
   Fonte: médias anuais PVGIS por distrito/região, arredondadas. ---------- */
const REGIONS = [
  // Portugal
  { id: "pt-lisboa", name: "Lisboa (PT)", hsp: 5.2 },
  { id: "pt-porto", name: "Porto (PT)", hsp: 4.7 },
  { id: "pt-braga", name: "Braga (PT)", hsp: 4.6 },
  { id: "pt-aveiro", name: "Aveiro (PT)", hsp: 4.8 },
  { id: "pt-coimbra", name: "Coimbra (PT)", hsp: 4.9 },
  { id: "pt-leiria", name: "Leiria (PT)", hsp: 5.0 },
  { id: "pt-santarem", name: "Santarém (PT)", hsp: 5.1 },
  { id: "pt-setubal", name: "Setúbal (PT)", hsp: 5.3 },
  { id: "pt-evora", name: "Évora (PT)", hsp: 5.4 },
  { id: "pt-beja", name: "Beja (PT)", hsp: 5.5 },
  { id: "pt-faro", name: "Faro / Algarve (PT)", hsp: 5.5 },
  { id: "pt-castelo", name: "Castelo Branco (PT)", hsp: 5.2 },
  { id: "pt-guarda", name: "Guarda (PT)", hsp: 4.9 },
  { id: "pt-viseu", name: "Viseu (PT)", hsp: 4.8 },
  { id: "pt-vila", name: "Vila Real (PT)", hsp: 4.7 },
  { id: "pt-braganca", name: "Bragança (PT)", hsp: 4.8 },
  { id: "pt-viana", name: "Viana do Castelo (PT)", hsp: 4.6 },
  { id: "pt-portalegre", name: "Portalegre (PT)", hsp: 5.3 },
  { id: "pt-madeira", name: "Madeira (PT)", hsp: 5.0 },
  { id: "pt-acores", name: "Açores (PT)", hsp: 4.2 },
  // Espanha
  { id: "es-madrid", name: "Madrid (ES)", hsp: 5.3 },
  { id: "es-barcelona", name: "Barcelona (ES)", hsp: 4.9 },
  { id: "es-valencia", name: "Valência (ES)", hsp: 5.3 },
  { id: "es-sevilla", name: "Sevilha (ES)", hsp: 5.7 },
  { id: "es-malaga", name: "Málaga (ES)", hsp: 5.6 },
  { id: "es-murcia", name: "Múrcia (ES)", hsp: 5.5 },
  { id: "es-zaragoza", name: "Saragoça (ES)", hsp: 5.1 },
  { id: "es-bilbao", name: "Bilbau / País Basco (ES)", hsp: 4.0 },
  { id: "es-galicia", name: "Galiza (ES)", hsp: 4.3 },
  { id: "es-badajoz", name: "Badajoz / Extremadura (ES)", hsp: 5.5 },
  { id: "es-canarias", name: "Canárias (ES)", hsp: 5.8 },
  { id: "es-baleares", name: "Baleares (ES)", hsp: 5.2 },
];

/* ---------- Constantes técnicas ---------- */
const TARIFF = 0.22;          // €/kWh — tarifa média ibérica (energia + redes)
const SURPLUS_PRICE = 0.05;   // €/kWh — venda de excedente à rede
const PR = 0.80;              // performance ratio (perdas de sistema)
const PANEL_W = 0.55;         // kWp por painel (módulo 550 W)
const CO2_FACTOR = 0.16;      // kg CO₂/kWh — fator médio da rede ibérica
const INVERTERS = [1.5, 2, 3, 3.68, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];
const BATTERIES = [5, 10, 15, 20, 25, 30]; // kWh nominais
const BATT_DOD = 0.9;         // profundidade de descarga
const BATT_EFF = 0.95;        // eficiência de ciclo

/* preço €/kWp decrescente com a dimensão (chave: até kWp) */
function pvPricePerKwp(kwp) {
  if (kwp <= 3) return 1350;
  if (kwp <= 6) return 1200;
  if (kwp <= 10) return 1080;
  if (kwp <= 20) return 950;
  return 850;
}
function battPrice(kwh) { return 900 + kwh * 420; }           // instalação + €/kWh
function evPrice(kw, tri) { return (tri ? 1450 : 1050) + kw * 55; }

/* utilitários */
const fmt = (n, d = 0) =>
  n.toLocaleString(window.IBK_LANG === "en" ? "en-GB" : "pt-PT", {
    maximumFractionDigits: d, minimumFractionDigits: d,
  });
const eur = (n) => "€ " + fmt(Math.round(n / 10) * 10);

/* ============================================================
   1) KIT FOTOVOLTAICO
   ============================================================ */
function calcPV() {
  const region = REGIONS.find((r) => r.id === document.getElementById("pv-region").value);
  const mode = document.querySelector('input[name="pv-mode"]:checked').value;
  const raw = parseFloat(document.getElementById(mode === "kwh" ? "pv-kwh" : "pv-eur").value);
  const phase = document.querySelector('input[name="pv-phase"]:checked').value;
  const profile = document.querySelector('input[name="pv-profile"]:checked').value;

  if (!region || !raw || raw <= 0) { alert(t("sim.err.fill")); return; }

  // consumo mensal em kWh
  const monthlyKwh = mode === "kwh" ? raw : raw / TARIFF;
  const annualKwh = monthlyKwh * 12;

  // fração de autoconsumo direto conforme o perfil
  const selfUse = { day: 0.85, mix: 0.7, night: 0.55 }[profile];

  // dimensionamento: cobrir o consumo anual com a produção
  let kwp = annualKwh / (region.hsp * 365 * PR);

  // limites práticos: monofásico até ~6 kWp de inversor
  const maxInv = phase === "mono" ? 6 : 30;
  const panels = Math.max(2, Math.round(kwp / PANEL_W));
  kwp = panels * PANEL_W;

  // inversor: 85–100 % da potência de pico, dentro do limite da fase
  let inv = INVERTERS.find((i) => i >= kwp * 0.85) || INVERTERS[INVERTERS.length - 1];
  if (inv > maxInv) inv = maxInv;

  const production = kwp * region.hsp * 365 * PR;                 // kWh/ano
  const selfConsumed = Math.min(production * selfUse, annualKwh); // kWh usados
  const surplus = Math.max(production - selfConsumed, 0);
  const savings = selfConsumed * TARIFF + surplus * SURPLUS_PRICE; // €/ano
  const invest = kwp * pvPricePerKwp(kwp);
  const payback = invest / savings;
  const co2 = (production * CO2_FACTOR) / 1000; // toneladas

  renderResult("pv", {
    hero: `${panels} ${t("sim.res.pv.panels")}`,
    heroSmall: `${t("sim.res.pv.kit")} · ${region.name}`,
    cells: [
      [fmt(kwp, 2) + " kWp", t("sim.res.pv.power")],
      [fmt(inv, inv < 10 ? 1 : 0) + " kW", t("sim.res.pv.inverter")],
      [fmt(production) + " kWh", t("sim.res.pv.prod")],
      [eur(savings) + "/ano", t("sim.res.pv.save")],
      [fmt(payback, 1) + " " + t("sim.res.years"), t("sim.res.pv.payback")],
      [fmt(co2, 1) + " t", t("sim.res.pv.co2")],
    ],
    invest: [eur(invest), t("sim.res.pv.invest")],
  });
}

/* ============================================================
   2) BATERIA / BACKUP
   ============================================================ */
function calcBattery() {
  const monthly = parseFloat(document.getElementById("batt-cons").value);
  const nightPct = parseFloat(document.getElementById("batt-night").value) / 100;
  const hasPV = document.querySelector('input[name="batt-pv"]:checked').value === "yes";
  const backup = document.querySelector('input[name="batt-backup"]:checked').value === "yes";

  if (!monthly || monthly <= 0 || isNaN(nightPct)) { alert(t("sim.err.fill")); return; }

  const daily = monthly / 30;
  const nightEnergy = daily * nightPct; // kWh a deslocar por dia

  // capacidade necessária considerando DoD e eficiência; +20 % se backup
  let needed = nightEnergy / (BATT_DOD * BATT_EFF);
  if (backup) needed *= 1.2;

  const nominal = BATTERIES.find((b) => b * BATT_DOD >= needed) || BATTERIES[BATTERIES.length - 1];
  const usable = nominal * BATT_DOD;
  const shifted = Math.min(nightEnergy, usable * BATT_EFF);

  // poupança: energia deslocada valorizada à tarifa (com PV, o excedente que
  // valia 0,05 € passa a valer 0,22 €; sem PV, arbitragem vazio/cheio ~40 %)
  const perKwhValue = hasPV ? TARIFF - SURPLUS_PRICE : TARIFF * 0.4;
  const savings = shifted * perKwhValue * 365;
  const invest = battPrice(nominal);

  renderResult("batt", {
    hero: `${nominal} kWh`,
    heroSmall: t("sim.res.batt.kit"),
    cells: [
      [fmt(usable, 1) + " kWh", t("sim.res.batt.usable")],
      [fmt(shifted, 1) + " kWh", t("sim.res.batt.shift")],
      [eur(savings) + "/ano", t("sim.res.batt.save")],
      [backup ? t("sim.res.batt.backup.yes") : t("sim.res.batt.backup.no"), t("sim.res.batt.backup")],
    ],
    invest: [eur(invest), t("sim.res.batt.invest")],
  });
}

/* ============================================================
   3) CARREGADOR DE VEÍCULO ELÉTRICO
   ============================================================ */
function calcEV() {
  const km = parseFloat(document.getElementById("ev-km").value);
  const cons = parseFloat(document.getElementById("ev-cons").value) || 17;
  const battCap = parseFloat(document.getElementById("ev-batt").value);
  const supply = document.querySelector('input[name="ev-supply"]:checked').value;
  const contracted = parseFloat(document.getElementById("ev-power").value);
  const windowH = parseFloat(document.querySelector('input[name="ev-window"]:checked').value);

  if (!km || km <= 0 || !battCap || !contracted) { alert(t("sim.err.fill")); return; }

  const dailyKwh = (km * cons) / 100;

  // potência necessária para carregar a energia diária na janela escolhida
  const neededKw = windowH > 0 ? dailyKwh / windowH : 22;

  // opções por tipo de alimentação
  const options = supply === "tri" ? [11, 22] : [3.7, 7.4];

  // margem: reservar ~1,5 kW para o resto da casa
  const headroom = Math.max(contracted - 1.5, 2);

  let charger = options.find((o) => o >= neededKw) || options[options.length - 1];
  let limited = false;
  if (charger > headroom) {
    // escolher a maior opção que caiba na potência disponível
    const fit = [...options].reverse().find((o) => o <= headroom);
    if (fit) { charger = fit; limited = true; }
    else { charger = options[0]; limited = true; }
  }

  const fullCharge = battCap / charger;           // horas (0→100 %)
  const cost100 = (cons * TARIFF).toFixed(2);     // € por 100 km
  const invest = evPrice(charger, supply === "tri");

  renderResult("ev", {
    hero: `Wallbox ${fmt(charger, 1)} kW`,
    heroSmall: t("sim.res.ev.kit") + (supply === "tri" ? " · 400 V" : " · 230 V"),
    cells: [
      [fmt(dailyKwh, 1) + " kWh", t("sim.res.ev.daily")],
      [fmt(fullCharge, 1) + " " + t("sim.res.ev.hours"), t("sim.res.ev.time")],
      ["€ " + cost100, t("sim.res.ev.cost100")],
      ["−70 %", t("sim.res.ev.vs")],
    ],
    invest: [eur(invest), t("sim.res.ev.invest")],
    extraNote: limited ? t("sim.res.ev.note.limit") : null,
  });
}

/* ============================================================
   Renderização do resultado (painel de instrumentos)
   ============================================================ */
function renderResult(kind, data) {
  const box = document.getElementById("sim-result");
  const cells = data.cells
    .map(([v, l]) => `<div class="result-cell"><b>${v}</b><span>${l}</span></div>`)
    .join("");
  const investCell = `<div class="result-cell" style="grid-column:1/-1"><b>${data.invest[0]}</b><span>${data.invest[1]}</span></div>`;
  const extra = data.extraNote ? `<p class="result-note">${data.extraNote}</p>` : "";

  box.innerHTML = `
    <h3>${t("sim.res.title")}</h3>
    <div class="result-hero">${data.hero}<small>${data.heroSmall}</small></div>
    <div class="result-grid">${cells}${investCell}</div>
    ${extra}
    <p class="result-note">${t("sim.res.note")}</p>
    <a class="btn btn-amber" href="contactos.html">${t("sim.res.cta")}</a>
  `;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ============================================================
   Inicialização da página do simulador
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const regionSel = document.getElementById("pv-region");
  if (!regionSel) return; // não estamos na página do simulador

  // popular regiões
  REGIONS.forEach((r) => {
    const o = document.createElement("option");
    o.value = r.id;
    o.textContent = r.name;
    regionSel.appendChild(o);
  });
  regionSel.value = "pt-lisboa";

  // alternar kWh / €
  document.querySelectorAll('input[name="pv-mode"]').forEach((r) =>
    r.addEventListener("change", () => {
      const kwh = document.getElementById("pv-mode-kwh-field");
      const eurF = document.getElementById("pv-mode-eur-field");
      const isKwh = r.value === "kwh" && r.checked;
      kwh.style.display = isKwh ? "" : "none";
      eurF.style.display = isKwh ? "none" : "";
    })
  );

  // tabs
  document.querySelectorAll(".sim-tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      document.querySelectorAll(".sim-tab").forEach((x) => x.classList.remove("active"));
      document.querySelectorAll(".sim-panel").forEach((x) => x.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.panel).classList.add("active");
      resetResult();
    })
  );

  // botões
  document.getElementById("pv-calc").addEventListener("click", calcPV);
  document.getElementById("batt-calc").addEventListener("click", calcBattery);
  document.getElementById("ev-calc").addEventListener("click", calcEV);

  function resetResult() {
    document.getElementById("sim-result").innerHTML =
      `<div class="placeholder"><p data-i18n="sim.res.empty">${t("sim.res.empty")}</p></div>`;
  }

  // atualizar textos do resultado quando muda o idioma
  document.addEventListener("ibk:langchange", resetResult);
});
