const fs = require('fs')
const d = JSON.parse(fs.readFileSync('dados-exemplo.json', 'utf8'))
const esc = (s) => String(s ?? '').replace(/'/g, "''")
const j = (v) => `'${esc(JSON.stringify(v ?? null))}'::jsonb`
const n = (v) => (v === null || v === undefined || v === '' ? 'null' : String(v))
const s = (v) => (v === null || v === undefined ? 'null' : `'${esc(v)}'`)
const lines = []

lines.push('-- seed ILPI from dados-exemplo.json')
lines.push(`truncate table public.administracoes, public.administracoes_sn, public.checagens_cuidado, public.entradas_estoque, public.prescricoes, public.itens_estoque, public.avaliacoes, public.pias, public.cuidados, public.anotacoes, public.ocorrencias, public.evolucoes, public.agendas, public.arquivos, public.temperaturas, public.escalas_mes, public.tarefas_feitas, public.tarefas, public.documentos_inst, public.pops, public.treinamentos, public.residentes, public.profissionais, public.instituicao cascade;`)

lines.push(`insert into public.instituicao (id, nome) values ('00000000-0000-0000-0000-000000000001', ${s(d.inst)});`)

for (const p of d.equipe) {
  lines.push(
    `insert into public.profissionais (id,nome,categoria,funcao,conselho,setor,area,carga,horario) values (${s(p.id)},${s(p.nome)},'${p.cat}',${s(p.funcao)},${s(p.conselho || '')},${s(p.setor || '')},${s(p.area || '')},${s(p.carga || '')},${s(p.horario || '')});`,
  )
}

for (const [mes, mapa] of Object.entries(d.escalaMes || {})) {
  for (const [pid, codigos] of Object.entries(mapa)) {
    lines.push(
      `insert into public.escalas_mes (mes, profissional_id, codigos) values (${s(mes)},${s(pid)},${j(codigos)});`,
    )
  }
}

for (const r of d.residentes) {
  lines.push(
    `insert into public.residentes (id,nome,sexo,nasc,quarto,admissao,escolaridade,estado_civil,filhos,profissao,convenio,alergias,doencas,outras,cirurgias,medico_id,status,obito_data,entrada,responsavel,contrato,docs,pref,foto) values (${s(r.id)},${s(r.nome)},${s(r.sexo)},${s(r.nasc)},${s(r.quarto)},${s(r.admissao)},${s(r.escolaridade)},${s(r.estadoCivil)},${s(r.filhos)},${s(r.profissao)},${s(r.convenio)},${s(r.alergias || '')},${j(r.doencas || [])},${s(r.outras || '')},${s(r.cirurgias || '')},${s(r.medico || null)},'${r.status || 'ativo'}',${s(r.obitoData || null)},${s(r.entrada || '')},${j(r.responsavel || {})},${s(r.contrato || '')},${j(r.docs || {})},${j(r.pref || {})},${s(r.foto || null)});`,
  )

  for (const a of r.aval || []) {
    lines.push(
      `insert into public.avaliacoes (id,residente_id,escala,data,respostas,assinatura) values (${s(a.id)},${s(r.id)},${s(a.esc)},${s(a.d)},${j(a.resp)},${j(a.sig)});`,
    )
  }
  for (const p of r.pia || []) {
    lines.push(
      `insert into public.pias (id,residente_id,periodo,inicio,reavaliacao,necessidades,obs,resultado,encaminhamentos,assinatura) values (${s(p.id)},${s(r.id)},${s(p.periodo || '')},${s(p.inicio || null)},${s(p.reavaliacao || null)},${j(p.necessidades || [])},${s(p.obs || '')},${s(p.resultado || '')},${s(p.encaminhamentos || '')},${j(p.sig || p.assinatura)});`,
    )
  }
  for (const c of r.cuidados || []) {
    const cid = `${r.id}_${c.id}`
    lines.push(
      `insert into public.cuidados (id,residente_id,texto,quem) values (${s(cid)},${s(r.id)},${s(c.texto)},'${c.quem || 'todos'}');`,
    )
  }
  for (const it of r.estoque || []) {
    const iid = `${r.id}_${it.id}`
    lines.push(
      `insert into public.itens_estoque (id,residente_id,escopo,nome,unidade,quantidade,minimo,consumo_dia) values (${s(iid)},${s(r.id)},'residente',${s(it.nome)},${s(it.un || it.unidade || 'un')},${n(it.qtd ?? it.quantidade ?? 0)},${n(it.min ?? it.minimo ?? 0)},null);`,
    )
    for (const e of it.entradas || []) {
      lines.push(
        `insert into public.entradas_estoque (item_id,data,quantidade,obs,assinatura) values (${s(iid)},${s(e.d || e.data)},${n(e.qtd || e.quantidade)},${s(e.obs || '')},${e.sig == null ? 'null' : j(e.sig)});`,
      )
    }
  }
  for (const p of r.presc || []) {
    const estoqueRef = p.estoqueId || p.item_estoque
    const estoqueId = estoqueRef ? `${r.id}_${estoqueRef}` : null
    const tipoMap = { fixo: 'diario', diario: 'diario' }
    const tipo = tipoMap[p.tipo] || p.tipo || 'diario'
    lines.push(
      `insert into public.prescricoes (id,residente_id,medicamento,dose,via,tipo,horarios,dias,intervalo,consumo,item_estoque_id,inicio,fim,obs,prescritor_id,suspensa,assinatura) values (${s(p.id)},${s(r.id)},${s(p.med || p.medicamento)},${s(p.dose || '')},${s(p.via || '')},'${tipo}',${j(p.horarios || [])},${j(p.dias || [])},${n(p.intervalo ?? null)},${n(p.consumo ?? 1)},${s(estoqueId)},${s(p.inicio || null)},${s(p.fim || null)},${s(p.obs || '')},${s(p.prescritor || null)},${p.suspensa ? 'true' : 'false'},${j(p.sig || p.assinatura)});`,
    )
  }
  for (const a of r.anot || []) {
    lines.push(
      `insert into public.anotacoes (id,residente_id,pa,pulso,resp,temp,sat,evac,diurese,texto,assinatura) values (${s(a.id)},${s(r.id)},${s(a.pa || '')},${s(a.pulso || '')},${s(a.resp || '')},${s(a.temp || '')},${s(a.sat || '')},${s(a.evac || '')},${s(a.diurese || '')},${s(a.texto || '')},${j(a.sig)});`,
    )
  }
  for (const e of r.evol || []) {
    lines.push(
      `insert into public.evolucoes (id,residente_id,area,texto,peso,assinatura) values (${s(e.id)},${s(r.id)},${s(e.area)},${s(e.texto || '')},${n(e.peso ?? null)},${j(e.sig)});`,
    )
  }
  for (const a of r.agenda || []) {
    lines.push(
      `insert into public.agendas (id,residente_id,area,data,atividade,assinatura) values (${s(a.id)},${s(r.id)},${s(a.area)},${s(a.d || a.data)},${s(a.atividade)},${j(a.sig || null)});`,
    )
  }
  for (const f of r.arquivos || []) {
    lines.push(
      `insert into public.arquivos (id,residente_id,nome,categoria,data,tipo,storage_path,area,assinatura) values (${s(f.id)},${s(r.id)},${s(f.nome)},${s(f.cat || f.categoria || '')},${s(f.d || f.data || null)},${s(f.tipo || '')},${s(f.arquivo || f.storage_path || null)},${s(f.area || '')},${j(f.sig || null)});`,
    )
  }
}

for (const it of d.casa || []) {
  lines.push(
    `insert into public.itens_estoque (id,residente_id,escopo,nome,unidade,quantidade,minimo,consumo_dia) values (${s(it.id)},null,'casa',${s(it.nome)},${s(it.un || 'un')},${n(it.qtd ?? 0)},${n(it.min ?? 0)},${n(it.consumoDia ?? it.consumo_dia ?? null)});`,
  )
}

for (const doc of d.documentos || []) {
  lines.push(
    `insert into public.documentos_inst (id,nome,orgao,validade) values (${s(doc.id)},${s(doc.nome)},${s(doc.orgao || '')},${s(doc.validade || null)});`,
  )
}
for (const p of d.pops || []) {
  lines.push(
    `insert into public.pops (id,titulo,tipo,revisao) values (${s(p.id)},${s(p.titulo)},'${p.tipo}',${s(p.revisao || null)});`,
  )
}
for (const t of d.treinamentos || []) {
  lines.push(
    `insert into public.treinamentos (id,data,tema,presentes) values (${s(t.id)},${s(t.data || t.d)},${s(t.tema)},${j(t.presentes || [])});`,
  )
}
for (const t of d.temperaturas || []) {
  lines.push(
    `insert into public.temperaturas (id,data,turno,hora,max,min,momento,ambiente,assinatura) values (${s(t.id)},${s(t.d)},'${t.turno}',${s(t.h || '')},${n(t.max)},${n(t.min)},${n(t.mom ?? t.momento)},${n(t.amb ?? t.ambiente)},${j(t.sig)});`,
  )
}
for (const e of d.eventos || []) {
  lines.push(
    `insert into public.ocorrencias (id,residente_id,tipo,data) values (${s(e.id)},${s(e.resId)},${s(e.tipo)},${s(e.data)});`,
  )
}
for (const t of d.tarefas || []) {
  lines.push(
    `insert into public.tarefas (id,tarefa,responsavel,dias) values (${s(t.id)},${s(t.tarefa)},${s(t.resp || '')},${j(t.dias || [])});`,
  )
}

for (const p of d.equipe) {
  const email = `${p.id}@ilpi.demo`
  const num = parseInt(String(p.id).replace(/\D/g, '') || '1', 10)
  const id = `aaaaaaaa-bbbb-cccc-dddd-${String(num).padStart(12, '0')}`
  lines.push(`-- auth ${email}`)
  lines.push(
    `insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change) values ('00000000-0000-0000-0000-000000000000','${id}'::uuid,'authenticated','authenticated',${s(email)},crypt('ILPI-Demo-2026!', gen_salt('bf', 10)),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now(),'','','','') on conflict (id) do nothing;`,
  )
  lines.push(
    `insert into auth.identities (id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at) values ('${id}'::uuid,'${id}'::uuid, jsonb_build_object('sub','${id}','email',${s(email)}), 'email', '${id}', now(), now(), now()) on conflict do nothing;`,
  )
  lines.push(`update public.profissionais set user_id='${id}'::uuid where id=${s(p.id)};`)
}

fs.writeFileSync('scripts/seed.sql', lines.join('\n'))
console.log('wrote scripts/seed.sql lines', lines.length)
