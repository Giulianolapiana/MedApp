# Evaluación del artefacto (Capítulo 5 de la tesis)

## Simulación paramétrica (Secciones 5.3 a 5.6, Anexo A.3)

```bash
cd evaluacion/simulacion
pip install -r requirements.txt
python simulacion_comparadores.py --escenarios 10000 --semilla 20260916
python analisis_complementario.py --escenarios 10000 --semilla 20260916
```

`simulacion_comparadores.py` es el modelo vigente: línea base simétrica (c0), aviso incremental
atribuible al canal (Δc) y dos comparadores, no recordar (C0) y confirmar por teléfono (C1), con
números aleatorios comunes por escenario. Genera `comparadores.json`, `comparadores_grilla.csv` y
`fig_comparadores.png` (Tablas 20 a 22 y Figura 27). `analisis_complementario.py` genera
`grilla_fina.csv` y `sin_ruido.csv` (Anexo A.3).

`simulacion_medapp.py` es el modelo inicial, cuya línea base atribuía al sistema todo aviso de
cancelación; se conserva para que sus resultados (`resumen.json`, `escenarios.csv`,
`sensibilidad.csv`, `umbrales_grilla.csv`) sigan siendo reproducibles, pero no es el que informa la tesis.

Los resultados son **proyecciones condicionadas a los supuestos declarados**, no mediciones empíricas.

## Asistente conversacional (Sección 5.7)

- `asistente/protocolo.md`: protocolo de la batería final, fijado antes de ejecutarla.
- `asistente/resultados.md`: resultados de la batería final (13/10/2026) y desvíos respecto del protocolo.
- `asistente/bateria_exploratoria_2026-10-09.md`: batería exploratoria que motivó la corrección del commit `d48fa7a`.

## Pruebas automatizadas (Sección 5.2)

- Unitarias: `cd backend && pnpm test`
- Integración (base creada desde `backend/sql/esquema.sql` con `sql/pruebas/cargar_esquema.sh`):
  `INTEGRACION=1 DATABASE_URL=postgresql://.../medapp_test pnpm test`.
  Cada prueba lleva su ID de la Tabla 18 (PI-01 a PI-24).
