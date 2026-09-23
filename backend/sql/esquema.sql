--
-- PostgreSQL database dump
--

\restrict DprfKaJmNdym14jUzDCXxTr0Jeovb8807FTIMf9oJ2JfvgYdtE5jXlYef3ZFE6H

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: canal_reserva; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.canal_reserva AS ENUM (
    'web',
    'whatsapp',
    'manual'
);


--
-- Name: estado_turno; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_turno AS ENUM (
    'pendiente',
    'confirmado',
    'cancelado',
    'asistido',
    'no_show'
);


--
-- Name: rol_usuario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rol_usuario AS ENUM (
    'ADMINISTRADOR',
    'RECEPCION',
    'PROFESIONAL'
);


--
-- Name: tipo_comunicacion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_comunicacion AS ENUM (
    'recordatorio',
    'confirmacion',
    'cancelacion'
);


--
-- Name: get_auth_clinica_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_auth_clinica_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT clinica_id FROM public.usuarios_administrativos WHERE id = auth.uid();
$$;


--
-- Name: get_auth_profesional_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_auth_profesional_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT id FROM public.profesionales WHERE usuario_id = auth.uid();
$$;


--
-- Name: get_auth_rol(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_auth_rol() RETURNS public.rol_usuario
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT rol FROM public.usuarios_administrativos WHERE id = auth.uid();
$$;


--
-- Name: impedir_modificacion_historial(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.impedir_modificacion_historial() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'historial_turnos es de solo inserción';
END $$;


--
-- Name: validar_transicion_turno(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_transicion_turno() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.estado = OLD.estado THEN
    RETURN NEW;
  END IF;
  IF NOT (
       (OLD.estado = 'pendiente'  AND NEW.estado IN ('confirmado','cancelado'))
    OR (OLD.estado = 'confirmado' AND NEW.estado IN ('asistido','cancelado','no_show'))
  ) THEN
    RAISE EXCEPTION 'Transición de estado inválida: % -> %', OLD.estado, NEW.estado
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: backups_auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backups_auditoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinica_id uuid NOT NULL,
    tipo_artefacto character varying(50) NOT NULL,
    tipo_ejecucion character varying(50) NOT NULL,
    estado character varying(20) NOT NULL,
    archivo_url text,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    archivo_ruta text,
    tamano_bytes bigint,
    detalle text
);


--
-- Name: TABLE backups_auditoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.backups_auditoria IS 'Registro de respaldos: respaldo_bd (pg_dump en VPS) y tablero_agenda (Google Sheets).';


--
-- Name: clinicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinicas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(150) NOT NULL,
    telefono character varying(30),
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: disponibilidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disponibilidad (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinica_id uuid NOT NULL,
    profesional_id uuid NOT NULL,
    dia_semana smallint NOT NULL,
    horario_inicio time without time zone NOT NULL,
    horario_fin time without time zone NOT NULL,
    habilitado boolean DEFAULT true NOT NULL,
    CONSTRAINT check_horario_valido CHECK ((horario_fin > horario_inicio)),
    CONSTRAINT disponibilidad_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


--
-- Name: especialidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.especialidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinica_id uuid NOT NULL,
    nombre text NOT NULL,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: historial_turnos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_turnos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    turno_id uuid NOT NULL,
    estado_desde text NOT NULL,
    estado_hacia text NOT NULL,
    usuario_id uuid,
    motivo text,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE historial_turnos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.historial_turnos IS 'Bitácora append-only de transiciones de estado (trigger impide UPDATE/DELETE).';


--
-- Name: log_comunicacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.log_comunicacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinica_id uuid NOT NULL,
    turno_id uuid NOT NULL,
    tipo public.tipo_comunicacion NOT NULL,
    canal character varying(50) DEFAULT 'whatsapp'::character varying NOT NULL,
    "timestamp" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    respuesta_paciente text,
    mensaje_externo_id text,
    detalle text
);


--
-- Name: TABLE log_comunicacion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.log_comunicacion IS 'Mensajes enviados y respuestas del paciente; índice único impide recordatorios duplicados.';


--
-- Name: pacientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pacientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinica_id uuid NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    telefono_whatsapp character varying(30) NOT NULL,
    email character varying(150),
    fecha_nacimiento date,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    consentimiento_en timestamp with time zone,
    consentimiento_canal text
);


--
-- Name: COLUMN pacientes.telefono_whatsapp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pacientes.telefono_whatsapp IS 'Formato E.164 (+549...), normalizado por la API.';


--
-- Name: COLUMN pacientes.consentimiento_en; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pacientes.consentimiento_en IS 'Momento en que el paciente aceptó la política de privacidad (Ley 25.326).';


--
-- Name: profesionales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profesionales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinica_id uuid NOT NULL,
    usuario_id uuid,
    nombre character varying(150) NOT NULL,
    especialidad character varying(100) NOT NULL,
    google_calendar_id character varying(255),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: turnos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.turnos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinica_id uuid NOT NULL,
    paciente_id uuid NOT NULL,
    profesional_id uuid NOT NULL,
    fecha_hora_inicio timestamp with time zone NOT NULL,
    fecha_hora_fin timestamp with time zone NOT NULL,
    estado public.estado_turno DEFAULT 'pendiente'::public.estado_turno NOT NULL,
    canal_reserva public.canal_reserva DEFAULT 'manual'::public.canal_reserva NOT NULL,
    google_event_id character varying(255),
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT turnos_fin_posterior_chk CHECK ((fecha_hora_fin > fecha_hora_inicio))
);


