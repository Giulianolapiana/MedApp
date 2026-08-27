import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ──────────────────────────────────────────────────────
export const rolUsuarioEnum = pgEnum('rol_usuario', ['ADMINISTRADOR', 'RECEPCION', 'PROFESIONAL']);
export const canalReservaEnum = pgEnum('canal_reserva', ['web', 'whatsapp', 'manual']);
export const estadoTurnoEnum = pgEnum('estado_turno', ['pendiente', 'confirmado', 'cancelado', 'asistido', 'no_show']);
export const tipoComunicacionEnum = pgEnum('tipo_comunicacion', ['recordatorio', 'confirmacion', 'cancelacion']);

// ─── 1. Clínicas ────────────────────────────────────────────────
export const clinicas = pgTable('clinicas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono'),
  creado_en: timestamp('creado_en', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// ─── 2. Usuarios Administrativos ────────────────────────────────
export const usuariosAdministrativos = pgTable('usuarios_administrativos', {
  id: uuid('id').primaryKey(), // Viene de auth.users
  clinica_id: uuid('clinica_id').references(() => clinicas.id).notNull(),
  nombre: text('nombre').notNull(),
  rol: rolUsuarioEnum('rol').default('RECEPCION').notNull(),
  creado_en: timestamp('creado_en', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// ─── 3. Especialidades ─────────────────────────────────────────
export const especialidades = pgTable('especialidades', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  clinica_id: uuid('clinica_id').references(() => clinicas.id).notNull(),
  creado_en: timestamp('creado_en', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// ─── 4. Profesionales ──────────────────────────────────────────
export const profesionales = pgTable('profesionales', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  especialidad: text('especialidad').notNull(),
  clinica_id: uuid('clinica_id').references(() => clinicas.id).notNull(),
  usuario_id: uuid('usuario_id').references(() => usuariosAdministrativos.id),
  google_calendar_id: text('google_calendar_id'),
  activo: boolean('activo').default(true).notNull(),
  creado_en: timestamp('creado_en', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// ─── 5. Disponibilidad ─────────────────────────────────────────
export const disponibilidad = pgTable('disponibilidad', {
  id: uuid('id').primaryKey().defaultRandom(),
  profesional_id: uuid('profesional_id').references(() => profesionales.id).notNull(),
  clinica_id: uuid('clinica_id').references(() => clinicas.id).notNull(),
  dia_semana: integer('dia_semana').notNull(), // 0=Domingo, 1=Lunes, ..., 6=Sábado
  horario_inicio: text('horario_inicio').notNull(), // "09:00"
  horario_fin: text('horario_fin').notNull(),       // "17:00"
  habilitado: boolean('habilitado').default(true).notNull(),
});

// ─── 6. Pacientes ──────────────────────────────────────────────
export const pacientes = pgTable('pacientes', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre_completo: text('nombre_completo').notNull(),
  telefono_whatsapp: text('telefono_whatsapp').notNull(),
  email: text('email'),
  fecha_nacimiento: text('fecha_nacimiento'),
  clinica_id: uuid('clinica_id').references(() => clinicas.id).notNull(),
  activo: boolean('activo').default(true).notNull(),
  creado_en: timestamp('creado_en', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// ─── 7. Turnos ─────────────────────────────────────────────────
export const turnos = pgTable('turnos', {
  id: uuid('id').primaryKey().defaultRandom(),
  paciente_id: uuid('paciente_id').references(() => pacientes.id).notNull(),
  profesional_id: uuid('profesional_id').references(() => profesionales.id).notNull(),
  clinica_id: uuid('clinica_id').references(() => clinicas.id).notNull(),
  fecha_hora_inicio: text('fecha_hora_inicio').notNull(),
  fecha_hora_fin: text('fecha_hora_fin'),
  estado: estadoTurnoEnum('estado').default('pendiente').notNull(),
  canal_reserva: canalReservaEnum('canal_reserva').default('web').notNull(),
  google_event_id: text('google_event_id'),
  creado_en: timestamp('creado_en', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// ─── 8. Historial de Turnos (append-only, audit trail) ─────────
export const historialTurnos = pgTable('historial_turnos', {
  id: uuid('id').primaryKey().defaultRandom(),
  turno_id: uuid('turno_id').references(() => turnos.id).notNull(),
  estado_desde: text('estado_desde').notNull(),
  estado_hacia: text('estado_hacia').notNull(),
  usuario_id: uuid('usuario_id'),  // quién hizo el cambio (puede ser null si es automático)
  motivo: text('motivo'),
  creado_en: timestamp('creado_en', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// ─── 9. Log Comunicación ───────────────────────────────────────
export const logComunicacion = pgTable('log_comunicacion', {
  id: uuid('id').primaryKey().defaultRandom(),
  turno_id: uuid('turno_id').references(() => turnos.id).notNull(),
  clinica_id: uuid('clinica_id').references(() => clinicas.id).notNull(),
  tipo: tipoComunicacionEnum('tipo').notNull(),
  canal: text('canal').default('whatsapp').notNull(),
  respuesta_paciente: text('respuesta_paciente'),
  timestamp: timestamp('timestamp', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// ─── 10. Backups Auditoria ─────────────────────────────────────
export const backupsAuditoria = pgTable('backups_auditoria', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinica_id: uuid('clinica_id').references(() => clinicas.id).notNull(),
  tipo_artefacto: text('tipo_artefacto').notNull(),
  tipo_ejecucion: text('tipo_ejecucion').notNull(),
  estado: text('estado').notNull(),
  archivo_url: text('archivo_url'),
  creado_en: timestamp('creado_en', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// ─── Relaciones ────────────────────────────────────────────────
export const turnosRelations = relations(turnos, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [turnos.paciente_id],
    references: [pacientes.id],
  }),
  profesional: one(profesionales, {
    fields: [turnos.profesional_id],
    references: [profesionales.id],
  }),
}));
