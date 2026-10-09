#!/usr/bin/env python3
"""
Análisis complementario del modelo de comparadores (observación M3-07 de la tercera devolución).

No modifica simulacion_comparadores.py: reutiliza sus funciones y agrega dos lecturas.

1. Grilla fina de Δc. Ubica el valor de aviso incremental con el que la mediana de la
   reducción del ausentismo alcanza el umbral (a) del 40 %. Usa los mismos generadores por
   escenario que simulacion_comparadores.py (números aleatorios comunes), por lo que sus
   celdas coinciden con las de la Tabla 21 y entre sí solo difieren por Δc.

2. Variante sin ruido binomial. Reemplaza los sorteos binomiales del mes simulado por sus
   valores esperados. Separa la incertidumbre de los parámetros de la variabilidad
   aleatoria de un único mes: si una proporción de escenarios cambia mucho al quitar el
   ruido, esa proporción refleja sobre todo la variabilidad del mes y no la de los supuestos.

Uso:  python analisis_complementario.py --escenarios 10000 --semilla 20260916
Salida: resultados/grilla_fina.csv y resultados/sin_ruido.csv
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

import numpy as np

import simulacion_comparadores as base


class SinRuido:
    """Envuelve un generador y devuelve el valor esperado de cada binomial."""

    def __init__(self, rng):
        self._rng = rng

    def binomial(self, n, p):
        return n * p

    def __getattr__(self, nombre):  # uniform, normal: siguen sorteando parámetros
        return getattr(self._rng, nombre)


def celda(semilla, escenarios, comparador, dc, sin_ruido=False):
    envolver = SinRuido if sin_ruido else (lambda g: g)
    res = []
    for i in range(escenarios):
        rp, rm = base.generadores(semilla, i)
        res.append(base.escenario(envolver(rp), comparador, dc, envolver(rm)))
    red = np.array([x[0] for x in res])
    return dict(comparador=comparador, dc=dc, sin_ruido=sin_ruido,
                reduccion_mediana=float(np.median(red)),
                prob_umbral_a=float(np.mean(red >= base.UMBRAL_A)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--escenarios", type=int, default=10_000)
    ap.add_argument("--semilla", type=int, default=20260916)
    ap.add_argument("--salida", default=str(Path(__file__).parent / "resultados"))
    a = ap.parse_args()
    out = Path(a.salida); out.mkdir(parents=True, exist_ok=True)

    fina = [celda(a.semilla, a.escenarios, "C0", dc)
            for dc in (0.0, 0.05, 0.10, 0.12, 0.13, 0.14, 0.15, 0.20, 0.25, 0.40)]
    ruido = [celda(a.semilla, a.escenarios, comp, dc, sr)
             for comp in ("C0", "C1") for dc in (0.0, 0.10, 0.25, 0.40) for sr in (False, True)]

    for nombre, filas in (("grilla_fina.csv", fina), ("sin_ruido.csv", ruido)):
        with open(out / nombre, "w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=list(filas[0].keys())); w.writeheader(); w.writerows(filas)

    pct = lambda x: f"{x * 100:5.1f} %"
    print("Grilla fina frente a C0")
    for f in fina:
        print(f"  Δc={f['dc']:.2f}  reducción mediana {pct(f['reduccion_mediana'])}  P(a) {pct(f['prob_umbral_a'])}")
    print("Con y sin ruido binomial")
    for f in ruido:
        print(f"  {f['comparador']} Δc={f['dc']:.2f} {'sin ruido' if f['sin_ruido'] else 'con ruido'}  "
              f"reducción {pct(f['reduccion_mediana'])}  P(a) {pct(f['prob_umbral_a'])}")


if __name__ == "__main__":
    main()
