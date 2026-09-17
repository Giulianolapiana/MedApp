#!/usr/bin/env python3
"""
Simulación paramétrica de Monte Carlo del efecto de MedApp sobre el ausentismo,
la ocupación de agenda y la carga administrativa de un consultorio ambulatorio.

Responde al hallazgo K-03 del tribunal: el modelo, sus parámetros, su origen,
la semilla y el número de corridas quedan declarados, y se incluye un análisis
de sensibilidad que muestra bajo qué supuestos se cumple cada umbral de la
hipótesis. Los resultados son PROYECCIONES condicionadas a los supuestos, no
mediciones empíricas.

Uso:
    python simulacion_medapp.py                 # corrida completa (10.000 escenarios)
    python simulacion_medapp.py --escenarios 2000 --semilla 1

Salidas (carpeta ./resultados):
    resumen.json, escenarios.csv, sensibilidad.csv, umbrales_grilla.csv,
    fig_distribuciones.png, fig_tornado.png, fig_grilla_umbral.png
"""
from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np
from scipy.stats import spearmanr

# ─────────────────────────────────────────────────────────────────────────────
# 1. Estructura del consultorio simulado
# ─────────────────────────────────────────────────────────────────────────────
PROFESIONALES = 3
SLOTS_POR_DIA = 16          # 8 h de atención en turnos de 30 min
DIAS_HABILES = 20           # cuatro semanas operativas
CAPACIDAD = PROFESIONALES * SLOTS_POR_DIA * DIAS_HABILES   # 960 turnos ofrecidos

# ─────────────────────────────────────────────────────────────────────────────
# 2. Parámetros, distribución de incertidumbre y fuente
# ─────────────────────────────────────────────────────────────────────────────
RR_PUNTUAL, RR_IC_INF, RR_IC_SUP = 1.14, 1.03, 1.26
RR_SE_LOG = (np.log(RR_IC_SUP) - np.log(RR_IC_INF)) / (2 * 1.96)

PARAMETROS = {
    "p0": dict(
        desc="Tasa de ausentismo de línea base (sin recordatorio sistemático)",
        dist="Uniforme(0,23; 0,34)", fuente="Giunta (2019): 23 %–34 % en consultas programadas (HIBA)"),
    "rr": dict(
        desc="Riesgo relativo de asistencia con recordatorio por mensajería móvil",
        dist="LogNormal(ln 1,14; EE 0,051) ⇒ IC95 % 1,03–1,26",
        fuente="Gurol-Urganci et al. (2013), revisión Cochrane, 7 estudios, n = 5.841"),
    "tope_olvido": dict(
        desc="Proporción máxima de ausencias evitables por recordatorio (causa: olvido)",
        dist="Fijo 0,44", fuente="Briatore et al. (2020): el olvido explica el 44 % de las inasistencias"),
    "entrega": dict(
        desc="Proporción de recordatorios efectivamente entregados (teléfono válido, WhatsApp activo)",
        dist="Uniforme(0,85; 0,98)", fuente="Supuesto del autor"),
    "cancela": dict(
        desc="Proporción de ausentes residuales que avisan por el canal bidireccional",
        dist="Uniforme(0,10; 0,50)", fuente="Supuesto del autor"),
    "reocupa": dict(
        desc="Probabilidad de reasignar un turno liberado con aviso (sin lista de espera)",
        dist="Uniforme(0,00; 0,40)", fuente="Supuesto del autor"),
    "llenado": dict(
        desc="Proporción de la capacidad reservada",
        dist="Uniforme(0,75; 0,95)", fuente="Supuesto del autor"),
    "autogestion": dict(
        desc="Proporción de reservas que pasan a autogestión (web o WhatsApp)",
        dist="Uniforme(0,20; 0,70)", fuente="Supuesto del autor"),
}

UMBRAL_AUSENTISMO_REL = 0.40     # §1.6: reducción relativa ≥ 40 %
UMBRAL_OCUPACION = 0.15          # §1.6: "incremento ≥ 15 %" (se evalúa relativo y en p.p.)
UMBRAL_TIEMPO = 0.50             # §1.6: reducción ≥ 50 % del tiempo de asignación


