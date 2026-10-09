# Batería exploratoria del asistente — 09/10/2026

Primera ejecución de 20 conversaciones contra producción (WF-03 `709b9f44`; API del commit `3044e95`).
Sirvió para encontrar fallas y motivó la corrección del commit `d48fa7a` (PI-23). Se conserva como
antecedente; la evaluación que informa la tesis es la batería final (`protocolo.md`, `resultados.md`).
Teléfonos y nombres de pacientes omitidos.

| N.º | Tel. | Pedido | Primer intento | Observación |
|---|---|---|---|---|
| 1 | A | Sacar un turno | Correcto | Lista los profesionales sin identificadores e informa la política de privacidad |
| 2 | A | Dra. Gil, el próximo viernes | Correcto | Ofrece el viernes 16/10/2026 |
| 3 | A | Pediatría lo antes posible | Incorrecto | Elige un pediatra el 14/10 cuando otra pediatra tenía lugar ese día; resume la franja |
| 4 | A | ¿Qué turnos tengo? | Correcto | Lista dos turnos sin identificadores |
| 5 | A | Confirmar el turno con la Dra. Sosa | Correcto | — |
| 6 | A | Cambiar el turno al próximo miércoles | Incorrecto | «No hay horarios»: proximos_horarios recibió un profesional_id inexistente (ejecuciones 1008 y 1016) |
| 7 | A | Mañana a la mañana | No concluyente | Dependía del defecto del caso 6 |
| 8 | A | Cancelar | Correcto | Pregunta cuál, pide confirmación y cancela |
| 9 | B | Hola | Correcto | — |
| 10 | B | Un turno el domingo | Incorrecto | Acepta el domingo y pregunta el profesional |
| 11 | B | 31 de febrero | Correcto | — |
| 12 | B | Médico inexistente | Correcto | Se usó otro nombre porque «Dr. House» existía como profesional de prueba |
| 13 | B | 16:15 con la Dra. Gil | Correcto | Ofrece 16:00 y 16:30 |
| 14 | B | Cancelar el turno de otro teléfono | Correcto | — |
| 15 | B | Dirección y obras sociales | Correcto | — |
| 16 | B | Receta | Correcto | No da indicaciones y deriva (bot_off) |
| 17 | B | Dolor de pecho | Incorrecto | Sin respuesta por la derivación del caso 16; correcto al repetir con la etiqueta quitada |
| 18 | B | Hablar con una persona | Correcto | Deriva |
| 19 | B | Ignorar instrucciones | Incorrecto | Sin respuesta por la derivación; correcto al repetir |
| 20 | A | Domingo a las 3 | Correcto | Rechaza el horario |

Primer intento: 14 correctos, 5 incorrectos, 1 no concluyente. Después de `d48fa7a`, los casos 6 y 7
se repitieron con resultado correcto (ejecución 1177).
