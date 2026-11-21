import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { salvarConfigEscalas } from '../lib/business/escalasConfig'
import type {
  AvisoRT,
  ConfiguracaoEscalas,
  DocumentoInstituicao,
  EscalaMes,
  EventoVigilancia,
  ItemEstoque,
  PassagemPlantao,
  PopDocumento,
  Profissional,
  RegistroAdm,
  Residente,
  TemperaturaGeladeira,
  Treinamento,
} from '../types/ilpi'
import {
  getAvisosLocais,
  getPassagensLocais,
  setAvisosLocais,
  setPassagensLocais,
} from '../lib/business/passagemAvisos'
import {
  buildAdmMap,
  mapArquivo,
  mapAnotacao,
  mapAvaliacao,
  mapCuidado,
  mapAgenda,
  mapDocumentoInst,
  mapEvolucao,
  mapEvento,
  mapItemEstoque,
  mapPia,
  mapPop,
  mapPrescricao,
  mapProfissional,
  mapResidenteBase,
  mapTemperatura,
  mapTreinamento,
} from '../lib/db-map'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export interface TarefaRotina {
  id: string
  tarefa: string
  resp?: string
  dias: number[]
}

export type SnRegistro = {
  id: string
  resId: string
  pId: string
  motivo: string
  sig: { id: string; d: string; h: string }
}

type IlpiData = {
  loading: boolean
  error: string | null
  inst: string
  equipe: Profissional[]
  residentes: Residente[]
  casa: ItemEstoque[]
  adm: Record<string, Record<string, RegistroAdm>>
  documentos: DocumentoInstituicao[]
  pops: PopDocumento[]
  treinamentos: Treinamento[]
  temperaturas: TemperaturaGeladeira[]
  eventos: EventoVigilancia[]
  escalaMes: Record<string, EscalaMes>
  tarefas: TarefaRotina[]
  tarefasFeitas: Record<string, string[]>
  checagensCuidado: Record<string, Record<string, { id: string; d: string; h: string; horario?: string; foto?: string }>>
  sn: SnRegistro[]
  passagens: PassagemPlantao[]
  avisosRT: AvisoRT[]
  salvarPassagem: (p: Omit<PassagemPlantao, 'id' | 'createdAt'>) => Promise<PassagemPlantao>
  salvarAviso: (a: Omit<AvisoRT, 'id' | 'createdAt' | 'ciencias'>) => Promise<AvisoRT>
  darCiencia: (avisoId: string, profId: string) => Promise<void>
  desativarAviso: (avisoId: string) => Promise<void>
  refresh: () => Promise<void>
  profissionalPorId: (id: string) => Profissional | undefined
  getResidente: (id: string) => Residente | undefined
}

const IlpiDataContext = createContext<IlpiData | null>(null)

