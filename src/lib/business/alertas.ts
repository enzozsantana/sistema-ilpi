import { MESES, NURSE } from '../constants'
import { can } from '../permissions'
import {
  diffDays,
  fmt,
  fmtDM,
  mesKey,
  minAgora,
  minDe,
  num,
  primeiro,
} from './dates'
import { consumoDia, diasRest, nivelEst } from './estoque'
import { ultAval } from './escalas'
import { dosesDia, regAdm } from './medication'
import { flagsValues } from './ssvv'
import { ativos, docsPend, variacaoPeso } from './indicadores'
import type {
  Alerta,
  Categoria,
  EstadoIlpi,
  Profissional,
  Residente,
} from '../../types/ilpi'

export interface ContextoAlertas {
  estado: Pick<
    EstadoIlpi,
    | 'residentes'
    | 'adm'
    | 'casa'
    | 'documentos'
    | 'temperaturas'
    | 'treinamentos'
    | 'pops'
    | 'eventos'
  >
  /** Profissional logado (categoria e id). */
  usuario: { id: string; cat: Categoria }
  /** Data de referência ISO (hoje no protótipo). */
  hoje: string
  agora?: Date
  /** Resolve nome do profissional por id. */
  prof?: (id: string) => Pick<Profissional, 'nome' | 'cat'> | undefined
}

function anotHoje(r: Residente, hoje: string) {
  return r.anot.filter((a) => a.sig.d === hoje)
}

function nomeProf(
  ctx: ContextoAlertas,
  id: string,
): string {
  return primeiro(ctx.prof?.(id)?.nome ?? 'Profissional')
}

