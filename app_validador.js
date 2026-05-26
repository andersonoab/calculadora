"use strict";

/*
  Regras conforme solicitado:

  Padrão:
  - 2026 ativo.
  - "Forçar opção" ativo.
  - Radio padrão: "Só deduções legais".

  Base legal:
  - Base legal = rendimento - INSS - dep - pensão - outras

  Base simplificada:
  - Base simplificada = rendimento - desconto_simplificado
  - Não deduz INSS no simplificado (conforme seu pedido)
*/

const el = (id) => document.getElementById(id);

const competenciaEl = el("competencia");
const tipoCalculoEl = el("tipoCalculo");
const rendimentoEl = el("rendimento");
const inssEl = el("inss");
const inssAutoEl = el("inssAuto");
const dependentesEl = el("dependentes");
const pensaoEl = el("pensao");
const outrasDeducoesEl = el("outrasDeducoes");
const plrAnteriorEl = el("plrAnterior");
const irrfPlrAnteriorEl = el("irrfPlrAnterior");
const forcarOpcaoEl = el("forcarOpcao");
const aplicarReducao2026El = el("aplicarReducao2026");
const hintTabelaEl = el("hintTabela");
const hintINSSEl = el("hintINSS");

const btnCalcular = el("btnCalcular");
const btnLimpar = el("btnLimpar");

const kpiBase = el("kpiBase");
const kpiMetodo = el("kpiMetodo");
const kpiIrrfAntes = el("kpiIrrfAntes");
const kpiRedutor = el("kpiRedutor");
const kpiRedutorInfo = el("kpiRedutorInfo");
const kpiIrrfFinal = el("kpiIrrfFinal");

const kpiINSS = el("kpiINSS");
const kpiFGTS = el("kpiFGTS");
const kpiDescontos = el("kpiDescontos");
const kpiLiquido = el("kpiLiquido");

const fgtsPercentEl = el("fgtsPercent");
const fgtsBaseEl = el("fgtsBase");


const tBaseLegal = el("tBaseLegal");
const tAliqLegal = el("tAliqLegal");
const tIrrfLegal = el("tIrrfLegal");
const tBaseSimpl = el("tBaseSimpl");
const tAliqSimpl = el("tAliqSimpl");
const tIrrfSimpl = el("tIrrfSimpl");

const memoriaEl = el("memoria");
const notaBeneficioEl = el("notaBeneficio");

const baseSimplBrutaEl = el("baseSimplBruta"); // vai mostrar: rendimento - simplificado
const baseSimplIREl = el("baseSimplIR");       // vai mostrar: rendimento - INSS (referência)

const rowLegalEl = el("rowLegal");
const rowSimplEl = el("rowSimpl");
const labelRowLegalEl = el("labelRowLegal");
const labelRowSimplEl = el("labelRowSimpl");

/* Barra visual */
const vizCaptionEl = el("vizCaption");
const barPayEl = el("barPay");
const barRedEl = el("barRed");
const barPayLabelEl = el("barPayLabel");
const barRedLabelEl = el("barRedLabel");
const legendPayEl = el("legendPay");
const legendRedEl = el("legendRed");

/* Parâmetros */
const pDependente = el("pDependente");
const pSimplificado = el("pSimplificado");
const pIsencao = el("pIsencao");
const pRedutor2026 = el("pRedutor2026");
const pPLR = el("pPLR");

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseBRNumber(raw) {
  if (raw == null) return 0;
  const s = String(raw).trim();
  if (!s) return 0;
  const normalized = s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const v = Number(normalized);
  return Number.isFinite(v) ? v : 0;
}


