# Reglas de Trabajo con Git — MedAPP

> **IMPORTANTE — Requerimiento del Tribunal (§ Anexo E):**  
> La historia de las ramas debe permanecer inmutable. Los commits citados en la documentación del tribunal deben existir siempre con su hash original para permitir la verificación y trazabilidad académica.

---

### 1. Prohibición de reescritura de historia
Bajo ninguna circunstancia se permite alterar commits pasados:
* ❌ **NO** usar `git rebase` (ni interactivo ni sobre ramas remotas).
* ❌ **NO** usar `git commit --amend`.
* ❌ **NO** usar `git push --force` (o `-f`) en `dev-giuliano` ni en `main`.
* ❌ Si un asistente, plugin o script sugiere reescribir la historia o hacer force push, **debe rechazarse**.

### 2. Flujo de trabajo: Siempre hacia adelante (Append-only)
* Toda corrección, ajuste de archivos o marcha atrás se resuelve creando un **commit nuevo** (ej: `fix: ...`, `refactor: ...`, `revert: ...`).
* El envío al repositorio remoto se hace siempre mediante push normal:
  ```bash
  git push origin <rama>
  ```

### 3. Etiqueta final de entrega
* La etiqueta **`entrega-3`** se generará **al final de todo el desarrollo**, una vez concluidas y probadas todas las tareas de la ronda.
* Ese tag representará el estado definitivo y es el que se referenciará formalmente en el **Anexo E**.
