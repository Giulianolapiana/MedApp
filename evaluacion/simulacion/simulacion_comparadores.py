#!/usr/bin/env python3
"""
Simulación paramétrica con línea base simétrica y dos comparadores (A2-04).

Responde a la observación de la segunda devolución: en el modelo original la
línea base no admitía cancelaciones con aviso, por lo que todo aviso quedaba
atribuido al sistema, y el comparador era "no recordar" aunque el consultorio
típico confirma la agenda por teléfono. Este modelo:

  · Admite avisos de cancelación en la línea base (c0) y atribuye al canal solo
    el aviso INCREMENTAL (Δc).
  · Evalúa dos comparadores:
      C0 · consultorio sin recordatorio sistemático;
      C1 · consultorio que confirma por teléfono a una parte de los pacientes.
    En C1 la llamada también es bidireccional: el paciente contactado puede
    avisar con la misma probabilidad (c0 + Δc) que por WhatsApp. La ventaja de
    MedApp frente a C1 se limita, así, a la cobertura y al efecto del mensaje.
  · Presenta Δc como escenario (0; 0,10; 0,25; 0,40), porque no se encontró un
    ancla bibliográfica para su valor.

El script original (simulacion_medapp.py) se conserva sin cambios para que los
resultados de la versión anterior sigan siendo reproducibles.

Uso:  python simulacion_comparadores.py --escenarios 10000 --semilla 20260916
Salida: resultados/comparadores.json, comparadores_grilla.csv, fig_comparadores.png
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np

CAPACIDAD = 3 * 16 * 20        # 3 profesionales · 16 turnos/día · 20 días
UMBRAL_A = 0.40                 # reducción relativa del ausentismo (§1.6)
UMBRAL_B = 0.15                 # incremento relativo de la ocupación (§1.6)
TOPE_OLVIDO = 0.44              # Briatore et al. (2020)


def lognormal_ic(rng, puntual, inf, sup):
    se = (np.log(sup) - np.log(inf)) / (2 * 1.96)
    return float(np.exp(rng.normal(np.log(puntual), se)))


PARAMETROS = {
    "p0": ("Ausentismo de línea base", "Uniforme(0,23; 0,34)", "Giunta (2019)"),
    "rr_msg": ("RR de asistencia, mensaje frente a no recordar", "Lognormal, IC 95 % 1,03–1,26", "Gurol-Urganci et al. (2013)"),
    "rr_msg_tel": ("RR de asistencia, mensaje frente a llamada", "Lognormal, IC 95 % 0,95–1,02", "Gurol-Urganci et al. (2013)"),
    "tope": ("Ausencias evitables por recordatorio (olvido)", "Fijo 0,44", "Briatore et al. (2020)"),
    "entrega": ("Recordatorios de WhatsApp entregados", "Uniforme(0,85; 0,98)", "Supuesto del autor"),
    "cobertura_tel": ("Pacientes que el personal logra contactar por teléfono (C1)", "Uniforme(0,50; 0,80)", "Supuesto del autor"),
    "c0": ("Ausentes que avisan en la línea base", "Uniforme(0,05; 0,25)", "Supuesto del autor"),
    "dc": ("Aviso incremental atribuible al canal bidireccional", "Escenario: 0; 0,10; 0,25; 0,40", "Sin ancla bibliográfica"),
    "reocupa": ("Reasignación de turnos liberados", "Uniforme(0,00; 0,40)", "Supuesto del autor"),
    "llenado": ("Proporción de la capacidad reservada", "Uniforme(0,75; 0,95)", "Supuesto del autor"),
}


def fraccion_convertida(p0, rr):
    asistencia = min(1.0, (1 - p0) * rr)
    return float(np.clip((asistencia - (1 - p0)) / p0, 0.0, TOPE_OLVIDO))


def mes(rng, reservados, p0, alcance, f, c_alcanzados, c0, reocupa):
    """Un mes operativo. `alcance`: fracción de pacientes que reciben recordatorio
    (y pueden avisar con c_alcanzados); el resto avisa con c0."""
    a = rng.binomial(reservados, p0)                    # intención de ausencia
    alc = rng.binomial(a, alcance)
    no_alc = a - alc
    conv = rng.binomial(alc, f)                         # recuerdan y asisten
    resid = alc - conv
    avisa_alc = rng.binomial(resid, min(1.0, c_alcanzados))
    avisa_no = rng.binomial(no_alc, c0)
    ausentes = (resid - avisa_alc) + (no_alc - avisa_no)
    avisos = avisa_alc + avisa_no
    reasig = rng.binomial(avisos, reocupa)
    p_ns = ausentes / reservados if reservados else 0.0
    aus_reasig = rng.binomial(reasig, min(1.0, p_ns))
    llegan = reservados - avisos + reasig
    no_show = (ausentes + aus_reasig) / llegan
    atendidos = (reservados - a) + conv + (reasig - aus_reasig)
    return no_show, atendidos / CAPACIDAD


def escenario(rng, comparador, dc):
    p0 = rng.uniform(0.23, 0.34)
    rr_msg = lognormal_ic(rng, 1.14, 1.03, 1.26)
    rr_msg_tel = lognormal_ic(rng, 0.99, 0.95, 1.02)
    entrega = rng.uniform(0.85, 0.98)
    cob_tel = rng.uniform(0.50, 0.80)
    c0 = rng.uniform(0.05, 0.25)
    reocupa = rng.uniform(0.0, 0.40)
    reservados = rng.binomial(CAPACIDAD, rng.uniform(0.75, 0.95))
    dc = rng.uniform(0.0, 0.40) if dc is None else dc

    f_msg = fraccion_convertida(p0, rr_msg)
    f_tel = fraccion_convertida(p0, rr_msg / rr_msg_tel)   # llamada ≈ mensaje

    if comparador == "C0":
        ns_b, oc_b = mes(rng, reservados, p0, 0.0, 0.0, c0, c0, reocupa)
    else:
        ns_b, oc_b = mes(rng, reservados, p0, cob_tel, f_tel, c0 + dc, c0, reocupa)
    ns_m, oc_m = mes(rng, reservados, p0, entrega, f_msg, c0 + dc, c0, reocupa)
    return 1 - ns_m / ns_b, oc_m / oc_b - 1, ns_b, ns_m


def resumen(v):
    v = np.asarray(v)
    return dict(p05=float(np.percentile(v, 5)), mediana=float(np.median(v)), p95=float(np.percentile(v, 95)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--escenarios", type=int, default=10_000)
    ap.add_argument("--semilla", type=int, default=20260916)
    ap.add_argument("--salida", default=str(Path(__file__).parent / "resultados"))
    args = ap.parse_args()
    out = Path(args.salida); out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(args.semilla)

    grilla, general = [], {}
    for comp in ("C0", "C1"):
        for dc in (0.0, 0.10, 0.25, 0.40, None):
            res = [escenario(rng, comp, dc) for _ in range(args.escenarios)]
            red = np.array([r[0] for r in res]); ocu = np.array([r[1] for r in res])
            fila = dict(comparador=comp, dc="U(0; 0,40)" if dc is None else dc,
                        reduccion_mediana=float(np.median(red)),
                        reduccion_p05=float(np.percentile(red, 5)), reduccion_p95=float(np.percentile(red, 95)),
                        prob_umbral_a=float(np.mean(red >= UMBRAL_A)),
                        ocupacion_mediana=float(np.median(ocu)),
                        prob_umbral_b=float(np.mean(ocu >= UMBRAL_B)),
                        no_show_base_mediana=float(np.median([r[2] for r in res])),
                        no_show_medapp_mediana=float(np.median([r[3] for r in res])))
            grilla.append(fila)
            if dc is None:
                general[comp] = fila

    (out / "comparadores.json").write_text(json.dumps(
        dict(semilla=args.semilla, escenarios_por_celda=args.escenarios, parametros=PARAMETROS,
             grilla=grilla, incertidumbre_completa=general), ensure_ascii=False, indent=2), encoding="utf-8")
    with open(out / "comparadores_grilla.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(grilla[0].keys())); w.writeheader(); w.writerows(grilla)

    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({"font.size": 10, "font.family": "DejaVu Sans"})
    fig, ax = plt.subplots(1, 2, figsize=(11, 4))
    xs = [0.0, 0.10, 0.25, 0.40]
    for comp, color, etq in (("C0", "#2b6cb0", "Frente a no recordar (C0)"), ("C1", "#c05621", "Frente a confirmación telefónica (C1)")):
        filas = [g for g in grilla if g["comparador"] == comp and g["dc"] != "U(0; 0,40)"]
        ax[0].plot([x * 100 for x in xs], [f["reduccion_mediana"] * 100 for f in filas], "o-", color=color, label=etq)
        ax[0].fill_between([x * 100 for x in xs], [f["reduccion_p05"] * 100 for f in filas], [f["reduccion_p95"] * 100 for f in filas], color=color, alpha=0.12)
        ax[1].plot([x * 100 for x in xs], [f["prob_umbral_a"] * 100 for f in filas], "o-", color=color, label=etq)
    ax[0].axhline(40, color="#c53030", ls="--", lw=1, label="Umbral (a): 40 %")
    ax[0].set_xlabel("Aviso incremental atribuible al canal, Δc (%)"); ax[0].set_ylabel("Reducción relativa del ausentismo (%)")
    ax[0].set_title("a) Reducción mediana e intervalo del 90 %"); ax[0].legend(fontsize=8)
    ax[1].set_xlabel("Aviso incremental atribuible al canal, Δc (%)"); ax[1].set_ylabel("Escenarios que cumplen el umbral (a) (%)")
    ax[1].set_ylim(0, 100); ax[1].set_title("b) Probabilidad de cumplir el umbral (a)"); ax[1].legend(fontsize=8)
    fig.tight_layout(); fig.savefig(out / "fig_comparadores.png", dpi=200); plt.close(fig)

    pct = lambda x: f"{x * 100:5.1f} %"
    for g in grilla:
        print(f"{g['comparador']} Δc={str(g['dc']):>10}  reducción {pct(g['reduccion_mediana'])} "
              f"[{pct(g['reduccion_p05'])}–{pct(g['reduccion_p95'])}]  P(a) {pct(g['prob_umbral_a'])}  "
              f"ocupación {pct(g['ocupacion_mediana'])}  P(b) {pct(g['prob_umbral_b'])}  "
              f"ns base {pct(g['no_show_base_mediana'])} → {pct(g['no_show_medapp_mediana'])}")


if __name__ == "__main__":
    main()