@dataclass
class Escenario:
    p0: float
    rr: float
    entrega: float
    cancela: float
    reocupa: float
    llenado: float
    autogestion: float


def muestrear_parametros(rng: np.random.Generator, n: int) -> list[Escenario]:
    return [
        Escenario(
            p0=rng.uniform(0.23, 0.34),
            rr=float(np.exp(rng.normal(np.log(RR_PUNTUAL), RR_SE_LOG))),
            entrega=rng.uniform(0.85, 0.98),
            cancela=rng.uniform(0.10, 0.50),
            reocupa=rng.uniform(0.00, 0.40),
            llenado=rng.uniform(0.75, 0.95),
            autogestion=rng.uniform(0.20, 0.70),
        )
        for _ in range(n)
    ]


def fraccion_evitada(p0: float, rr: float, tope: float = 0.44) -> float:
    """Proporción de ausentes que asisten gracias al recordatorio.
    Asistencia con recordatorio = min(1, (1-p0)·RR). La fracción de ausentes
    convertidos se acota por la proporción de ausencias debidas a olvido."""
    asistencia_con = min(1.0, (1 - p0) * rr)
    convertidos = max(0.0, (asistencia_con - (1 - p0)) / p0)
    return min(convertidos, tope)


def simular(e: Escenario, rng: np.random.Generator) -> dict:
    """Simulación discreta de un mes operativo para un escenario de parámetros."""
    reservados = rng.binomial(CAPACIDAD, e.llenado)

    # ── Línea base: sin recordatorios, cancelación solo por llamada (no modelada)
    ausentes_base = rng.binomial(reservados, e.p0)
    asistidos_base = reservados - ausentes_base

    # ── Con MedApp
    intencion_ausencia = rng.binomial(reservados, e.p0)
    con_recordatorio = rng.binomial(intencion_ausencia, e.entrega)
    sin_recordatorio = intencion_ausencia - con_recordatorio

    f = fraccion_evitada(e.p0, e.rr)
    convertidos = rng.binomial(con_recordatorio, f)            # recuerdan y asisten
    residuales = con_recordatorio - convertidos
    cancelan = rng.binomial(residuales, e.cancela)             # avisan por WhatsApp
    ausentes_med = sin_recordatorio + (residuales - cancelan)  # no-show sin aviso

    reasignados = rng.binomial(cancelan, e.reocupa)
    # Los turnos reasignados heredan el ausentismo del escenario con recordatorio
    p_ns_med = ausentes_med / reservados if reservados else 0.0
    ausentes_reasignados = rng.binomial(reasignados, min(1.0, p_ns_med))

    asistidos_med = (reservados - intencion_ausencia) + convertidos + (reasignados - ausentes_reasignados)
    turnos_med = reservados - cancelan + reasignados           # turnos que llegan al día
    no_show_med = (ausentes_med + ausentes_reasignados) / turnos_med

    no_show_base = ausentes_base / reservados
    ocup_base = asistidos_base / CAPACIDAD
    ocup_med = asistidos_med / CAPACIDAD

    return dict(
        **asdict(e),
        no_show_base=no_show_base,
        no_show_medapp=no_show_med,
        reduccion_no_show_rel=1 - no_show_med / no_show_base,
        ocupacion_base=ocup_base,
        ocupacion_medapp=ocup_med,
        delta_ocupacion_pp=ocup_med - ocup_base,
        delta_ocupacion_rel=ocup_med / ocup_base - 1,
        # Tiempo del personal en asignación: las reservas autogestionadas no consumen
        # tiempo administrativo; la reducción relativa es igual a la proporción migrada.
        reduccion_tiempo_asignacion=e.autogestion,
    )


