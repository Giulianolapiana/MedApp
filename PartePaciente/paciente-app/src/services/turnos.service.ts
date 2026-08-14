import { supabase, clinicaId } from '../lib/supabase';
import { format, parse, addMinutes, isBefore, isEqual, startOfDay, endOfDay } from 'date-fns';
import type { Slot, DatosPaciente } from '../types';

export async function getDisponibilidadDia(fecha: Date, medicoId: string): Promise<Slot[]> {
  // 1. Obtener el día de la semana (0 = Domingo, 1 = Lunes...)
  // date-fns getDay() retorna 0-6. En JS domingo es 0. 
  // Ojo: ¿Cómo se guardó en la DB? Asumimos domingo = 0.
  const diaSemana = fecha.getDay();

  // 2. Buscar si el médico atiende ese día
  const { data: dispData, error: dispError } = await supabase
    .from('disponibilidad')
    .select('*')
    .eq('clinica_id', clinicaId)
    .eq('profesional_id', medicoId)
    .eq('dia_semana', diaSemana)
    .eq('habilitado', true)
    .single();

  if (dispError || !dispData) {
    return []; // No atiende
  }

  // 3. Generar todos los slots posibles cada 30 minutos
  const fechaStr = format(fecha, 'yyyy-MM-dd');
  const inicio = parse(`${fechaStr} ${dispData.horario_inicio}`, 'yyyy-MM-dd HH:mm:ss', new Date());
  // El formato en la BD puede ser HH:mm o HH:mm:ss
  const inicioLimpio = parse(`${fechaStr} ${dispData.horario_inicio.substring(0, 5)}`, 'yyyy-MM-dd HH:mm', new Date());
  const finLimpio = parse(`${fechaStr} ${dispData.horario_fin.substring(0, 5)}`, 'yyyy-MM-dd HH:mm', new Date());

  const todosLosSlots: string[] = [];
  let actual = inicioLimpio;

  while (isBefore(actual, finLimpio)) {
    todosLosSlots.push(format(actual, 'HH:mm'));
    actual = addMinutes(actual, 30);
  }

  // 4. Buscar turnos ya ocupados en ese día para ese médico
  const fechaInicioStr = startOfDay(fecha).toISOString();
  const fechaFinStr = endOfDay(fecha).toISOString();

  const { data: turnosOcupados } = await supabase
    .from('turnos')
    .select('fecha_hora_inicio')
    .eq('clinica_id', clinicaId)
    .eq('profesional_id', medicoId)
    .in('estado', ['pendiente', 'confirmado'])
    .gte('fecha_hora_inicio', fechaInicioStr)
    .lte('fecha_hora_inicio', fechaFinStr);

  const horasOcupadas = (turnosOcupados || []).map(t => {
    // Convertimos la fecha ISO a HH:mm local
    return format(new Date(t.fecha_hora_inicio), 'HH:mm');
  });

  // 5. Retornar los slots indicando cuáles están libres
  return todosLosSlots.map(hora => ({
    hora,
    disponible: !horasOcupadas.includes(hora)
  }));
}

export async function crearTurno(medicoId: string, fecha: Date, hora: string, pacienteInfo: DatosPaciente) {
  // 1. Upsert del paciente (por teléfono)
  const { data: pacienteData, error: pacError } = await supabase
    .from('pacientes')
    .upsert({
      clinica_id: clinicaId,
      nombre_completo: `${pacienteInfo.nombre} ${pacienteInfo.apellido}`,
      telefono_whatsapp: pacienteInfo.celular,
      email: pacienteInfo.email,
      activo: true
    }, { onConflict: 'clinica_id,telefono_whatsapp' })
    .select()
    .single();

  if (pacError || !pacienteData) {
    throw new Error('Error al guardar datos del paciente: ' + pacError?.message);
  }

  // 2. Crear el turno
  const fechaStr = format(fecha, 'yyyy-MM-dd');
  const fechaHoraInicioIso = parse(`${fechaStr} ${hora}`, 'yyyy-MM-dd HH:mm', new Date()).toISOString();

  const { error: turnoError } = await supabase
    .from('turnos')
    .insert({
      clinica_id: clinicaId,
      profesional_id: medicoId,
      paciente_id: pacienteData.id,
      fecha_hora_inicio: fechaHoraInicioIso,
      estado: 'pendiente',
      canal_reserva: 'web'
    });

  if (turnoError) {
    throw new Error('Error al reservar el turno: ' + turnoError.message);
  }

  return true;
}
