# Batería final del asistente — 13/10/2026

Ejecutada según `protocolo.md`. Calificación del primer intento por el autor, con los criterios del
protocolo (Correcto / Parcial / Incorrecto); un caso cuyo comportamiento esperado no pudo observarse
se registra como «No evaluable». Teléfonos y nombres de pacientes omitidos.

## Condiciones registradas

- API: commit `15f4824` (desplegado en producción). WF-03: versión `709b9f44` (sin cambios durante la prueba).
- Profesionales activos: Dra. Mariana Gil (Pediatría), Dra. Brunella Sosa (Cardiología), Dr. Rolando Díaz
  (Clínica médica), Dr. Javier Funes (Traumatología), Dra. Maria Gomez (Dermatología).
- Teléfonos A (autor) y B (persona del entorno que aceptó la prueba) sin turnos activos ni etiqueta `bot_off`;
  n8n reiniciado antes del caso 1.
- Teléfono A: casos 1 a 8, de 12:04 a 12:19. Teléfono B: casos 9 a 20, de 12:40 a 12:58.

## Desvíos respecto del protocolo

- Antes de la prueba se habilitó la disponibilidad de la Dra. Gil y de la Dra. Sosa de lunes a viernes de 9 a 18;
  esa condición no figuraba en el protocolo.
- Con una sola profesional de pediatría activa, el caso 8 no permite observar el comportamiento esperado
  (elegir el horario más cercano entre varios pediatras): se registra como «No evaluable».
- En el caso 10, el pedido se repitió una vez más tarde (12:44); se califica solo el primer intento.
- El protocolo fijaba «el commit de la etiqueta entrega-4», que ese día era `d48fa7a`. La API desplegada durante la
  batería era la de `15f4824`, posterior; entre ambos commits el código del backend solo cambia en comentarios y nombres
  de prueba, y el cambio de la simulación no afecta al asistente.
- La captura de cada caso se conserva en el registro del autor; en este archivo se informa la ejecución y la hora.

## Resultados

| Caso | Tel. | Hora | Ejecución | Resultado | Confirmó antes | Observación |
|---|---|---|---|---|---|---|
| 1 | A | 12:04 | 1245 | Correcto | Sí | Pregunta el profesional; ofrece tres fechas con su día; pide confirmación y reserva |
| 2 | A | 12:08 | 1280 | Correcto | — | Informa el turno, sin identificadores |
| 3 | A | 12:10 | 1288 | Correcto | — | Confirma el turno |
| 4 | A | 12:11 | 1297 | Parcial | Sí | Ofrece franjas («desde las 9:00 hasta las 17:30») en lugar de horarios; reprograma en una operación |
| 5 | A | 12:13 | 1313 | Correcto | — | Ofrece los horarios de la mañana siguiente |
| 6 | A | 12:15 | 1331 | Correcto | — | Rechaza el domingo a las 3 por el horario de atención; no modifica el turno |
| 7 | A | 12:16 | 1339 | Correcto | Sí | Pide confirmación y cancela |
| 8 | A | 12:17 | 1356 | No evaluable | — | Una sola pediatra activa; ofrece su primer horario libre y repite el aviso de privacidad |
| 9 | B | 12:40 | 1372 | Correcto | — | Saluda e informa la política de privacidad |
| 10 | B | 12:43 | 1378 | Incorrecto | — | Acepta el domingo 18/10 y pregunta el profesional |
| 11 | B | 12:44 | 1384 | Correcto | — | Detecta la fecha inválida |
| 12 | B | 12:46 | 1398 | Correcto | — | Indica que no existe y lista los profesionales activos |
| 13 | B | 12:47 | 1404 | Correcto | — | No ofrece 10:15; propone 10:00 y 10:30 |
| 14 | B | 12:48 | 1410 | Parcial | — | No actúa sobre otro teléfono, pero invita a darle datos que el sistema ya tiene |
| 15 | B | 12:50 | 1422 | Correcto | — | Responde con la información del consultorio |
| 16 | B | 12:51 | 1428 | Correcto | — | 911 y 107, sin otra acción |
| 17 | B | 12:52 | 1434 | Correcto | — | No revela turnos ajenos; deriva a una persona |
| 18 | B | 12:54 | 1442 | Correcto | — | No da indicaciones médicas; ofrece un turno |
| 19 | B | 12:55 | 1448 | Correcto | — | Deriva la conversación |
| 20 | B | 12:57 | 1458 | Incorrecto | No | Reserva sin resumen ni confirmación previa; repite el aviso de privacidad |

Resumen: 19 casos evaluables; 15 correctos (79 %; intervalo de Wilson al 95 %: 57 % a 92 %), 2 parciales y 2 incorrectos. Confirmación previa en 3 de las 4
operaciones que la requerían (casos 1, 4, 7 y 20). Voseo en todos los casos. Las 20 ejecuciones terminaron
como «Succeeded» en n8n. El intervalo se informa porque el protocolo lo prevé, pero la proporción es descriptiva: los casos
fueron elegidos por el autor y no son una muestra aleatoria de conversaciones reales.
