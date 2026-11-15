import type { Assinatura, Prescricao, RegistroAdm, StatusAdm } from '../types/ilpi'
import { supabase } from './supabase'

export interface ChecarAdmParams {
  data: string
  residenteId: string
  prescricaoId: string
  horario: string
  status: StatusAdm
  motivo?: string
  assinatura: Assinatura
  prescricao?: Prescricao
}

export async function checarAdministracao(p: ChecarAdmParams): Promise<{ ok: boolean; erro?: string }> {
  const rpc = await supabase.rpc('checar_administracao', {
    p_data: p.data,
    p_residente_id: p.residenteId,
    p_prescricao_id: p.prescricaoId,
    p_horario: p.horario,
    p_status: p.status,
    p_motivo: p.motivo ?? null,
    p_assinatura: p.assinatura,
  })
  if (!rpc.error) return { ok: true }

  const msg = rpc.error.message ?? ''
  const missing = rpc.error.code === 'PGRST202' || msg.includes('Could not find the function')
  if (!missing) return { ok: false, erro: msg }

  if (p.status === 'dado' && p.prescricao?.estoqueId) {
    const { data: item, error: eItem } = await supabase
      .from('itens_estoque')
      .select('quantidade, consumo')
      .eq('id', p.prescricao.estoqueId)
      .maybeSingle()
    if (eItem) return { ok: false, erro: eItem.message }
    const qtd = Number(item?.quantidade ?? 0)
    const gasto = Number(p.prescricao.consumo ?? 1)
    if (qtd < gasto) {
      return { ok: false, erro: 'Estoque insuficiente para registrar a dose.' }
    }
    const { error: upd } = await supabase
      .from('itens_estoque')
      .update({ quantidade: qtd - gasto })
      .eq('id', p.prescricao.estoqueId)
    if (upd) return { ok: false, erro: upd.message }
  }

  await supabase
    .from('administracoes')
    .delete()
    .eq('data', p.data)
    .eq('residente_id', p.residenteId)
    .eq('prescricao_id', p.prescricaoId)
    .eq('horario', p.horario)

  const { error } = await supabase.from('administracoes').insert({
    data: p.data,
    residente_id: p.residenteId,
    prescricao_id: p.prescricaoId,
    horario: p.horario,
    status: p.status,
    motivo: p.motivo ?? null,
    assinatura: p.assinatura,
  })
  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

export async function desfazerAdministracao(
  data: string,
  residenteId: string,
  prescricaoId: string,
  horario: string,
  registro: RegistroAdm,
  prescricao?: Prescricao,
): Promise<{ ok: boolean; erro?: string }> {
  const rpc = await supabase.rpc('desfazer_administracao', {
    p_data: data,
    p_residente_id: residenteId,
    p_prescricao_id: prescricaoId,
    p_horario: horario,
  })
  if (!rpc.error) return { ok: true }

  const msg = rpc.error.message ?? ''
  const missing = rpc.error.code === 'PGRST202' || msg.includes('Could not find the function')
  if (!missing) return { ok: false, erro: msg }

  if (registro.st === 'dado' && prescricao?.estoqueId) {
    const { data: item, error: eItem } = await supabase
      .from('itens_estoque')
      .select('quantidade')
      .eq('id', prescricao.estoqueId)
      .maybeSingle()
    if (eItem) return { ok: false, erro: eItem.message }
    const gasto = Number(prescricao.consumo ?? 1)
    await supabase
      .from('itens_estoque')
      .update({ quantidade: Number(item?.quantidade ?? 0) + gasto })
      .eq('id', prescricao.estoqueId)
  }

  const { error } = await supabase
    .from('administracoes')
    .delete()
    .eq('data', data)
    .eq('residente_id', residenteId)
    .eq('prescricao_id', prescricaoId)
    .eq('horario', horario)
  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}