function parsePercent(value) {
  const s = String(value ?? "").trim().replace(",", ".");
  const n = parseFloat(s);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function clamp0(v) { return v < 0 ? 0 : v; }

function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/* IRRF */
const TABELAS = {
  "2025_jan_abr": {
    label: "2025 (Jan–Abr)",
    dependente: 189.59,
    simplificado: 564.80,
    faixas: [
      { ate: 2259.20, aliquota: 0.0, deducao: 0.0 },
      { ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
      { ate: 3751.05, aliquota: 0.15,  deducao: 381.44 },
      { ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
      { ate: Infinity, aliquota: 0.275, deducao: 896.00 },
    ],
    isencaoLimite: 2259.20,
  },
  "2025_maio_dez": {
    label: "2025 (A partir de Maio)",
    dependente: 189.59,
    simplificado: 607.20,
    faixas: [
      { ate: 2428.80, aliquota: 0.0, deducao: 0.0 },
      { ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
      { ate: 3751.05, aliquota: 0.15,  deducao: 394.16 },
      { ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
      { ate: Infinity, aliquota: 0.275, deducao: 908.73 },
    ],
    isencaoLimite: 2428.80,
  },
  "2026": {
    label: "2026 (Jan+) + redução até 7.350",
    dependente: 189.59,
    simplificado: 607.20,
    faixas: [
      { ate: 2428.80, aliquota: 0.0, deducao: 0.0 },
      { ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
      { ate: 3751.05, aliquota: 0.15,  deducao: 394.16 },
      { ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
      { ate: Infinity, aliquota: 0.275, deducao: 908.73 },
    ],
    isencaoLimite: 2428.80,
    redutor: { rendaIsenta: 5000.00, rendaMax: 7350.00, coefA: 978.62, coefB: 0.133145 }
  },
};

/* PLR - tributação exclusiva na fonte */
const TABELAS_PLR = {
  "2025_jan_abr": {
    label: "PLR de janeiro a abril/2025",
    faixas: [
      { ate: 7640.80, aliquota: 0.0, deducao: 0.0 },
      { ate: 9922.28, aliquota: 0.075, deducao: 573.06 },
      { ate: 13167.00, aliquota: 0.15, deducao: 1317.23 },
      { ate: 16380.38, aliquota: 0.225, deducao: 2304.76 },
      { ate: Infinity, aliquota: 0.275, deducao: 3123.78 },
    ],
    isencaoLimite: 7640.80,
  },
  "2025_maio_dez": {
    label: "PLR a partir de maio/2025",
    faixas: [
      { ate: 8214.40, aliquota: 0.0, deducao: 0.0 },
      { ate: 9922.28, aliquota: 0.075, deducao: 616.08 },
      { ate: 13167.00, aliquota: 0.15, deducao: 1360.25 },
      { ate: 16380.38, aliquota: 0.225, deducao: 2347.78 },
      { ate: Infinity, aliquota: 0.275, deducao: 3166.80 },
    ],
    isencaoLimite: 8214.40,
  },
  "2026": {
    label: "PLR a partir de maio/2025 (vigente para 2026)",
    faixas: [
      { ate: 8214.40, aliquota: 0.0, deducao: 0.0 },
      { ate: 9922.28, aliquota: 0.075, deducao: 616.08 },
      { ate: 13167.00, aliquota: 0.15, deducao: 1360.25 },
      { ate: 16380.38, aliquota: 0.225, deducao: 2347.78 },
      { ate: Infinity, aliquota: 0.275, deducao: 3166.80 },
    ],
    isencaoLimite: 8214.40,
  },
};

/* INSS */
const INSS_TABELAS = {
  "2025": {
    label: "INSS 2025",
    teto: 8157.41,
    faixas: [
      { ate: 1518.00, aliquota: 0.075 },
      { ate: 2793.88, aliquota: 0.09 },
      { ate: 4190.83, aliquota: 0.12 },
      { ate: 8157.41, aliquota: 0.14 },
    ]
  },
  "2026": {
    label: "INSS 2026 (provisório)",
    teto: 8475.55,
    faixas: [
      { ate: 1621.00, aliquota: 0.075 },
      { ate: 2902.84, aliquota: 0.09 },
      { ate: 4354.27, aliquota: 0.12 },
      { ate: 8475.55, aliquota: 0.14 },
    ]
  }
};

function keyINSS() { return (competenciaEl.value === "2026") ? "2026" : "2025"; }

function calcularINSSProgressivo(salario, tabelaInss) {
  const base = clamp0(salario);
  const tetoBase = Math.min(base, tabelaInss.teto);

  let anterior = 0;
  let total = 0;

  for (const fx of tabelaInss.faixas) {
    const limite = Math.min(tetoBase, fx.ate);
    if (limite > anterior) {
      total += (limite - anterior) * fx.aliquota;
      anterior = limite;
    }
    if (tetoBase <= fx.ate) break;
  }
  return round2(total);
}

function findFaixa(base, faixas) {
  for (const f of faixas) if (base <= f.ate) return f;
  return faixas[faixas.length - 1];
}

function calcularIRRFProgressivo(base, faixas) {
  const b = clamp0(base);
  const faixa = findFaixa(b, faixas);
  if (!faixa || faixa.aliquota === 0) return { irrf: 0, faixa, aliquotaEfetiva: 0 };

  const irrf = clamp0((b * faixa.aliquota) - faixa.deducao);
  const aliquotaEfetiva = b > 0 ? (irrf / b) : 0;
  return { irrf: round2(irrf), faixa, aliquotaEfetiva };
}

/*
  BASES:
  - Legal: deduz INSS e deduções legais
  - Simplificado: não deduz INSS (conforme pedido); só deduz o simplificado do rendimento
*/
function calcularBases({ rendimento, inss, dependentes, pensao, outras, dependenteValor, simplificadoValor }) {
  const dedDependentes = clamp0(dependentes) * dependenteValor;

  const baseAposINSS = clamp0(rendimento - inss);

  const baseLegal = clamp0(baseAposINSS - dedDependentes - pensao - outras);

  const baseSimplificada = clamp0(rendimento - simplificadoValor);

  return {
    baseAposINSS: round2(baseAposINSS),
    baseLegal: round2(baseLegal),
    baseSimplificada: round2(baseSimplificada),
    dedDependentes: round2(dedDependentes),
    simplificadoValor: round2(simplificadoValor),
  };
}

function calcularRedutor2026(renda, impostoAntes, cfgRedutor) {
  if (!cfgRedutor) return { redutor: 0, impostoFinal: impostoAntes, aplicado: false, regra: "Não aplicável" };

  const rendaMensal = clamp0(renda);
  const imposto = clamp0(impostoAntes);

  if (rendaMensal <= cfgRedutor.rendaIsenta) {
    return { redutor: round2(imposto), impostoFinal: 0, aplicado: true, regra: "Renda até R$ 5.000,00: reduz a zero" };
  }
  if (rendaMensal > cfgRedutor.rendaMax) {
    return { redutor: 0, impostoFinal: round2(imposto), aplicado: false, regra: "Acima de R$ 7.350,00: sem redução" };
  }

  const redutorBruto = cfgRedutor.coefA - (cfgRedutor.coefB * rendaMensal);
  const redutor = clamp0(redutorBruto);

  const redutorAplicado = Math.min(imposto, redutor);
  const impostoFinal = clamp0(imposto - redutorAplicado);

  return {
    redutor: round2(redutorAplicado),
    impostoFinal: round2(impostoFinal),
    aplicado: true,
    regra: `Entre R$ 5.000,01 e R$ 7.350,00: redutor = ${cfgRedutor.coefA.toFixed(2).replace(".", ",")} - (${cfgRedutor.coefB} x renda)`
  };
}

function getOpcaoSelecionada() {
  const radios = document.querySelectorAll('input[name="opcao"]');
  for (const r of radios) if (r.checked) return r.value;
  return "legal";
}

function setRadiosEnabled(enabled) {
  const radios = document.querySelectorAll('input[name="opcao"]');
  for (const r of radios) r.disabled = !enabled;
}

function isPLR() {
  return tipoCalculoEl && tipoCalculoEl.value === "plr";
}

function atualizarModoCalculo() {
  const plr = isPLR();
  document.querySelectorAll(".plr-only").forEach((node) => {
    node.style.display = plr ? "grid" : "none";
  });

  if (plr) {
    inssAutoEl.checked = false;
    inssEl.disabled = true;
    inssEl.value = "0,00";
    aplicarReducao2026El.checked = false;
    aplicarReducao2026El.disabled = true;
    hintINSSEl.textContent = "PLR não compõe a base mensal de INSS neste simulador.";
    hintTabelaEl.textContent = "PLR usa tabela exclusiva na fonte e cálculo anual/acumulado.";
  } else {
    aplicarReducao2026El.disabled = competenciaEl.value !== "2026";
    atualizarINSSAuto();
  }
}

function calcularIRRFPLR(plrAcumulada, tabelaPLR) {
  return calcularIRRFProgressivo(plrAcumulada, tabelaPLR.faixas);
}

function atualizarUIParametros() {
  const key = competenciaEl.value;
  const tab = TABELAS[key];
  const tabPLR = TABELAS_PLR[key];

  if (pPLR && tabPLR) {
    const ultima = tabPLR.faixas[tabPLR.faixas.length - 1];
    pPLR.textContent = `${tabPLR.label} | isenção até ${brl.format(tabPLR.isencaoLimite)} | maior faixa ${pct.format(ultima.aliquota)} dedução ${brl.format(ultima.deducao)}`;
  }

  pDependente.textContent = brl.format(tab.dependente);
  pSimplificado.textContent = brl.format(tab.simplificado);
  pIsencao.textContent = brl.format(tab.isencaoLimite);

  if (key === "2026") {
    const r = tab.redutor;
    pRedutor2026.textContent = `Até ${brl.format(r.rendaIsenta)} zera | ${brl.format(r.rendaIsenta + 0.01)} a ${brl.format(r.rendaMax)}: ${r.coefA.toFixed(2).replace(".", ",")} - (${r.coefB} x renda)`;
    aplicarReducao2026El.disabled = false;
    aplicarReducao2026El.checked = true;

  if (fgtsPercentEl) fgtsPercentEl.value = 8;
  if (fgtsBaseEl) fgtsBaseEl.value = "";

  if (kpiINSS) kpiINSS.textContent = brl.format(0);
  if (kpiFGTS) kpiFGTS.textContent = brl.format(0);
  if (kpiDescontos) kpiDescontos.textContent = brl.format(0);
  if (kpiLiquido) kpiLiquido.textContent = brl.format(0);
    hintTabelaEl.textContent = "Tabela mensal + redução do IR para rendas até R$ 7.350,00 (quando habilitado).";
  } else {
    pRedutor2026.textContent = "Não aplicável";
    aplicarReducao2026El.checked = false;
    aplicarReducao2026El.disabled = true;
    hintTabelaEl.textContent = key === "2025_jan_abr"
      ? "Usa a tabela válida de jan a abr/2025."
      : "Usa a tabela válida a partir de maio/2025.";
  }

  atualizarModoCalculo();
}

function atualizarINSSAuto() {
  if (isPLR()) {
    inssEl.disabled = true;
    inssEl.value = "0,00";
    hintINSSEl.textContent = "PLR não compõe a base mensal de INSS neste simulador.";
    return;
  }

  const auto = inssAutoEl.checked;

  if (auto) {
    inssEl.disabled = true;
    const renda = parseBRNumber(rendimentoEl.value);
    const tab = INSS_TABELAS[keyINSS()];
    const inssCalc = calcularINSSProgressivo(renda, tab);

    inssEl.value = round2(inssCalc).toFixed(2).replace(".", ",");
    hintINSSEl.textContent = `Auto ligado: ${tab.label} (teto ${brl.format(tab.teto)}). Campo travado.`;
  } else {
    inssEl.disabled = false;
    hintINSSEl.textContent = "Auto desligado: informe o INSS efetivo do holerite (campo livre).";
  }
}

/* Barra visual */
function setVizBar(irrfAntes, irrfFinal, redutor) {
  const total = clamp0(irrfAntes);
  const pay = clamp0(irrfFinal);
  const red = clamp0(redutor);

  legendPayEl.textContent = brl.format(pay);
  legendRedEl.textContent = brl.format(red);
  vizCaptionEl.textContent = `Total (antes de redução): ${brl.format(total)}`;

  if (total <= 0) {
    barPayEl.style.width = "0%";
    barRedEl.style.width = "0%";
    barPayLabelEl.textContent = "";
    barRedLabelEl.textContent = "";
    barPayEl.title = "";
    barRedEl.title = "";
    return;
  }

  let payPct = (pay / total) * 100;
  let redPct = (red / total) * 100;

  const sum = payPct + redPct;
  if (sum > 100) {
    const factor = 100 / sum;
    payPct *= factor;
    redPct *= factor;
  }

  const minLabelPct = 10;

  barPayEl.style.width = `${payPct.toFixed(2)}%`;
  barRedEl.style.width = `${redPct.toFixed(2)}%`;

  barPayEl.title = `IRRF a pagar: ${brl.format(pay)}`;
  barRedEl.title = `Redução aplicada: ${brl.format(red)}`;

  barPayLabelEl.textContent = payPct >= minLabelPct ? brl.format(pay) : "";
  barRedLabelEl.textContent = redPct >= minLabelPct ? brl.format(red) : "";
}

function setSelectedRow(escolhido) {
  rowLegalEl.classList.remove("selected");
  rowSimplEl.classList.remove("selected");

  if (escolhido === "legal") rowLegalEl.classList.add("selected");
  if (escolhido === "simplificado") rowSimplEl.classList.add("selected");
}

function limpar() {
  competenciaEl.value = "2026";
  tipoCalculoEl.value = "mensal";

  rendimentoEl.value = "";
  dependentesEl.value = 0;
  pensaoEl.value = "";
  outrasDeducoesEl.value = "";
  if (plrAnteriorEl) plrAnteriorEl.value = "";
  if (irrfPlrAnteriorEl) irrfPlrAnteriorEl.value = "";

  inssAutoEl.checked = true;
  inssEl.value = "";
  inssEl.disabled = true;

  forcarOpcaoEl.checked = true;
  setRadiosEnabled(true);

  const radios = document.querySelectorAll('input[name="opcao"]');
  for (const r of radios) r.checked = (r.value === "legal");

  aplicarReducao2026El.checked = true;

  if (fgtsPercentEl) fgtsPercentEl.value = 8;
  if (fgtsBaseEl) fgtsBaseEl.value = "";

  if (kpiINSS) kpiINSS.textContent = brl.format(0);
  if (kpiFGTS) kpiFGTS.textContent = brl.format(0);
  if (kpiDescontos) kpiDescontos.textContent = brl.format(0);
  if (kpiLiquido) kpiLiquido.textContent = brl.format(0);

  kpiBase.textContent = brl.format(0);
  kpiMetodo.textContent = "Método: -";
  kpiIrrfAntes.textContent = brl.format(0);
  kpiRedutor.textContent = brl.format(0);
  kpiRedutorInfo.textContent = "Não aplicado";
  kpiIrrfFinal.textContent = brl.format(0);

  tBaseLegal.textContent = brl.format(0);
  tAliqLegal.textContent = "0,00%";
  tIrrfLegal.textContent = brl.format(0);

  tBaseSimpl.textContent = brl.format(0);
  tAliqSimpl.textContent = "0,00%";
  tIrrfSimpl.textContent = brl.format(0);

  baseSimplBrutaEl.textContent = brl.format(0);
  baseSimplIREl.textContent = brl.format(0);

  memoriaEl.textContent = "";
  notaBeneficioEl.style.display = "none";
  notaBeneficioEl.textContent = "";

  setVizBar(0, 0, 0);
  setSelectedRow(null);

  atualizarUIParametros();
}

function calcular() {
  const key = competenciaEl.value;
  const tab = TABELAS[key];
  const tabPLR = TABELAS_PLR[key];

  const rendimento = parseBRNumber(rendimentoEl.value);

  if (isPLR()) {
    const plrAtual = rendimento;
    const plrAnterior = plrAnteriorEl ? parseBRNumber(plrAnteriorEl.value) : 0;
    const irrfAnterior = irrfPlrAnteriorEl ? parseBRNumber(irrfPlrAnteriorEl.value) : 0;
    const plrAcumulada = round2(plrAtual + plrAnterior);

    const calcPLRTotal = calcularIRRFPLR(plrAcumulada, tabPLR);
    const calcPLRAtual = calcularIRRFPLR(plrAtual, tabPLR);
    const irrfFinal = round2(clamp0(calcPLRTotal.irrf - irrfAnterior));
    const liquido = round2(clamp0(plrAtual - irrfFinal));
    const faixaPLR = calcPLRTotal.faixa;

    kpiINSS.textContent = brl.format(0);
    kpiFGTS.textContent = brl.format(0);
    kpiDescontos.textContent = brl.format(irrfFinal);
    kpiLiquido.textContent = brl.format(liquido);

    kpiBase.textContent = brl.format(plrAcumulada);
    kpiMetodo.textContent = "Método: PLR exclusiva na fonte (anual/acumulada)";
    kpiIrrfAntes.textContent = brl.format(calcPLRTotal.irrf);
    kpiRedutor.textContent = brl.format(irrfAnterior);
    kpiRedutorInfo.textContent = "IRRF de PLR já retido no ano";
    kpiIrrfFinal.textContent = brl.format(irrfFinal);

    if (labelRowLegalEl) labelRowLegalEl.textContent = "PLR atual isolada";
    if (labelRowSimplEl) labelRowSimplEl.textContent = "PLR acumulada no ano";

    tBaseLegal.textContent = brl.format(plrAtual);
    tAliqLegal.textContent = pct.format(calcPLRAtual.aliquotaEfetiva);
    tIrrfLegal.textContent = brl.format(calcPLRAtual.irrf);

    tBaseSimpl.textContent = brl.format(plrAcumulada);
    tAliqSimpl.textContent = pct.format(calcPLRTotal.aliquotaEfetiva);
    tIrrfSimpl.textContent = brl.format(calcPLRTotal.irrf);

    baseSimplBrutaEl.textContent = brl.format(plrAnterior);
    baseSimplIREl.textContent = brl.format(plrAcumulada);

    setSelectedRow("simplificado");
    setVizBar(calcPLRTotal.irrf, irrfFinal, Math.min(calcPLRTotal.irrf, irrfAnterior));

    notaBeneficioEl.style.display = "block";
    notaBeneficioEl.textContent = "PLR é calculada por tabela exclusiva. Se houver PLR anterior no mesmo ano, informe o valor anterior e o IRRF já retido para abater corretamente.";

    const mem = [];
    mem.push(`REGRA/TABELA: ${tabPLR.label}`);
    mem.push("TIPO: PLR (tributação exclusiva na fonte)");
    mem.push("");
    mem.push("ENTRADAS");
    mem.push(`- PLR atual: ${brl.format(plrAtual)}`);
    mem.push(`- PLR anterior no ano: ${brl.format(plrAnterior)}`);
    mem.push(`- PLR acumulada no ano: ${brl.format(plrAcumulada)}`);
    mem.push(`- IRRF PLR já retido no ano: ${brl.format(irrfAnterior)}`);
    mem.push("");
    mem.push("CÁLCULO");
    mem.push(`- Faixa aplicada no acumulado: até ${faixaPLR.ate === Infinity ? "acima da última faixa" : brl.format(faixaPLR.ate)} | alíquota ${pct.format(faixaPLR.aliquota)} | dedução ${brl.format(faixaPLR.deducao)}`);
    mem.push(`- IRRF total da PLR acumulada = ${brl.format(calcPLRTotal.irrf)}`);
    mem.push(`- IRRF desta PLR = IRRF total acumulado - IRRF já retido`);
    mem.push(`  = ${brl.format(calcPLRTotal.irrf)} - ${brl.format(irrfAnterior)} = ${brl.format(irrfFinal)}`);
    mem.push(`- PLR líquida estimada = ${brl.format(plrAtual)} - ${brl.format(irrfFinal)} = ${brl.format(liquido)}`);
    memoriaEl.textContent = mem.join("\n");
    return;
  }

  if (labelRowLegalEl) labelRowLegalEl.textContent = "Deduções legais";
  if (labelRowSimplEl) labelRowSimplEl.textContent = "Desconto simplificado";

  if (inssAutoEl.checked) atualizarINSSAuto();
  const inss = parseBRNumber(inssEl.value);

  const dependentes = parseInt(dependentesEl.value || "0", 10) || 0;
  const pensao = parseBRNumber(pensaoEl.value);
  const outras = parseBRNumber(outrasDeducoesEl.value);

  const { baseAposINSS, baseLegal, baseSimplificada, dedDependentes, simplificadoValor } = calcularBases({
    rendimento,
    inss,
    dependentes,
    pensao,
    outras,
    dependenteValor: tab.dependente,
    simplificadoValor: tab.simplificado
  });

  /* Exibição */
  baseSimplBrutaEl.textContent = brl.format(baseSimplificada); // rendimento - simplificado
  baseSimplIREl.textContent = brl.format(baseAposINSS);        // rendimento - INSS (referência)

  const calcLegal = calcularIRRFProgressivo(baseLegal, tab.faixas);
  const calcSimpl = calcularIRRFProgressivo(baseSimplificada, tab.faixas);

  const forcar = forcarOpcaoEl.checked;
  const opcao = getOpcaoSelecionada();

  let escolhido;
  if (!forcar) {
    escolhido = (calcLegal.irrf <= calcSimpl.irrf) ? "legal" : "simplificado";
  } else {
    escolhido = (opcao === "auto")
      ? ((calcLegal.irrf <= calcSimpl.irrf) ? "legal" : "simplificado")
      : opcao;
  }

  const baseEscolhida = (escolhido === "legal") ? baseLegal : baseSimplificada;
  const irrfAntes = (escolhido === "legal") ? calcLegal.irrf : calcSimpl.irrf;

  let redutorInfo = { redutor: 0, impostoFinal: irrfAntes, aplicado: false, regra: "Não aplicado" };
  const aplicarRedutor = (key === "2026") && aplicarReducao2026El.checked;

  if (aplicarRedutor) redutorInfo = calcularRedutor2026(rendimento, irrfAntes, tab.redutor);

  kpiBase.textContent = brl.format(baseEscolhida);

  if (!forcar) {
    kpiMetodo.textContent = `Método: Automático (mais benéfico) -> ${escolhido === "legal" ? "Deduções legais" : "Desconto simplificado"}`;
  } else {
    kpiMetodo.textContent = `Método: ${escolhido === "legal" ? "Só deduções legais" : (escolhido === "simplificado" ? "Só desconto simplificado" : "Automático")}`;
  }

  kpiIrrfAntes.textContent = brl.format(irrfAntes);
  kpiRedutor.textContent = brl.format(redutorInfo.redutor);
  kpiRedutorInfo.textContent = redutorInfo.aplicado ? redutorInfo.regra : "Não aplicado";
  kpiIrrfFinal.textContent = brl.format(redutorInfo.impostoFinal);

  // Resumo para leigos: INSS, IRRF e FGTS + líquido estimado
  if (kpiINSS) kpiINSS.textContent = brl.format(inss);

  const fgtsPercent = fgtsPercentEl ? parsePercent(fgtsPercentEl.value) : 8;
  const baseFGTS = fgtsBaseEl && fgtsBaseEl.value.trim() ? parseBRNumber(fgtsBaseEl.value) : rendimento;
  const fgts = Math.max(0, baseFGTS) * (fgtsPercent / 100);

  if (kpiFGTS) kpiFGTS.textContent = brl.format(fgts);

  const totalDescontos = Math.max(0, inss) + Math.max(0, redutorInfo.impostoFinal);
  if (kpiDescontos) kpiDescontos.textContent = brl.format(totalDescontos);

  const liquido = Math.max(0, rendimento) - totalDescontos;
  if (kpiLiquido) kpiLiquido.textContent = brl.format(liquido);

  tBaseLegal.textContent = brl.format(baseLegal);
  tAliqLegal.textContent = pct.format(calcLegal.aliquotaEfetiva);
  tIrrfLegal.textContent = brl.format(calcLegal.irrf);

  tBaseSimpl.textContent = brl.format(baseSimplificada);
  tAliqSimpl.textContent = pct.format(calcSimpl.aliquotaEfetiva);
  tIrrfSimpl.textContent = brl.format(calcSimpl.irrf);

  setSelectedRow(escolhido);

  if (calcSimpl.irrf > calcLegal.irrf) {
    notaBeneficioEl.style.display = "block";
    notaBeneficioEl.textContent = `Desconto simplificado não é mais benéfico neste caso (IRRF maior).`;
  } else if (calcLegal.irrf > calcSimpl.irrf) {
    notaBeneficioEl.style.display = "block";
    notaBeneficioEl.textContent = `Desconto simplificado é mais benéfico neste caso.`;
  } else if (calcLegal.irrf === calcSimpl.irrf && (baseLegal !== 0 || baseSimplificada !== 0)) {
    notaBeneficioEl.style.display = "block";
    notaBeneficioEl.textContent = `Os dois métodos resultaram no mesmo IRRF.`;
  } else {
    notaBeneficioEl.style.display = "none";
    notaBeneficioEl.textContent = "";
  }

  setVizBar(irrfAntes, redutorInfo.impostoFinal, redutorInfo.redutor);

  const faixaLegal = calcLegal.faixa;
  const faixaSimpl = calcSimpl.faixa;

  const mem = [];
  mem.push(`REGRA/TABELA IRRF: ${tab.label}`);
  mem.push(`TIPO: ${tipoCalculoEl.value === "mensal" ? "Mensal" : "13º (exclusivo na fonte)"}`);
  mem.push("");
  mem.push("ENTRADAS");
  mem.push(`- Remuneração tributável: ${brl.format(rendimento)}`);
  mem.push(`- INSS: ${brl.format(inss)} ${inssAutoEl.checked ? "(auto)" : "(manual)"}`);
  mem.push(`- Dependentes: ${dependentes} (dedução: ${brl.format(dedDependentes)})`);
  mem.push(`- Pensão dedutível: ${brl.format(pensao)}`);
  mem.push(`- Outras deduções legais: ${brl.format(outras)}`);
  mem.push("");
  mem.push("BASES");
  mem.push(`- Base após INSS (referência) = rendimento - INSS`);
  mem.push(`  = ${brl.format(rendimento)} - ${brl.format(inss)} = ${brl.format(baseAposINSS)}`);
  mem.push(`- Base (Deduções legais) = (rendimento - INSS) - dep - pensão - outras`);
  mem.push(`  = ${brl.format(baseAposINSS)} - ${brl.format(dedDependentes)} - ${brl.format(pensao)} - ${brl.format(outras)} = ${brl.format(baseLegal)}`);
  mem.push(`- Base (Simplificado) = rendimento - desconto simplificado (sem INSS, conforme configuração)`);
  mem.push(`  = ${brl.format(rendimento)} - ${brl.format(simplificadoValor)} = ${brl.format(baseSimplificada)}`);
  mem.push("");
  mem.push("IRRF PELA TABELA PROGRESSIVA (IR = base * alíquota - parcela a deduzir)");
  mem.push(`- Legal: base ${brl.format(baseLegal)} | alíquota ${pct.format(faixaLegal.aliquota)} | dedução ${brl.format(faixaLegal.deducao)} | IRRF ${brl.format(calcLegal.irrf)}`);
  mem.push(`- Simplificado: base ${brl.format(baseSimplificada)} | alíquota ${pct.format(faixaSimpl.aliquota)} | dedução ${brl.format(faixaSimpl.deducao)} | IRRF ${brl.format(calcSimpl.irrf)}`);
  mem.push("");
  mem.push(`ESCOLHA: ${escolhido === "legal" ? "Deduções legais" : "Desconto simplificado"}`);
  mem.push(`- IRRF antes de redução: ${brl.format(irrfAntes)}`);

  if (aplicarRedutor) {
    mem.push("");
    mem.push("REDUÇÃO 2026");
    mem.push(`- Regra: ${redutorInfo.regra}`);
    mem.push(`- Redutor aplicado: ${brl.format(redutorInfo.redutor)}`);
    mem.push(`- IRRF final: ${brl.format(redutorInfo.impostoFinal)}`);
  }

  memoriaEl.textContent = mem.join("\n");
}

function formatarCampoMoedaOnBlur(inputEl) {
  inputEl.addEventListener("blur", () => {
    if (inputEl.disabled) return;
    const v = parseBRNumber(inputEl.value);
    if (!inputEl.value.trim()) return;
    inputEl.value = round2(v).toFixed(2).replace(".", ",");
  });
}

function debounce(fn, waitMs) {
  let t = null;
  return function (...args) {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), waitMs);
  };
}

function init() {
  setRadiosEnabled(true);

  const calcularSeguro = () => {
    if (inssAutoEl.checked) atualizarINSSAuto();
    calcular();
  };

  const recalcularDebounced = debounce(calcularSeguro, 150);

  // Mudanças de configuração (recalcula imediato)
  forcarOpcaoEl.addEventListener("change", () => {
    setRadiosEnabled(forcarOpcaoEl.checked);
    calcularSeguro();
  });

  competenciaEl.addEventListener("change", () => {
    atualizarUIParametros();
    calcularSeguro();
  });

  inssAutoEl.addEventListener("change", () => {
    atualizarINSSAuto();
    calcularSeguro();
  });

  const radios = document.querySelectorAll('input[name="opcao"]');
  radios.forEach((r) => r.addEventListener("change", calcularSeguro));

  // Formatação ao sair do campo
  [rendimentoEl, pensaoEl, outrasDeducoesEl, fgtsBaseEl, plrAnteriorEl, irrfPlrAnteriorEl].forEach((x) => {
    if (x) formatarCampoMoedaOnBlur(x);
  });
  formatarCampoMoedaOnBlur(inssEl);

  // Botões (Calcular pode não existir no modo leigo)
  if (btnCalcular) btnCalcular.addEventListener("click", calcularSeguro);
  btnLimpar.addEventListener("click", limpar);

  // Recalcular enquanto digita (modo leigo)
  const inputsDigitacao = [rendimentoEl, inssEl, pensaoEl, outrasDeducoesEl, fgtsBaseEl, plrAnteriorEl, irrfPlrAnteriorEl];
  inputsDigitacao.forEach((x) => {
    if (!x) return;
    x.addEventListener("input", () => recalcularDebounced());
    x.addEventListener("blur", () => calcularSeguro());
  });

  // Campos numéricos/seleção
  tipoCalculoEl.addEventListener("change", () => {
    atualizarModoCalculo();
    calcularSeguro();
  });

  const inputsMudanca = [dependentesEl, aplicarReducao2026El, fgtsPercentEl];
  inputsMudanca.forEach((x) => {
    if (!x) return;
    x.addEventListener("change", calcularSeguro);
    x.addEventListener("input", () => recalcularDebounced());
  });

  limpar();
  atualizarUIParametros();
  calcularSeguro();
}

init();