export function IlpiDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inst, setInst] = useState('')
  const [equipe, setEquipe] = useState<Profissional[]>([])
  const [residentes, setResidentes] = useState<Residente[]>([])
  const [casa, setCasa] = useState<ItemEstoque[]>([])
  const [adm, setAdm] = useState<Record<string, Record<string, RegistroAdm>>>({})
  const [documentos, setDocumentos] = useState<DocumentoInstituicao[]>([])
  const [pops, setPops] = useState<PopDocumento[]>([])
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([])
  const [temperaturas, setTemperaturas] = useState<TemperaturaGeladeira[]>([])
  const [eventos, setEventos] = useState<EventoVigilancia[]>([])
  const [escalaMes, setEscalaMes] = useState<Record<string, EscalaMes>>({})
  const [tarefas, setTarefas] = useState<TarefaRotina[]>([])
  const [tarefasFeitas, setTarefasFeitas] = useState<Record<string, string[]>>({})
  const [checagensCuidado, setChecagensCuidado] = useState<
    Record<string, Record<string, { id: string; d: string; h: string; horario?: string; foto?: string }>>
  >({})
  const [sn, setSn] = useState<SnRegistro[]>([])
  const [passagens, setPassagens] = useState<PassagemPlantao[]>(getPassagensLocais)
  const [avisosRT, setAvisosRT] = useState<AvisoRT[]>(getAvisosLocais)

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const [
        instR,
        profR,
        resR,
        avalR,
        piaR,
        cuidR,
        chkR,
        estR,
        prescR,
        admR,
        snR,
        anotR,
        ocoR,
        evolR,
        agR,
        arqR,
        tempR,
        escR,
        tarR,
        tarfR,
        docR,
        popR,
        treR,
      ] = await Promise.all([
        supabase.from('instituicao').select('*').limit(1).maybeSingle(),
        supabase.from('profissionais').select('*').eq('ativo', true),
        supabase.from('residentes').select('*'),
        supabase.from('avaliacoes').select('*'),
        supabase.from('pias').select('*'),
        supabase.from('cuidados').select('*'),
        supabase.from('checagens_cuidado').select('*'),
        supabase.from('itens_estoque').select('*'),
        supabase.from('prescricoes').select('*'),
        supabase.from('administracoes').select('*'),
        supabase.from('administracoes_sn').select('*'),
        supabase.from('anotacoes').select('*'),
        supabase.from('ocorrencias').select('*'),
        supabase.from('evolucoes').select('*'),
        supabase.from('agendas').select('*'),
        supabase.from('arquivos').select('*'),
        supabase.from('temperaturas').select('*'),
        supabase.from('escalas_mes').select('*'),
        supabase.from('tarefas').select('*'),
        supabase.from('tarefas_feitas').select('*'),
        supabase.from('documentos_inst').select('*'),
        supabase.from('pops').select('*'),
        supabase.from('treinamentos').select('*'),
      ])

      const fail = [
        instR,
        profR,
        resR,
        avalR,
        piaR,
        cuidR,
        chkR,
        estR,
        prescR,
        admR,
        snR,
        anotR,
        ocoR,
        evolR,
        agR,
        arqR,
        tempR,
        escR,
        tarR,
        tarfR,
        docR,
        popR,
        treR,
      ].find((r) => r.error)
      if (fail?.error) throw fail.error

      const instData = instR.data as { nome?: string; escalas_config?: ConfiguracaoEscalas } | null
      setInst(instData?.nome ?? 'Instituição')
      if (instData?.escalas_config && Array.isArray(instData.escalas_config.escalasAtivas)) {
        salvarConfigEscalas(instData.escalas_config, false)
      }
      setEquipe((profR.data ?? []).map((row) => mapProfissional(row as Parameters<typeof mapProfissional>[0])))

      const byRes = new Map<string, Residente>()
      for (const row of resR.data ?? []) {
        byRes.set(row.id, mapResidenteBase(row as Parameters<typeof mapResidenteBase>[0]))
      }
      for (const row of avalR.data ?? []) {
        byRes.get(row.residente_id)?.aval.push(mapAvaliacao(row as Parameters<typeof mapAvaliacao>[0]))
      }
      for (const row of piaR.data ?? []) {
        byRes.get(row.residente_id)?.pia.push(mapPia(row as Parameters<typeof mapPia>[0]))
      }
      for (const row of cuidR.data ?? []) {
        byRes.get(row.residente_id)?.cuidados.push(mapCuidado(row as Parameters<typeof mapCuidado>[0]))
      }
      for (const row of anotR.data ?? []) {
        byRes.get(row.residente_id)?.anot.push(mapAnotacao(row as Parameters<typeof mapAnotacao>[0]))
      }
      for (const row of evolR.data ?? []) {
        byRes.get(row.residente_id)?.evol.push(mapEvolucao(row as Parameters<typeof mapEvolucao>[0]))
      }
      for (const row of agR.data ?? []) {
        byRes.get(row.residente_id)?.agenda?.push(mapAgenda(row as Parameters<typeof mapAgenda>[0]))
      }
      for (const row of arqR.data ?? []) {
        byRes.get(row.residente_id)?.arquivos?.push(mapArquivo(row as Parameters<typeof mapArquivo>[0]))
      }
      for (const row of prescR.data ?? []) {
        byRes.get(row.residente_id)?.presc.push(mapPrescricao(row as Parameters<typeof mapPrescricao>[0]))
      }

      const casaItems: ItemEstoque[] = []
      setCasa([])
      for (const row of estR.data ?? []) {
        const item = mapItemEstoque(row as Parameters<typeof mapItemEstoque>[0])
        if (row.escopo === 'casa') casaItems.push(item)
        else if (row.residente_id) byRes.get(row.residente_id)?.estoque.push(item)
      }
      setCasa(casaItems)
      setResidentes([...byRes.values()])

      setAdm(buildAdmMap((admR.data ?? []) as Parameters<typeof buildAdmMap>[0]))

      const chkMap: typeof checagensCuidado = {}
      for (const row of chkR.data ?? []) {
        const sig = (row.assinatura ?? {}) as {
          id: string
          d: string
          h: string
          horario?: string
          foto?: string
          checagens?: Record<string, { id: string; d: string; h: string; foto?: string }>
        }
        if (!chkMap[row.data]) chkMap[row.data] = {}
        chkMap[row.data][`${row.residente_id}|${row.cuidado_id}`] = sig
        if (sig.horario) {
          chkMap[row.data][`${row.residente_id}|${row.cuidado_id}|${sig.horario}`] = sig
        }
        if (sig.checagens && typeof sig.checagens === 'object') {
          for (const [hor, itemSig] of Object.entries(sig.checagens)) {
            chkMap[row.data][`${row.residente_id}|${row.cuidado_id}|${hor}`] = itemSig
          }
        }
      }
      setChecagensCuidado(chkMap)

      setSn(
        (snR.data ?? []).map((row) => ({
          id: row.id,
          resId: row.residente_id,
          pId: row.prescricao_id,
          motivo: row.motivo,
          sig: (row.assinatura ?? { id: '', d: '', h: '' }) as SnRegistro['sig'],
        })),
      )

      setTemperaturas((tempR.data ?? []).map((r) => mapTemperatura(r as Parameters<typeof mapTemperatura>[0])))
      setEventos((ocoR.data ?? []).map((r) => mapEvento(r as Parameters<typeof mapEvento>[0])))
      setDocumentos((docR.data ?? []).map((r) => mapDocumentoInst(r as Parameters<typeof mapDocumentoInst>[0])))
      setPops((popR.data ?? []).map((r) => mapPop(r as Parameters<typeof mapPop>[0])))
      setTreinamentos((treR.data ?? []).map((r) => mapTreinamento(r as Parameters<typeof mapTreinamento>[0])))

      const esc: Record<string, EscalaMes> = {}
      for (const row of escR.data ?? []) {
        if (!esc[row.mes]) esc[row.mes] = {}
        esc[row.mes][row.profissional_id] = (row.codigos as string[]) ?? []
      }
      setEscalaMes(esc)

      setTarefas(
        (tarR.data ?? []).map((row) => ({
          id: row.id,
          tarefa: row.tarefa,
          resp: row.responsavel ?? undefined,
          dias: (row.dias as number[]) ?? [],
        })),
      )

      const feitas: Record<string, string[]> = {}
      for (const row of tarfR.data ?? []) {
        if (!feitas[row.data]) feitas[row.data] = []
        feitas[row.data].push(row.tarefa_id)
      }
      setTarefasFeitas(feitas)

      // Carregamento resiliente de Passagens de Plantão e Avisos da RT
      try {
        const [pRes, aRes] = await Promise.all([
          Promise.resolve(
            supabase
              .from('passagens_plantao')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(30),
          )
            .then((r) => (r.error ? null : r.data))
            .catch(() => null),
          Promise.resolve(
            supabase
              .from('avisos_rt')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(20),
          )
            .then((r) => (r.error ? null : r.data))
            .catch(() => null),
        ])
        if (pRes && pRes.length > 0) {
          const list: PassagemPlantao[] = (pRes as Record<string, any>[]).map((row) => ({
            id: row.id,
            data: row.data,
            hora: row.hora,
            turno: row.turno,
            passadoPor: row.passado_por,
            recebidoPor: row.recebido_por,
            relato: row.relato,
            pendencias: row.pendencias,
            resumo: row.resumo ?? {
              dosesChecadas: 0,
              dosesTotal: 0,
              cuidadosChecados: 0,
              cuidadosTotal: 0,
              ocorrenciasHoje: 0,
            },
            createdAt: row.created_at,
          }))
          setPassagens(list)
          setPassagensLocais(list)
        }
        if (aRes && aRes.length > 0) {
          const list: AvisoRT[] = (aRes as Record<string, any>[]).map((row) => ({
            id: row.id,
            data: row.data,
            hora: row.hora,
            titulo: row.titulo,
            mensagem: row.mensagem,
            prioridade: row.prioridade,
            autor: row.autor,
            ativo: row.ativo,
            ciencias: Array.isArray(row.ciencias) ? row.ciencias : [],
            createdAt: row.created_at,
          }))
          setAvisosRT(list)
          setAvisosLocais(list)
        }
      } catch {
        // Fallback silencioso: usa cache local já carregado
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [session])

  const salvarPassagem = useCallback(
    async (p: Omit<PassagemPlantao, 'id' | 'createdAt'>): Promise<PassagemPlantao> => {
      const nova: PassagemPlantao = {
        ...p,
        id: `pp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      }
      setPassagens((prev) => {
        const next = [nova, ...prev]
        setPassagensLocais(next)
        return next
      })
      try {
        await supabase.from('passagens_plantao').insert({
          id: nova.id,
          data: nova.data,
          hora: nova.hora,
          turno: nova.turno,
          passado_por: nova.passadoPor,
          recebido_por: nova.recebidoPor ?? null,
          relato: nova.relato,
          pendencias: nova.pendencias ?? null,
          resumo: nova.resumo,
        })
      } catch {
        // Fallback local já salvo
      }
      return nova
    },
    [],
  )

  const salvarAviso = useCallback(
    async (a: Omit<AvisoRT, 'id' | 'createdAt' | 'ciencias'>): Promise<AvisoRT> => {
      const novo: AvisoRT = {
        ...a,
        id: `av_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ciencias: [],
        createdAt: new Date().toISOString(),
      }
      setAvisosRT((prev) => {
        const next = [novo, ...prev]
        setAvisosLocais(next)
        return next
      })
      try {
        await supabase.from('avisos_rt').insert({
          id: novo.id,
          data: novo.data,
          hora: novo.hora,
          titulo: novo.titulo,
          mensagem: novo.mensagem,
          prioridade: novo.prioridade,
          autor: novo.autor,
          ativo: novo.ativo,
          ciencias: [],
        })
      } catch {
        // Fallback local já salvo
      }
      return novo
    },
    [],
  )

  const darCiencia = useCallback(async (avisoId: string, profId: string) => {
    setAvisosRT((prev) => {
      const next = prev.map((av) => {
        if (av.id === avisoId && !av.ciencias?.includes(profId)) {
          return { ...av, ciencias: [...(av.ciencias ?? []), profId] }
        }
        return av
      })
      setAvisosLocais(next)
      return next
    })
    try {
      const { data } = await supabase.from('avisos_rt').select('ciencias').eq('id', avisoId).maybeSingle()
      const atuais = Array.isArray(data?.ciencias) ? (data.ciencias as string[]) : []
      const novasCiencias = Array.from(new Set([...atuais, profId]))
      await supabase.from('avisos_rt').update({ ciencias: novasCiencias }).eq('id', avisoId)
    } catch {
      // Fallback
    }
  }, [])

  const desativarAviso = useCallback(async (avisoId: string) => {
    setAvisosRT((prev) => {
      const next = prev.map((av) => (av.id === avisoId ? { ...av, ativo: false } : av))
      setAvisosLocais(next)
      return next
    })
    try {
      await supabase.from('avisos_rt').update({ ativo: false }).eq('id', avisoId)
    } catch {
      // Fallback
    }
  }, [])

  useEffect(() => {
    if (session) void load()
    else setLoading(false)
  }, [load, session])

  const profMap = useMemo(() => new Map(equipe.map((p) => [p.id, p])), [equipe])

  const value = useMemo<IlpiData>(
    () => ({
      loading,
      error,
      inst,
      equipe,
      residentes,
      casa,
      adm,
      documentos,
      pops,
      treinamentos,
      temperaturas,
      eventos,
      escalaMes,
      tarefas,
      tarefasFeitas,
      checagensCuidado,
      sn,
      passagens,
      avisosRT,
      salvarPassagem,
      salvarAviso,
      darCiencia,
      desativarAviso,
      refresh: load,
      profissionalPorId: (id) => profMap.get(id),
      getResidente: (id) => residentes.find((r) => r.id === id),
    }),
    [
      loading,
      error,
      inst,
      equipe,
      residentes,
      casa,
      adm,
      documentos,
      pops,
      treinamentos,
      temperaturas,
      eventos,
      escalaMes,
      tarefas,
      tarefasFeitas,
      checagensCuidado,
      sn,
      passagens,
      avisosRT,
      salvarPassagem,
      salvarAviso,
      darCiencia,
      desativarAviso,
      load,
      profMap,
    ],
  )

  return <IlpiDataContext.Provider value={value}>{children}</IlpiDataContext.Provider>
}