export function alertas(ctx: ContextoAlertas): Alerta[] {
  const a: Alerta[] = []
  const { estado, usuario, hoje } = ctx
  const agora = ctx.agora ?? new Date()
  const minutos = minAgora(agora)
  const cat = usuario.cat
  const gerir = can(cat, 'gerir')
  const residentesAtivos = ativos(estado.residentes)

  const atrasadas: ReturnType<typeof dosesDia> = []
  residentesAtivos.forEach((r) => {
    dosesDia(r, hoje).forEach((x) => {
      if (!regAdm(estado.adm, x.key, hoje) && minutos - minDe(x.hora) > 30) {
        atrasadas.push(x)
      }
    })
  })
  if (atrasadas.length && can(cat, 'adm')) {
    const nomes = [...new Set(atrasadas.map((x) => primeiro(estado.residentes.find((r) => r.id === x.resid)?.nome)))]
    a.push({
      n: 'danger',
      t: `${atrasadas.length} dose${atrasadas.length > 1 ? 's' : ''} sem checagem`,
      s: nomes.filter(Boolean).join(', '),
      go: 'plantao',
    })
  }

  if ([...NURSE, 'med'].includes(cat)) {
    residentesAtivos.forEach((r) => {
      const ult = anotHoje(r, hoje).slice(-1)[0]
      if (!ult) return
      const f = flagsValues(ult)
      if (!f.length) return
      a.push({
        n: 'danger',
        t: `${primeiro(r.nome)}: ${f.join(', ').toLowerCase()}`,
        s: `Anotação de ${ult.sig.h} por ${nomeProf(ctx, ult.sig.id)}. Comunicar enfermeiro(a).`,
        go: `res:${r.id}:anot`,
      })
    })
  }

  if (!NURSE.includes(cat)) {
    return ordenarAlertas(a)
  }

  const tHoje = estado.temperaturas.filter((t) => t.d === hoje)
  const ultT = estado.temperaturas[estado.temperaturas.length - 1]
  if (ultT && [ultT.max, ultT.min, ultT.mom].some((v) => v < 2 || v > 8)) {
    a.push({
      n: 'danger',
      t: 'Geladeira fora da faixa de 2 a 8 °C',
      s: `Registro de ${fmtDM(ultT.d)} às ${ultT.h}`,
      go: 'rotinas',
    })
  }
  if (!tHoje.some((t) => t.turno === 'manha') && minutos > minDe('08:00')) {
    a.push({
      n: 'warn',
      t: 'Temperatura da geladeira da manhã não registrada',
      s: 'Registro previsto às 7h',
      go: 'rotinas',
    })
  }

  if (!gerir) return ordenarAlertas(a)

  residentesAtivos.forEach((r) => {
    r.estoque.forEach((it) => {
      const c = consumoDia(r, it, hoje)
      const nv = nivelEst(c, it)
      if (nv === 'ok') return
      const d = diasRest(c, it.qtd)
      a.push({
        n: nv,
        t: Number.isFinite(d)
          ? `${it.nome} de ${primeiro(r.nome)} acaba em ${Math.max(0, Math.floor(d))} dia${Math.floor(d) === 1 ? '' : 's'}`
          : `${it.nome} de ${primeiro(r.nome)} abaixo do mínimo`,
        s: `Restam ${num(it.qtd)} ${it.unid}. Avisar ${r.responsavel?.nome || 'a família'}.`,
        go: `res:${r.id}:estoque`,
      })
    })
  })

  estado.casa.forEach((it) => {
    const consumo = it.consumoDia ?? 0
    const nv = nivelEst(consumo, it)
    if (nv !== 'ok') {
      a.push({
        n: nv,
        t: `${it.nome} (estoque da casa) acabando`,
        s: `Restam ${num(it.qtd)} ${it.unid}`,
        go: 'estoque',
      })
    }
  })

  estado.documentos.forEach((d) => {
    const n = diffDays(d.validade, hoje)
    if (n < 0) {
      a.push({
        n: 'danger',
        t: `${d.nome} vencido há ${-n} dias`,
        s: d.orgao,
        go: 'gestao',
      })
    } else if (n <= 60) {
      a.push({
        n: n <= 15 ? 'danger' : 'warn',
        t: `${d.nome} vence em ${n} dia${n === 1 ? '' : 's'}`,
        s: `${d.orgao}. Validade ${fmt(d.validade)}`,
        go: 'gestao',
      })
    }
  })

  const semSSVV = residentesAtivos.filter(
    (r) =>
      !anotHoje(r, hoje).length &&
      r.cuidados.some((c) => /ssvv|sinais vitais/i.test(c.texto)),
  )
  if (semSSVV.length && minutos > minDe('10:00')) {
    a.push({
      n: 'warn',
      t: `SSVV sem anotação hoje: ${semSSVV.map((r) => primeiro(r.nome)).join(', ')}`,
      s: 'Prescrição de enfermagem do plano de cuidados',
      go: 'plantao',
    })
  }

  residentesAtivos.forEach((r) => {
    const vp = variacaoPeso(r)
    if (vp && Math.abs(vp.pct) >= 5) {
      a.push({
        n: 'warn',
        t: `${primeiro(r.nome)} ${vp.pct > 0 ? 'ganhou' : 'perdeu'} ${num(Math.abs(vp.pct))}% do peso`,
        s: `De ${num(vp.de.peso!)} kg (${fmtDM(vp.de.sig.d)}) para ${num(vp.ate.peso!)} kg (${fmtDM(vp.ate.sig.d)})`,
        go: `res:${r.id}:evol`,
      })
    }
  })

  residentesAtivos.forEach((r) => {
    const f = ultAval(r, 'fugulin') ?? ultAval(r, 'katz')
    if (!f || diffDays(hoje, f.d) > 90) {
      const nomeEscala = f?.esc === 'katz' ? 'Katz' : 'Fugulin'
      a.push({
        n: 'warn',
        t: `Reavaliar ${nomeEscala} de ${primeiro(r.nome)}`,
        s: f ? `Última em ${fmt(f.d)}` : 'Sem avaliação',
        go: `res:${r.id}:aval`,
      })
    }
    r.pia.forEach((p) => {
      if (p.reav && p.reav < hoje && !p.resultado) {
        a.push({
          n: 'warn',
          t: `PIA de ${primeiro(r.nome)} passou da data de reavaliação`,
          s: `Previsto para ${fmt(p.reav)}`,
          go: `res:${r.id}:pia`,
        })
      }
    })
    if (!r.pia.length) {
      a.push({
        n: 'warn',
        t: `${primeiro(r.nome)} ainda não tem PIA de enfermagem`,
        s: 'Plano individual de atenção',
        go: `res:${r.id}:pia`,
      })
    }
  })

  const mk = mesKey(agora)
  if (!estado.treinamentos.some((t) => t.data.startsWith(mk))) {
    a.push({
      n: 'warn',
      t: `Treinamento de ${MESES[agora.getMonth()]} ainda não registrado`,
      s: 'Treinamento mensal da equipe',
      go: 'equipe',
    })
  }

  const pv = estado.pops.filter((p) => diffDays(hoje, p.revisao) > 365)
  if (pv.length) {
    a.push({
      n: 'warn',
      t: `${pv.length} documento${pv.length > 1 ? 's' : ''} técnico${pv.length > 1 ? 's' : ''} sem revisão há mais de 1 ano`,
      s: pv.map((p) => p.titulo).join(', '),
      go: 'gestao',
    })
  }

  const dp = residentesAtivos.filter((r) => docsPend(r).length)
  if (dp.length) {
    a.push({
      n: 'warn',
      t: `Documentos pendentes: ${dp.map((r) => primeiro(r.nome)).join(', ')}`,
      s: 'Ficha de acolhimento',
      go: `res:${dp[0].id}:ficha`,
    })
  }

  return ordenarAlertas(a)
}

function ordenarAlertas(lista: Alerta[]): Alerta[] {
  return [...lista].sort(
    (x, y) => (x.n === 'danger' ? 0 : 1) - (y.n === 'danger' ? 0 : 1),
  )
}