def resumen(valores: np.ndarray) -> dict:
    return dict(
        media=float(np.mean(valores)), desvio=float(np.std(valores, ddof=1)),
        p05=float(np.percentile(valores, 5)), mediana=float(np.median(valores)),
        p95=float(np.percentile(valores, 95)),
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--escenarios", type=int, default=10_000)
    ap.add_argument("--semilla", type=int, default=20260916)
    ap.add_argument("--salida", default=str(Path(__file__).parent / "resultados"))
    args = ap.parse_args()

    out = Path(args.salida)
    out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(args.semilla)

    escenarios = muestrear_parametros(rng, args.escenarios)
    filas = [simular(e, rng) for e in escenarios]
    cols = list(filas[0].keys())
    M = {c: np.array([f[c] for f in filas]) for c in cols}

    metricas = ["no_show_base", "no_show_medapp", "reduccion_no_show_rel",
                "ocupacion_base", "ocupacion_medapp", "delta_ocupacion_pp",
                "delta_ocupacion_rel", "reduccion_tiempo_asignacion"]
    prob = dict(
        ausentismo_reduccion_rel_40=float(np.mean(M["reduccion_no_show_rel"] >= UMBRAL_AUSENTISMO_REL)),
        ocupacion_incremento_rel_15=float(np.mean(M["delta_ocupacion_rel"] >= UMBRAL_OCUPACION)),
        ocupacion_incremento_15_pp=float(np.mean(M["delta_ocupacion_pp"] >= UMBRAL_OCUPACION)),
        tiempo_asignacion_reduccion_50=float(np.mean(M["reduccion_tiempo_asignacion"] >= UMBRAL_TIEMPO)),
    )

    # Escenario central determinista (valores medios de cada rango)
    central = Escenario(p0=0.285, rr=RR_PUNTUAL, entrega=0.915, cancela=0.30,
                        reocupa=0.20, llenado=0.85, autogestion=0.45)
    central_runs = [simular(central, rng) for _ in range(1000)]
    central_res = {m: resumen(np.array([r[m] for r in central_runs])) for m in metricas}

    # Sensibilidad: correlación de rangos de Spearman parámetro → resultado
    params = ["p0", "rr", "entrega", "cancela", "reocupa", "llenado", "autogestion"]
    sens = []
    for m in ["reduccion_no_show_rel", "delta_ocupacion_rel", "delta_ocupacion_pp"]:
        for p in params:
            rho = spearmanr(M[p], M[m]).statistic
            sens.append(dict(resultado=m, parametro=p, spearman=float(rho)))

    # Grilla de umbral: P(reducción ≥ 40 %) según 'cancela' y 'entrega'
    grilla = []
    for c in np.linspace(0.10, 0.50, 9):
        for ent in np.linspace(0.85, 0.98, 6):
            sub = [simular(Escenario(rng.uniform(0.23, 0.34),
                                     float(np.exp(rng.normal(np.log(RR_PUNTUAL), RR_SE_LOG))),
                                     ent, c, 0.2, 0.85, 0.45), rng)["reduccion_no_show_rel"]
                   for _ in range(400)]
            grilla.append(dict(cancela=round(float(c), 3), entrega=round(float(ent), 3),
                               prob_umbral_40=float(np.mean(np.array(sub) >= UMBRAL_AUSENTISMO_REL)),
                               mediana_reduccion=float(np.median(sub))))

    res = dict(
        configuracion=dict(semilla=args.semilla, escenarios=args.escenarios,
                           profesionales=PROFESIONALES, slots_por_dia=SLOTS_POR_DIA,
                           dias_habiles=DIAS_HABILES, capacidad_mensual=CAPACIDAD,
                           corridas_escenario_central=1000, corridas_por_celda_grilla=400),
        parametros=PARAMETROS,
        resultados_incertidumbre={m: resumen(M[m]) for m in metricas},
        probabilidad_cumplir_umbral=prob,
        escenario_central=dict(parametros=asdict(central),
                               fraccion_evitada=fraccion_evitada(central.p0, central.rr),
                               resultados=central_res),
        sensibilidad=sens,
    )
    (out / "resumen.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    for nombre, datos in [("escenarios.csv", filas), ("sensibilidad.csv", sens), ("umbrales_grilla.csv", grilla)]:
        with open(out / nombre, "w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=list(datos[0].keys()))
            w.writeheader()
            w.writerows(datos)

    graficar(M, sens, grilla, out)
    imprimir(res)


def graficar(M, sens, grilla, out: Path) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    plt.rcParams.update({"font.size": 10, "font.family": "DejaVu Sans"})

    fig, ax = plt.subplots(1, 2, figsize=(11, 4))
    ax[0].hist(M["no_show_base"] * 100, bins=40, alpha=0.6, label="Línea base", color="#9aa5b1")
    ax[0].hist(M["no_show_medapp"] * 100, bins=40, alpha=0.7, label="Con MedApp", color="#2b6cb0")
    ax[0].set_xlabel("Tasa de ausentismo (%)"); ax[0].set_ylabel("Escenarios")
    ax[0].set_title("a) Distribución del ausentismo"); ax[0].legend()
    ax[1].hist(M["reduccion_no_show_rel"] * 100, bins=40, color="#2b6cb0", alpha=0.8)
    ax[1].axvline(40, color="#c53030", ls="--", label="Umbral de la hipótesis (40 %)")
    ax[1].set_xlabel("Reducción relativa del ausentismo (%)"); ax[1].set_ylabel("Escenarios")
    ax[1].set_title("b) Reducción relativa proyectada"); ax[1].legend()
    fig.tight_layout(); fig.savefig(out / "fig_distribuciones.png", dpi=200); plt.close(fig)

    nombres = {"p0": "Ausentismo base (p0)", "rr": "Efecto del recordatorio (RR)",
               "entrega": "Recordatorios entregados", "cancela": "Aviso de cancelación",
               "reocupa": "Reasignación de turnos", "llenado": "Llenado de agenda",
               "autogestion": "Autogestión de reservas"}
    fig, ax = plt.subplots(1, 2, figsize=(11, 4))
    for i, (m, t) in enumerate([("reduccion_no_show_rel", "a) Reducción relativa del ausentismo"),
                                ("delta_ocupacion_pp", "b) Variación de ocupación (p.p.)")]):
        d = sorted([s for s in sens if s["resultado"] == m and s["parametro"] != "autogestion"],
                   key=lambda s: abs(s["spearman"]))
        ax[i].barh([nombres[s["parametro"]] for s in d], [s["spearman"] for s in d],
                   color=["#2b6cb0" if s["spearman"] > 0 else "#c53030" for s in d])
        ax[i].axvline(0, color="black", lw=0.8); ax[i].set_xlim(-1, 1)
        ax[i].set_xlabel("Correlación de rangos de Spearman"); ax[i].set_title(t)
    fig.tight_layout(); fig.savefig(out / "fig_tornado.png", dpi=200); plt.close(fig)

    cs = sorted({g["cancela"] for g in grilla}); es = sorted({g["entrega"] for g in grilla})
    Z = np.array([[next(g["prob_umbral_40"] for g in grilla if g["cancela"] == c and g["entrega"] == e)
                   for c in cs] for e in es])
    fig, ax = plt.subplots(figsize=(7, 4))
    im = ax.imshow(Z * 100, origin="lower", aspect="auto", cmap="Blues", vmin=0, vmax=100,
                   extent=[cs[0] * 100, cs[-1] * 100, es[0] * 100, es[-1] * 100])
    cb = fig.colorbar(im); cb.set_label("P(reducción ≥ 40 %) (%)")
    ax.set_xlabel("Ausentes residuales que avisan por WhatsApp (%)")
    ax.set_ylabel("Recordatorios entregados (%)")
    ax.set_title("Probabilidad de cumplir el umbral de ausentismo")
    fig.tight_layout(); fig.savefig(out / "fig_grilla_umbral.png", dpi=200); plt.close(fig)


def imprimir(res: dict) -> None:
    pct = lambda x: f"{x * 100:5.1f} %"
    print(f"Escenarios: {res['configuracion']['escenarios']}  ·  semilla {res['configuracion']['semilla']}")
    for m, r in res["resultados_incertidumbre"].items():
        print(f"  {m:30s} mediana {pct(r['mediana'])}  [P5 {pct(r['p05'])} – P95 {pct(r['p95'])}]")
    print("Probabilidad de cumplir cada umbral:")
    for k, v in res["probabilidad_cumplir_umbral"].items():
        print(f"  {k:35s} {pct(v)}")
    print("Escenario central:")
    for m, r in res["escenario_central"]["resultados"].items():
        print(f"  {m:30s} media {pct(r['media'])} ± {pct(r['desvio'])}")


if __name__ == "__main__":
    main()