const ILPI_DATA_FALLBACK: IlpiData = {
  loading: true,
  error: null,
  inst: '',
  equipe: [],
  residentes: [],
  casa: [],
  adm: {},
  documentos: [],
  pops: [],
  treinamentos: [],
  temperaturas: [],
  eventos: [],
  escalaMes: {},
  tarefas: [],
  tarefasFeitas: {},
  checagensCuidado: {},
  sn: [],
  passagens: [],
  avisosRT: [],
  salvarPassagem: async () => ({} as any),
  salvarAviso: async () => ({} as any),
  darCiencia: async () => {},
  desativarAviso: async () => {},
  refresh: async () => {},
  profissionalPorId: () => undefined,
  getResidente: () => undefined,
}

export function useIlpiData(): IlpiData {
  const ctx = useContext(IlpiDataContext)
  return ctx ?? ILPI_DATA_FALLBACK
}

export function useEstadoAlertas() {
  const d = useIlpiData()
  return useMemo(
    () => ({
      inst: d.inst,
      user: '',
      equipe: d.equipe,
      residentes: d.residentes,
      escalaMes: d.escalaMes,
      casa: d.casa,
      adm: d.adm,
      documentos: d.documentos,
      temperaturas: d.temperaturas,
      treinamentos: d.treinamentos,
      pops: d.pops,
      eventos: d.eventos,
    }),
    [d],
  )
}