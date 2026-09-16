DO $$ BEGIN
 CREATE TYPE "public"."canal_reserva" AS ENUM('web', 'whatsapp', 'manual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."estado_turno" AS ENUM('pendiente', 'confirmado', 'cancelado', 'asistido', 'no_show');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."rol_usuario" AS ENUM('ADMINISTRADOR', 'RECEPCION', 'PROFESIONAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_comunicacion" AS ENUM('recordatorio', 'confirmacion', 'cancelacion');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backups_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"tipo_artefacto" text NOT NULL,
	"tipo_ejecucion" text NOT NULL,
	"estado" text NOT NULL,
	"archivo_url" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinicas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"telefono" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disponibilidad" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profesional_id" uuid NOT NULL,
	"clinica_id" uuid NOT NULL,
	"dia_semana" integer NOT NULL,
	"horario_inicio" text NOT NULL,
	"horario_fin" text NOT NULL,
	"habilitado" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "especialidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"clinica_id" uuid NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "historial_turnos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turno_id" uuid NOT NULL,
	"estado_desde" text NOT NULL,
	"estado_hacia" text NOT NULL,
	"usuario_id" uuid,
	"motivo" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "log_comunicacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turno_id" uuid NOT NULL,
	"clinica_id" uuid NOT NULL,
	"tipo" "tipo_comunicacion" NOT NULL,
	"canal" text DEFAULT 'whatsapp' NOT NULL,
	"respuesta_paciente" text,
	"mensaje_externo_id" text,
	"detalle" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pacientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre_completo" text NOT NULL,
	"telefono_whatsapp" text NOT NULL,
	"email" text,
	"fecha_nacimiento" text,
	"consentimiento_en" timestamp with time zone,
	"consentimiento_canal" text,
	"clinica_id" uuid NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profesionales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"especialidad" text NOT NULL,
	"clinica_id" uuid NOT NULL,
	"usuario_id" uuid,
	"google_calendar_id" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "turnos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid NOT NULL,
	"profesional_id" uuid NOT NULL,
	"clinica_id" uuid NOT NULL,
	"fecha_hora_inicio" timestamp with time zone NOT NULL,
	"fecha_hora_fin" timestamp with time zone NOT NULL,
	"estado" "estado_turno" DEFAULT 'pendiente' NOT NULL,
	"canal_reserva" "canal_reserva" DEFAULT 'web' NOT NULL,
	"google_event_id" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuarios_administrativos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clinica_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"rol" "rol_usuario" DEFAULT 'RECEPCION' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "backups_auditoria" ADD CONSTRAINT "backups_auditoria_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disponibilidad" ADD CONSTRAINT "disponibilidad_profesional_id_profesionales_id_fk" FOREIGN KEY ("profesional_id") REFERENCES "public"."profesionales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disponibilidad" ADD CONSTRAINT "disponibilidad_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "especialidades" ADD CONSTRAINT "especialidades_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "historial_turnos" ADD CONSTRAINT "historial_turnos_turno_id_turnos_id_fk" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "log_comunicacion" ADD CONSTRAINT "log_comunicacion_turno_id_turnos_id_fk" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "log_comunicacion" ADD CONSTRAINT "log_comunicacion_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profesionales" ADD CONSTRAINT "profesionales_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profesionales" ADD CONSTRAINT "profesionales_usuario_id_usuarios_administrativos_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios_administrativos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_profesional_id_profesionales_id_fk" FOREIGN KEY ("profesional_id") REFERENCES "public"."profesionales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usuarios_administrativos" ADD CONSTRAINT "usuarios_administrativos_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
