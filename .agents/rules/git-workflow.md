# Reglas de Git — MedAPP

## Inmutabilidad del Historial (Estricto para Tribunal / Anexo E)

1. **PROHIBIDO REESCRIBIR HISTORIAL:**
   - **NUNCA** usar `git rebase`.
   - **NUNCA** usar `git commit --amend`.
   - **NUNCA** usar `git push --force` ni `git push -f` en `dev-giuliano` ni en ninguna rama compartida.
   - Si alguna herramienta, asistente o subagente propone reescribir la historia, **RECHAZARLA DE INMEDIATO**.

2. **SOLO COMMITS HACIA ADELANTE:**
   - Todo cambio, refactor o corrección debe registrarse mediante un **commit nuevo** convencional (`git commit -m "..."`).
   - Los envíos remotos deben ser siempre mediante push estándar: `git push`.

3. **ETIQUETA DE ENTREGA:**
   - La etiqueta **`entrega-3`** se crea exclusivamente al final de todo el proyecto, cuando esté todo terminado y probado.
   - Ese tag es la versión inmutable citada en el **Anexo E** para la verificación del tribunal.
