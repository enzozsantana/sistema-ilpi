import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  DocumentoInstituicao,
  EscalaMes,
  EventoVigilancia,
  ItemEstoque,
  PopDocumento,
  Profissional,
  RegistroAdm,
  Residente,
  TemperaturaGeladeira,
  Treinamento,
} from '../types/ilpi'
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
  checagensCuidado: Record<string, Record<string, { id: string; d: string; h: string }>>
  sn: SnRegistro[]
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
    Record<string, Record<string, { id: string; d: string; h: string }>>
  >({})
  const [sn, setSn] = useState<SnRegistro[]>([])

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
        supabase.from('instituicao').select('nome').limit(1).maybeSingle(),
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

      setInst((instR.data as { nome?: string } | null)?.nome ?? 'Instituição')
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
        const sig = (row.assinatura ?? {}) as { id: string; d: string; h: string }
        if (!chkMap[row.data]) chkMap[row.data] = {}
        chkMap[row.data][`${row.residente_id}|${row.cuidado_id}`] = sig
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [session])

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
      load,
      profMap,
    ],
  )

  return <IlpiDataContext.Provider value={value}>{children}</IlpiDataContext.Provider>
}

export function useIlpiData(): IlpiData {
  const ctx = useContext(IlpiDataContext)
  if (!ctx) throw new Error('useIlpiData deve ser usado dentro de IlpiDataProvider')
  return ctx
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