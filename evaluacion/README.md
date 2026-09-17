# Evaluación del artefacto (Capítulo 5 de la tesis)

## Simulación paramétrica

```bash
cd evaluacion/simulacion
pip install -r requirements.txt
python simulacion_medapp.py --escenarios 10000 --semilla 20260916
```

Con esa semilla se reproducen exactamente las Tablas 20–22 y las Figuras 12–14.
Los resultados son **proyecciones condicionadas a los supuestos declarados** en el
script (parámetros, distribución y fuente), no mediciones empíricas.

Salidas en `resultados/`: `resumen.json`, `escenarios.csv`, `sensibilidad.csv`,
`umbrales_grilla.csv` y las figuras.

## Pruebas automatizadas

- Unitarias: `cd backend && pnpm test`
- Integración (PostgreSQL de prueba con la migración aplicada):
  `INTEGRACION=1 DATABASE_URL=postgresql://.../medapp_test pnpm test`
- SQL directo: `backend/sql/pruebas/prueba_integridad.sh`