--
-- Name: TABLE turnos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.turnos IS 'Turnos. Invariantes: sin solapamiento por profesional (EXCLUDE), transiciones validadas por trigger, fin > inicio.';


--
-- Name: usuarios_administrativos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios_administrativos (
    id uuid NOT NULL,
    clinica_id uuid NOT NULL,
    nombre character varying(150) NOT NULL,
    rol public.rol_usuario DEFAULT 'RECEPCION'::public.rol_usuario NOT NULL,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: backups_auditoria backups_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backups_auditoria
    ADD CONSTRAINT backups_auditoria_pkey PRIMARY KEY (id);


--
-- Name: backups_auditoria backups_estado_chk; Type: CHECK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public.backups_auditoria
    ADD CONSTRAINT backups_estado_chk CHECK (((estado)::text = ANY ((ARRAY['completado'::character varying, 'fallido'::character varying])::text[]))) NOT VALID;


--
-- Name: backups_auditoria backups_tipo_artefacto_chk; Type: CHECK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public.backups_auditoria
    ADD CONSTRAINT backups_tipo_artefacto_chk CHECK (((tipo_artefacto)::text = ANY ((ARRAY['respaldo_bd'::character varying, 'tablero_agenda'::character varying])::text[]))) NOT VALID;


--
-- Name: clinicas clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_pkey PRIMARY KEY (id);


--
-- Name: disponibilidad disponibilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad
    ADD CONSTRAINT disponibilidad_pkey PRIMARY KEY (id);


--
-- Name: especialidades especialidades_clinica_id_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_clinica_id_nombre_key UNIQUE (clinica_id, nombre);


--
-- Name: especialidades especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_pkey PRIMARY KEY (id);


--
-- Name: historial_turnos historial_turnos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_turnos
    ADD CONSTRAINT historial_turnos_pkey PRIMARY KEY (id);


--
-- Name: log_comunicacion log_comunicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_comunicacion
    ADD CONSTRAINT log_comunicacion_pkey PRIMARY KEY (id);


--
-- Name: pacientes pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_pkey PRIMARY KEY (id);


--
-- Name: profesionales profesionales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_pkey PRIMARY KEY (id);


--
-- Name: turnos turnos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_pkey PRIMARY KEY (id);


--
-- Name: turnos turnos_sin_solapamiento_excl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_sin_solapamiento_excl EXCLUDE USING gist (profesional_id WITH =, tstzrange(fecha_hora_inicio, fecha_hora_fin, '[)'::text) WITH &&) WHERE ((estado = ANY (ARRAY['pendiente'::public.estado_turno, 'confirmado'::public.estado_turno])));


--
-- Name: pacientes unq_paciente_telefono_por_clinica; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT unq_paciente_telefono_por_clinica UNIQUE (clinica_id, telefono_whatsapp);


--
-- Name: usuarios_administrativos usuarios_administrativos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_administrativos
    ADD CONSTRAINT usuarios_administrativos_pkey PRIMARY KEY (id);


--
-- Name: backups_clinica_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX backups_clinica_fecha_idx ON public.backups_auditoria USING btree (clinica_id, creado_en DESC);


--
-- Name: idx_disponibilidad_profesional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disponibilidad_profesional ON public.disponibilidad USING btree (profesional_id, dia_semana);


--
-- Name: idx_turnos_clinica_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_turnos_clinica_fecha ON public.turnos USING btree (clinica_id, fecha_hora_inicio);


--
-- Name: idx_turnos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_turnos_estado ON public.turnos USING btree (estado);


--
-- Name: idx_turnos_profesional_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_turnos_profesional_fecha ON public.turnos USING btree (profesional_id, fecha_hora_inicio);


--
-- Name: log_comunicacion_un_recordatorio_por_turno; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX log_comunicacion_un_recordatorio_por_turno ON public.log_comunicacion USING btree (turno_id) WHERE (tipo = 'recordatorio'::public.tipo_comunicacion);


--
-- Name: historial_turnos trg_historial_inmutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_historial_inmutable BEFORE DELETE OR UPDATE ON public.historial_turnos FOR EACH ROW EXECUTE FUNCTION public.impedir_modificacion_historial();


--
-- Name: turnos trg_validar_transicion_turno; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_transicion_turno BEFORE UPDATE OF estado ON public.turnos FOR EACH ROW EXECUTE FUNCTION public.validar_transicion_turno();


--
-- Name: backups_auditoria backups_auditoria_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backups_auditoria
    ADD CONSTRAINT backups_auditoria_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: disponibilidad disponibilidad_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad
    ADD CONSTRAINT disponibilidad_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: disponibilidad disponibilidad_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad
    ADD CONSTRAINT disponibilidad_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesionales(id) ON DELETE CASCADE;


--
-- Name: especialidades especialidades_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: historial_turnos historial_turnos_turno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_turnos
    ADD CONSTRAINT historial_turnos_turno_id_fkey FOREIGN KEY (turno_id) REFERENCES public.turnos(id);


--
-- Name: log_comunicacion log_comunicacion_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_comunicacion
    ADD CONSTRAINT log_comunicacion_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: log_comunicacion log_comunicacion_turno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_comunicacion
    ADD CONSTRAINT log_comunicacion_turno_id_fkey FOREIGN KEY (turno_id) REFERENCES public.turnos(id) ON DELETE CASCADE;


--
-- Name: pacientes pacientes_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: profesionales profesionales_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: profesionales profesionales_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios_administrativos(id) ON DELETE SET NULL;


--
-- Name: turnos turnos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: turnos turnos_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE RESTRICT;


--
-- Name: turnos turnos_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesionales(id) ON DELETE RESTRICT;


--
-- Name: usuarios_administrativos usuarios_administrativos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_administrativos
    ADD CONSTRAINT usuarios_administrativos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: usuarios_administrativos usuarios_administrativos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_administrativos
    ADD CONSTRAINT usuarios_administrativos_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: backups_auditoria Admin ve backups de su clinica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin ve backups de su clinica" ON public.backups_auditoria FOR SELECT TO authenticated USING (((clinica_id = public.get_auth_clinica_id()) AND (public.get_auth_rol() = 'ADMINISTRADOR'::public.rol_usuario)));


--
-- Name: turnos Lectura de turnos segun rol; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura de turnos segun rol" ON public.turnos FOR SELECT TO authenticated USING (((clinica_id = public.get_auth_clinica_id()) AND ((public.get_auth_rol() = ANY (ARRAY['ADMINISTRADOR'::public.rol_usuario, 'RECEPCION'::public.rol_usuario])) OR ((public.get_auth_rol() = 'PROFESIONAL'::public.rol_usuario) AND (profesional_id = public.get_auth_profesional_id())))));


--
-- Name: clinicas Usuarios pueden ver su propia clinica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios pueden ver su propia clinica" ON public.clinicas FOR SELECT TO authenticated USING ((id = public.get_auth_clinica_id()));


--
-- Name: usuarios_administrativos Usuarios ven miembros de su clinica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios ven miembros de su clinica" ON public.usuarios_administrativos FOR SELECT TO authenticated USING ((clinica_id = public.get_auth_clinica_id()));


--
-- Name: disponibilidad Ver disponibilidad de la clinica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ver disponibilidad de la clinica" ON public.disponibilidad FOR SELECT TO authenticated USING ((clinica_id = public.get_auth_clinica_id()));


--
-- Name: especialidades Ver especialidades de la clinica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ver especialidades de la clinica" ON public.especialidades FOR SELECT TO authenticated USING ((clinica_id = public.get_auth_clinica_id()));


--
-- Name: log_comunicacion Ver logs de la clinica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ver logs de la clinica" ON public.log_comunicacion FOR SELECT TO authenticated USING ((clinica_id = public.get_auth_clinica_id()));


--
-- Name: pacientes Ver pacientes de la misma clinica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ver pacientes de la misma clinica" ON public.pacientes FOR SELECT TO authenticated USING ((clinica_id = public.get_auth_clinica_id()));


--
-- Name: profesionales Ver profesionales de la clinica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ver profesionales de la clinica" ON public.profesionales FOR SELECT TO authenticated USING ((clinica_id = public.get_auth_clinica_id()));


--
-- Name: backups_auditoria; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backups_auditoria ENABLE ROW LEVEL SECURITY;

--
-- Name: clinicas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: disponibilidad; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.disponibilidad ENABLE ROW LEVEL SECURITY;

--
-- Name: especialidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;

--
-- Name: historial_turnos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historial_turnos ENABLE ROW LEVEL SECURITY;

--
-- Name: log_comunicacion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.log_comunicacion ENABLE ROW LEVEL SECURITY;

--
-- Name: pacientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

--
-- Name: profesionales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profesionales ENABLE ROW LEVEL SECURITY;

--
-- Name: turnos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios_administrativos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios_administrativos ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict DprfKaJmNdym14jUzDCXxTr0Jeovb8807FTIMf9oJ2JfvgYdtE5jXlYef3ZFE6H

