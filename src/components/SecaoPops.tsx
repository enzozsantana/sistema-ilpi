import { useEffect, useMemo, useRef, useState } from 'react'
import type { PopDocumento } from '../types/ilpi'
import { diffDays, fmt, iso } from '../lib/business/dates'
import { can } from '../lib/permissions'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { salvarRascunho, obterRascunho, limparRascunho, temRascunho } from '../lib/draftStorage'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  AlertTriangle,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  Paperclip,
  Plus,
  Printer,
  RotateCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  type AnexoDocumento,
  carregarTodosAnexosLocais,
  processarArquivoParaAnexo,
  removerAnexoLocal,
  formatarTamanhoArquivo,
  baixarDocumento,
} from '../lib/documentosStorage'
import { VisualizadorDocumentoModal } from './VisualizadorDocumentoModal'

const T = iso(new Date())

// Diretrizes operacionais e instruções detalhadas para consulta da equipe
const DIRETRIZES_PADRAO: Record<string, { objetivo: string; publico: string; passos: string[]; frequencia: string }> = {
  'administração de medicamentos': {
    objetivo: 'Garantir a administração segura, correta e pontual dos medicamentos prescritos aos residentes da ILPI.',
    publico: 'Enfermeiros, Técnicos de Enfermagem e Cuidadores habilitados.',
    frequencia: 'Conforme prescrição médica individual diária.',
    passos: [
      'Higienizar as mãos rigorosamente antes e após o preparo e administração.',
      'Conferir os 9 Certos da medicação: Residente certo, Medicamento certo, Dose certa, Via certa, Horário certo, Registro certo, Ação certa, Forma farmacêutica certa e Resposta certa.',
      'Checar identificação do residente e conferir prontuário/prescrição ativa no sistema.',
      'Não retirar medicamentos de suas embalagens originais ou blister antes da beira-leito.',
      'Oferecer água e auxiliar na ingestão, observando a deglutição completa do medicamento.',
      'Registrar a checagem no sistema imediatamente após a administração.',
      'Em caso de recusa, intolerância ou reação adversa, comunicar imediatamente o Enfermeiro/RT.',
    ],
  },
  'higienização das mãos': {
    objetivo: 'Prevenir e controlar infecções cruzadas na instituição, garantindo a biossegurança de residentes e colaboradores.',
    publico: 'Toda a equipe multiprofissional, enfermagem, cuidadores e apoio.',
    frequencia: 'Nos 5 momentos da OMS (antes do contato com residente, antes de procedimento limpo, após risco de exposição a fluidos, após contato com residente e após contato com áreas próximas).',
    passos: [
      'Retirar anéis, pulseiras e relógios antes da higienização.',
      'Água e sabonete: friccionar todas as superfícies das mãos por 40 a 60 segundos.',
      'Fricção alcoólica (álcool 70%): aplicar em mãos secas e espalhar por 20 a 30 segundos até secar.',
      'Friccionar palmas, dorso das mãos, entre os dedos, polegares e unhas/pontas dos dedos.',
      'Secar com papel toalha descartável de boa qualidade e fechar a torneira com o papel.',
    ],
  },
  'banho no leito e higiene íntima': {
    objetivo: 'Promover higiene corporal, conforto, prevenção de odores e integridade cutânea em residentes com dependência total (Grau 3).',
    publico: 'Cuidadores e equipe de enfermagem.',
    frequencia: 'Diária e sempre que necessário após evacuação/diurese.',
    passos: [
      'Garantir privacidade do residente fechando portas e cortinas, e manter o ambiente aquecido.',
      'Reunir materiais previamente: bacia, sabonete líquido neutro, toalhas macias, roupas limpas, AGE/hidratante e fralda.',
      'Higienizar as mãos e calçar luvas de procedimento.',
      'Realizar a limpeza no sentido céfalo-caudal (face, membros superiores, tronco, membros inferiores e genitália por último).',
      'Secar meticulosamente sem fricção vigorosa, atentando-se a dobras cutâneas (axilas, virilhas, submamárias).',
      'Aplicar hidratante corporal ou AGE após o banho para manter a barreira protetora da pele.',
      'Colocar fralda limpa ajustada sem dobrar os elásticos e reposicionar o residente com segurança.',
    ],
  },
  'prevenção de quedas': {
    objetivo: 'Minimizar o risco de quedas e traumatismos em residentes idosos por meio de intervenções preventivas.',
    publico: 'Cuidadores, enfermagem, fisioterapia e toda a equipe da ILPI.',
    frequencia: 'Monitoramento contínuo em todos os turnos de plantão.',
    passos: [
      'Verificar pontuação da Escala de Morse e grau de dependência no prontuário.',
      'Manter grades da cama elevadas durante os períodos de repouso.',
      'Assegurar que o residente use calçados fechados e antiderrapantes (proibir meias sem solado).',
      'Manter iluminação adequada nos quartos, corredores e banheiros (luz noturna).',
      'Retirar tapetes soltos e obstáculos do trajeto de deambulação.',
      'Acompanhar de perto residentes desorientados ou que necessitem de auxílio na transferência e marcha.',
      'Manter campainha ou botão de auxílio ao alcance das mãos do idoso.',
    ],
  },
  'prevenção de lesão por pressão': {
    objetivo: 'Prevenir o surgimento de lesões por pressão (LPP) em residentes acamados ou com mobilidade reduzida.',
    publico: 'Enfermagem, cuidadores e fisioterapia.',
    frequencia: 'Mudança de decúbito a cada 2 horas (rigorosamente protocolada).',
    passos: [
      'Realizar avaliação de risco pela Escala de Braden na admissão e reavaliações periódicas.',
      'Executar mudança de decúbito a cada 2 horas conforme escala de posições (dorsal, lateral D, lateral E).',
      'Utilizar colchão pneumático ou viscoelástico para alívio de pressão em residentes de alto risco.',
      'Não friccionar ou massagear proeminências ósseas avermelhadas.',
      'Hidratar a pele diariamente com ácidos graxos essenciais (AGE) ou loção hidratante neutra.',
      'Trocar fraldas imediatamente após eliminações para evitar umidade prolongada.',
      'Inspecionar diariamente calcâneos, sacro, trocânteres e cotovelos.',
    ],
  },
  'manual de boas práticas da ilpi': {
    objetivo: 'Estabelecer os padrões de qualidade, acolhimento humanizado e conformidade com a RDC 502/2021 da ANVISA.',
    publico: 'Todos os profissionais e colaboradores da ILPI.',
    frequencia: 'Vigência contínua com capacitação anual obrigatória.',
    passos: [
      'Preservar a autonomia, dignidade, privacidade e individualidade de cada idoso acolhido.',
      'Manter o Plano Individual de Atendimento (PIA) atualizado para cada residente.',
      'Respeitar hábitos de vida, preferências alimentares e rotinas individuais descritas no prontuário.',
      'Garantir registro fidedigno de todas as intercorrências e sinais vitais no prontuário eletrônico.',
      'Promover integração familiar e estímulo a atividades de convivência e lazer.',
    ],
  },
  'fluxo de óbito': {
    objetivo: 'Padronizar a conduta ética, legal e acolhedora em casos de falecimento de residente na instituição.',
    publico: 'Responsável Técnico, Enfermeiro, Médico e Cuidadores de plantão.',
    frequencia: 'Em situações de óbito constatado.',
    passos: [
      'Verificar ausência de sinais vitais e acionar o médico responsável / SAMU para constatação formal.',
      'Comunicar imediatamente o Responsável Técnico (RT) e a coordenação de enfermagem.',
      'Contatar o familiar responsável legal com acolhimento, serenidade e clareza.',
      'Realizar o preparo do corpo com respeito e dignidade, providenciando roupas indicadas pela família.',
      'Aguardar o serviço funerário ou transporte com toda a documentação médica organizada.',
      'Registrar a ocorrência no prontuário e arquivar declaração de óbito.',
    ],
  },
  'fluxo de urgência e remoção': {
    objetivo: 'Agilizar o atendimento de emergência médica e remoção segura de residentes para rede hospitalar.',
    publico: 'Equipe de enfermagem e cuidadores de plantão.',
    frequencia: 'Imediato após identificação de agravo agudo ou instabilidade clínica.',
    passos: [
      'Identificar sinais de alarme: PCR, perda súbita de consciência, dispneia intensa, dor torácica, convulsão, etc.',
      'Iniciar manobras de primeiro atendimento e suporte básico de vida imediatamente.',
      'Acionar simultaneamente o SAMU (192) ou serviço de ambulância privada do convênio.',
      'Avisar o Enfermeiro RT de plantão e o médico assistente.',
      'Contatar o responsável familiar informado no prontuário.',
      'Imprimir ficha de emergência com resumo do prontuário, alergias e lista de medicamentos para a equipe do SAMU.',
      'Acompanhar o residente até a chegada da equipe de suporte avançado.',
    ],
  },
  'fluxo de admissão do residente': {
    objetivo: 'Garantir acolhimento seguro, integrado e registro completo na admissão de novo residente na ILPI.',
    publico: 'RT, Equipe de Enfermagem, Serviço Social e Equipe Multiprofissional.',
    frequencia: 'No momento da admissão institucional.',
    passos: [
      'Recepcionar o residente e familiares em ambiente acolhedor e privativo.',
      'Conferir checklist de documentos obrigatórios (RG, CPF, cartão SUS, contrato e relatórios médicos).',
      'Realizar avaliação multidimensional inicial (sinais vitais, exame físico, Fugulin, Morse, Braden).',
      'Conferir e cadastrar prescrição médica e medicamentos trazidos pela família.',
      'Inventariar pertences pessoais e acomodar o residente em seu quarto designado.',
      'Apresentar a equipe de cuidados e a rotina da casa ao residente.',
    ],
  },
}

interface SecaoPopsProps {
  className?: string
  mostrarApenasConsulta?: boolean
}

export function SecaoPops({ className, mostrarApenasConsulta = false }: SecaoPopsProps) {
  const { pops, refresh } = useIlpiData()
  const { profissional } = useAuth()

  // Permissão: somente RT e Enfermeiro editam; todos podem visualizar
  const podeEditar = !mostrarApenasConsulta && profissional ? can(profissional.cat, 'pop_editar') : false

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'vigente' | 'pendente'>('todos')

  // Modais de Criação e Edição
  const [dialogPopOpen, setDialogPopOpen] = useState(false)
  const [popEditando, setPopEditando] = useState<PopDocumento | null>(null)
  const [salvandoPop, setSalvandoPop] = useState(false)
  const [popTitulo, setPopTitulo] = useState('')
  const [popTipo, setPopTipo] = useState('POP')
  const [popRevisao, setPopRevisao] = useState(T)

  // Modal de Exclusão
  const [popParaExcluir, setPopParaExcluir] = useState<PopDocumento | null>(null)

  // Modal de Leitura / Detalhes do Procedimento
  const [popVisualizando, setPopVisualizando] = useState<PopDocumento | null>(null)

  // Anexos de POPs e Manuais (PDFs e Documentos Escaneados)
  const [anexosPops, setAnexosPops] = useState<Record<string, AnexoDocumento>>({})
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [anexoAtual, setAnexoAtual] = useState<AnexoDocumento | null>(null)
  const [removerAnexoExistente, setRemoverAnexoExistente] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Visualizador de Documento
  const [modalVisualizarDoc, setModalVisualizarDoc] = useState(false)
  const [docParaVisualizar, setDocParaVisualizar] = useState<{ anexo: AnexoDocumento; titulo: string } | null>(null)

  useEffect(() => {
    carregarTodosAnexosLocais('pop').then(setAnexosPops)
  }, [])

  const popsFiltrados = useMemo(() => {
    return pops.filter((p) => {
      // Filtro de texto
      if (busca.trim()) {
        const q = busca.toLowerCase()
        const matchTitulo = p.titulo.toLowerCase().includes(q)
        const matchTipo = p.tipo.toLowerCase().includes(q)
        if (!matchTitulo && !matchTipo) return false
      }

      // Filtro de tipo
      if (filtroTipo !== 'todos' && p.tipo.toLowerCase() !== filtroTipo.toLowerCase()) {
        return false
      }

      // Filtro de vigência
      const v = p.revisao ? diffDays(p.revisao, T) : 0
      const precisaRevisao = v < -365

      if (filtroStatus === 'vigente' && precisaRevisao) return false
      if (filtroStatus === 'pendente' && !precisaRevisao) return false

      return true
    })
  }, [pops, busca, filtroTipo, filtroStatus])

  function abrirNovoPop() {
    setPopEditando(null)
    const draft = obterRascunho<{ titulo: string; tipo: string; revisao: string }>('pop_novo_draft')
    if (draft?.dados) {
      setPopTitulo(draft.dados.titulo || '')
      setPopTipo(draft.dados.tipo || 'POP')
      setPopRevisao(draft.dados.revisao || T)
    } else {
      setPopTitulo('')
      setPopTipo('POP')
      setPopRevisao(T)
    }
    setArquivoSelecionado(null)
    setAnexoAtual(null)
    setRemoverAnexoExistente(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setDialogPopOpen(true)
  }

  // Auto-save de novo POP para evitar perda de dados caso a máquina desligue ou caia a conexão
  useEffect(() => {
    if (!dialogPopOpen || popEditando) return
    const timer = setTimeout(() => {
      if (popTitulo.trim()) {
        salvarRascunho('pop_novo_draft', { titulo: popTitulo, tipo: popTipo, revisao: popRevisao })
      } else {
        limparRascunho('pop_novo_draft')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [dialogPopOpen, popEditando, popTitulo, popTipo, popRevisao])

  function abrirEditarPop(p: PopDocumento) {
    setPopEditando(p)
    setPopTitulo(p.titulo)
    setPopTipo(p.tipo)
    setPopRevisao(p.revisao)
    setArquivoSelecionado(null)
    setRemoverAnexoExistente(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    const anexoExistente = anexosPops[p.id] || (p.arquivo_url ? {
      id: p.id,
      tipoDocumento: 'pop' as const,
      nomeArquivo: p.arquivo_nome || 'pop.pdf',
      tipoMime: p.arquivo_tipo || 'application/pdf',
      tamanho: p.arquivo_tamanho || 0,
      dataUpload: p.arquivo_data || '',
      url: p.arquivo_url,
    } : null)
    setAnexoAtual(anexoExistente)
    setDialogPopOpen(true)
  }

  async function handleSalvarPop() {
    if (!popTitulo.trim()) {
      toast.error('Informe o título do procedimento / POP.')
      return
    }

    setSalvandoPop(true)
    const popId = popEditando ? popEditando.id : `pop_${Date.now()}`

    let anexoSalvo: AnexoDocumento | null = null
    if (arquivoSelecionado) {
      try {
        anexoSalvo = await processarArquivoParaAnexo('pop', popId, arquivoSelecionado)
        setAnexosPops((prev) => ({ ...prev, [popId]: anexoSalvo! }))
      } catch (err) {
        console.error('Erro ao processar anexo:', err)
        toast.error('Falha ao processar arquivo anexo.')
      }
    } else if (removerAnexoExistente) {
      await removerAnexoLocal('pop', popId)
      setAnexosPops((prev) => {
        const copy = { ...prev }
        delete copy[popId]
        return copy
      })
    }

    const payloadBase = {
      titulo: popTitulo.trim(),
      tipo: popTipo,
      revisao: popRevisao,
    }

    const payloadComArquivo = {
      ...payloadBase,
      ...(anexoSalvo ? {
        arquivo_url: anexoSalvo.url,
        arquivo_nome: anexoSalvo.nomeArquivo,
        arquivo_tipo: anexoSalvo.tipoMime,
        arquivo_tamanho: anexoSalvo.tamanho,
        arquivo_data: anexoSalvo.dataUpload,
      } : removerAnexoExistente ? {
        arquivo_url: null,
        arquivo_nome: null,
        arquivo_tipo: null,
        arquivo_tamanho: null,
        arquivo_data: null,
      } : {}),
    }

    if (popEditando) {
      let { error } = await supabase
        .from('pops')
        .update(payloadComArquivo)
        .eq('id', popEditando.id)

      if (error && error.message?.includes('column')) {
        const fallback = await supabase
          .from('pops')
          .update(payloadBase)
          .eq('id', popEditando.id)
        error = fallback.error
      }

      setSalvandoPop(false)
      if (error) {
        toast.error(`Erro ao atualizar POP: ${error.message}`)
        return
      }
      toast.success('Procedimento atualizado com sucesso!')
    } else {
      let { error } = await supabase.from('pops').insert({
        id: popId,
        ...payloadComArquivo,
      })

      if (error && error.message?.includes('column')) {
        const fallback = await supabase.from('pops').insert({
          id: popId,
          ...payloadBase,
        })
        error = fallback.error
      }

      setSalvandoPop(false)
      if (error) {
        toast.error(`Erro ao cadastrar POP: ${error.message}`)
        return
      }
      toast.success('Novo POP cadastrado com sucesso!')
    }

    limparRascunho('pop_novo_draft')
    setDialogPopOpen(false)
    await refresh()
  }

  async function handleExcluirPop() {
    if (!popParaExcluir) return
    const id = popParaExcluir.id
    await removerAnexoLocal('pop', id)
    setAnexosPops((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
    const { error } = await supabase.from('pops').delete().eq('id', id)
    if (error) {
      toast.error(`Erro ao excluir POP: ${error.message}`)
      return
    }
    toast.success('Procedimento removido.')
    setPopParaExcluir(null)
    await refresh()
  }

  async function handleMarcarRevisadoHoje(p: PopDocumento, e: React.MouseEvent) {
    e.stopPropagation()
    const { error } = await supabase
      .from('pops')
      .update({ revisao: T })
      .eq('id', p.id)

    if (error) {
      toast.error(`Erro ao registrar revisão: ${error.message}`)
      return
    }
    toast.success(`Revisão de "${p.titulo}" registrada para hoje!`)
    await refresh()
  }

  function obterDiretrizes(p: PopDocumento) {
    const chave = p.titulo.toLowerCase().trim()
    for (const [k, d] of Object.entries(DIRETRIZES_PADRAO)) {
      if (chave.includes(k) || k.includes(chave)) {
        return d
      }
    }
    return {
      objetivo: `Padronizar a rotina de ${p.titulo} na ILPI em conformidade com as diretrizes da RDC 502/2021 da ANVISA.`,
      publico: 'Equipe multidisciplinar, enfermagem e cuidadores.',
      frequencia: 'Sempre que aplicável na rotina diária.',
      passos: [
        'Higienizar as mãos antes e após a realização do procedimento.',
        'Verificar as condições de saúde e o consentimento do residente.',
        'Reunir todos os materiais necessários com antecedência.',
        'Realizar o procedimento com técnica asséptica ou limpa, respeitando a privacidade e dignidade do idoso.',
        'Registrar a realização e qualquer alteração observada no prontuário eletrônico.',
      ],
    }
  }

  function imprimirPop(p: PopDocumento) {
    const dir = obterDiretrizes(p)
    const janela = window.open('', '_blank', 'width=800,height=600')
    if (!janela) return

    janela.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${p.titulo} - Procedimento Padrão</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; color: #111; line-height: 1.5; }
          h1 { font-size: 18px; margin-bottom: 4px; color: #0f172a; }
          .tipo { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #0284c7; }
          .sub { color: #64748b; font-size: 12px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; }
          .box strong { color: #1e293b; }
          h2 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; color: #0f172a; border-bottom: 1px solid #eee; padding-bottom: 4px; }
          ol { padding-left: 20px; font-size: 13px; color: #334155; }
          li { margin-bottom: 8px; }
          .footer { margin-top: 36px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="tipo">${p.tipo} — Procedimento Operacional Padrão</div>
        <h1>${p.titulo}</h1>
        <div class="sub">Sistema ILPI · Documento Vigente · Revisão: ${fmt(p.revisao)}</div>

        <div class="box">
          <p><strong>Objetivo:</strong> ${dir.objetivo}</p>
          <p><strong>Público-Alvo:</strong> ${dir.publico}</p>
          <p><strong>Frequência / Monitoramento:</strong> ${dir.frequencia}</p>
        </div>

        <h2>Passo a Passo / Diretrizes do Procedimento:</h2>
        <ol>
          ${dir.passos.map((passo) => `<li>${passo}</li>`).join('')}
        </ol>

        <div class="footer">
          Documento técnico da instituição · Em conformidade com as normas sanitárias vigentes (RDC 502/2021 Anvisa).
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `)
    janela.document.close()
  }

  return (
    <Card className={cn('border border-border/70 shadow-xs rounded-2xl overflow-hidden', className)}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="size-4.5 text-primary" />
            <CardTitle className="text-base font-bold font-heading flex items-center gap-2">
              <span>Procedimentos Operacionais Padrão (POPs & Protocolos)</span>
              <Badge variant="secondary" className="text-xs font-semibold">
                {pops.length} cadastrados
              </Badge>
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manuais clínicos, condutas de enfermagem, biossegurança e fluxogramas operacionais da ILPI.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!podeEditar && (
            <Badge variant="outline" className="text-[11px] text-muted-foreground bg-background">
              👁️ Modo Consulta (Edição restrita a Enfermagem e RT)
            </Badge>
          )}

          {podeEditar && (
            <Button
              size="sm"
              onClick={abrirNovoPop}
              className="rounded-xl gap-1 text-xs h-8 bg-[#123F4A] hover:bg-[#123F4A]/90 text-white shadow-xs font-semibold"
            >
              <Plus className="size-3.5" /> Novo POP
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Barra de Busca e Filtros Rápidos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome do POP ou protocolo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-8 pl-8 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setFiltroTipo('todos')}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg transition-all',
                  filtroTipo === 'todos'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('pop')}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg transition-all',
                  filtroTipo === 'pop'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                POPs
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('protocolo')}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg transition-all',
                  filtroTipo === 'protocolo'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Protocolos
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('fluxograma')}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg transition-all',
                  filtroTipo === 'fluxograma'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Fluxogramas
              </button>
            </div>

            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setFiltroStatus('todos')}
                className={cn(
                  'px-2 py-1 text-[11px] rounded-lg transition-all',
                  filtroStatus === 'todos' ? 'bg-background font-semibold shadow-2xs' : 'text-muted-foreground'
                )}
              >
                Status: Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('vigente')}
                className={cn(
                  'px-2 py-1 text-[11px] rounded-lg transition-all',
                  filtroStatus === 'vigente'
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold shadow-2xs'
                    : 'text-muted-foreground'
                )}
              >
                Vigentes
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('pendente')}
                className={cn(
                  'px-2 py-1 text-[11px] rounded-lg transition-all',
                  filtroStatus === 'pendente'
                    ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 font-semibold shadow-2xs'
                    : 'text-muted-foreground'
                )}
              >
                Revisão Pendente
              </button>
            </div>
          </div>
        </div>

        {/* Grade de POPs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popsFiltrados.map((p) => {
            const v = p.revisao ? diffDays(p.revisao, T) : 0
            const precisaRevisao = v < -365
            const anexo = anexosPops[p.id] || (p.arquivo_url ? {
              id: p.id,
              tipoDocumento: 'pop' as const,
              nomeArquivo: p.arquivo_nome || 'procedimento.pdf',
              tipoMime: p.arquivo_tipo || 'application/pdf',
              tamanho: p.arquivo_tamanho || 0,
              dataUpload: p.arquivo_data || '',
              url: p.arquivo_url,
            } : null)

            return (
              <div
                key={p.id}
                onClick={() => setPopVisualizando(p)}
                className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex flex-col justify-between gap-2.5 text-xs shadow-2xs cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-start gap-2.5">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileCheck2 className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground block truncate group-hover:text-primary transition-colors">
                        {p.titulo}
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Tipo: <strong className="text-foreground/90">{p.tipo}</strong> · Última revisão: {fmt(p.revisao)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {precisaRevisao ? (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertTriangle className="size-2.5" />
                        Revisão pendente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                        Vigente
                      </Badge>
                    )}

                    {/* Ação rápida de leitura para qualquer usuário */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setPopVisualizando(p)}
                      title="Visualizar Procedimento e Diretrizes"
                    >
                      <Eye className="size-3.5" />
                    </Button>

                    {/* Ações de Gestão: Restritas a Enfermeiro e RT */}
                    {podeEditar && (
                      <div className="flex items-center gap-0.5">
                        {precisaRevisao && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-amber-600 hover:bg-amber-500/10"
                            onClick={(e) => handleMarcarRevisadoHoje(p, e)}
                            title="Marcar como revisado na data de hoje"
                          >
                            <RotateCw className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => abrirEditarPop(p)}
                          title="Editar POP e anexos"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                          onClick={() => setPopParaExcluir(p)}
                          title="Excluir POP"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linha do Anexo Digitalizado para Fiscalização */}
                <div
                  className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {anexo ? (
                    <>
                      <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300 font-medium min-w-0">
                        <Paperclip className="size-3.5 shrink-0 text-teal-600" />
                        <span className="truncate max-w-[150px] sm:max-w-[210px]">{anexo.nomeArquivo}</span>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          ({formatarTamanhoArquivo(anexo.tamanho)})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[10px] rounded-lg gap-1 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10"
                          onClick={() => {
                            setDocParaVisualizar({ anexo, titulo: p.titulo })
                            setModalVisualizarDoc(true)
                          }}
                          title="Visualizar documento anexo"
                        >
                          <Eye className="size-3" /> Ver Anexo
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-6 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => baixarDocumento(anexo)}
                          title="Baixar arquivo original"
                        >
                          <Download className="size-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] italic">
                        Sem via digitalizada anexada
                      </span>
                      {podeEditar && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-teal-700 dark:text-teal-400 hover:underline hover:bg-teal-500/10 rounded-lg"
                          onClick={() => abrirEditarPop(p)}
                        >
                          + Anexar via original
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {!popsFiltrados.length && (
            <div className="col-span-full p-8 text-center text-xs text-muted-foreground italic border border-dashed rounded-xl bg-muted/10">
              Nenhum procedimento encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialog: Visualização Detalhada do POP (Para toda a equipe) */}
      <Dialog open={!!popVisualizando} onOpenChange={(open) => !open && setPopVisualizando(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {popVisualizando && (() => {
            const dir = obterDiretrizes(popVisualizando)
            const v = popVisualizando.revisao ? diffDays(popVisualizando.revisao, T) : 0
            const precisaRevisao = v < -365
            const anexo = anexosPops[popVisualizando.id] || (popVisualizando.arquivo_url ? {
              id: popVisualizando.id,
              tipoDocumento: 'pop' as const,
              nomeArquivo: popVisualizando.arquivo_nome || 'procedimento_oficial.pdf',
              tipoMime: popVisualizando.arquivo_tipo || 'application/pdf',
              tamanho: popVisualizando.arquivo_tamanho || 0,
              dataUpload: popVisualizando.arquivo_data || '',
              url: popVisualizando.arquivo_url,
            } : null)

            return (
              <>
                <DialogHeader className="p-4 sm:px-6 border-b border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {popVisualizando.tipo} — Documento Técnico
                      </span>
                      <DialogTitle className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                        {popVisualizando.titulo}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                        Última revisão por RT/Enfermagem: <strong>{fmt(popVisualizando.revisao)}</strong>
                      </DialogDescription>
                    </div>
                    {precisaRevisao ? (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        Revisão Pendente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 shrink-0">
                        Vigente
                      </Badge>
                    )}
                  </div>
                </DialogHeader>

                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
                  {/* Via Digitalizada Oficial (Para Vigilância Sanitária e Fiscalização) */}
                  <div className="p-3.5 rounded-xl border border-teal-500/30 bg-teal-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="size-4 text-teal-600" />
                        <span className="font-bold text-foreground text-xs">
                          Via Digitalizada Oficial (Vigilância Sanitária / RDC 502)
                        </span>
                      </div>
                      {anexo && (
                        <Badge variant="outline" className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 text-[10px]">
                          {formatarTamanhoArquivo(anexo.tamanho)}
                        </Badge>
                      )}
                    </div>

                    {anexo ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-teal-500/20">
                        <div className="min-w-0 flex items-center gap-1.5 text-xs">
                          <Paperclip className="size-3.5 text-teal-600 shrink-0" />
                          <span className="font-medium text-foreground truncate">{anexo.nomeArquivo}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDocParaVisualizar({ anexo, titulo: popVisualizando.titulo })
                              setModalVisualizarDoc(true)
                            }}
                            className="text-xs h-7 px-2.5 rounded-xl gap-1 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10"
                          >
                            <Eye className="size-3.5" /> Visualizar Documento
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => baixarDocumento(anexo)}
                            className="text-xs h-7 px-2.5 rounded-xl gap-1"
                          >
                            <Download className="size-3.5" /> Baixar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1 border-t border-teal-500/20 text-[11px] text-muted-foreground">
                        <span className="italic">Nenhuma via digitalizada escaneada anexada. Apenas diretrizes textuais.</span>
                        {podeEditar && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-teal-700 dark:text-teal-400 hover:underline"
                            onClick={() => {
                              const pop = popVisualizando
                              setPopVisualizando(null)
                              abrirEditarPop(pop)
                            }}
                          >
                            + Anexar via original
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                    <div>
                      <strong className="text-foreground block">🎯 Objetivo do Procedimento:</strong>
                      <span className="text-muted-foreground">{dir.objetivo}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40 text-[11px]">
                      <div>
                        <strong className="text-foreground">👥 Executores:</strong> {dir.publico}
                      </div>
                      <div>
                        <strong className="text-foreground">⏱️ Frequência:</strong> {dir.frequencia}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-foreground block mb-2">
                      Passo a Passo / Diretrizes Obrigatórias:
                    </Label>
                    <div className="space-y-2">
                      {dir.passos.map((passo, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-card border border-border/50">
                          <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-foreground leading-relaxed">{passo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imprimirPop(popVisualizando)}
                    className="gap-1.5 text-xs rounded-xl"
                  >
                    <Printer className="size-3.5" />
                    <span>Imprimir Guia</span>
                  </Button>

                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setPopVisualizando(null)}
                    className="text-xs rounded-xl"
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog: Novo / Editar POP (Apenas Enfermeiro e RT) */}
      <Dialog open={dialogPopOpen} onOpenChange={setDialogPopOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between flex-wrap gap-2">
              <span>{popEditando ? 'Editar Procedimento Padrão' : 'Novo POP / Protocolo'}</span>
              {!popEditando && temRascunho('pop_novo_draft') && popTitulo.trim() && (
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                  ✓ Rascunho salvo
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre ou atualize a vigência do documento técnico da instituição.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="popTitulo" className="text-xs font-semibold">
                Título do Procedimento *
              </Label>
              <Input
                id="popTitulo"
                placeholder="Ex: Banho no leito e higiene íntima"
                value={popTitulo}
                onChange={(e) => setPopTitulo(e.target.value)}
                className="h-8 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Documento</Label>
              <Select value={popTipo} onValueChange={(val) => setPopTipo(val)}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POP">POP (Procedimento Operacional Padrão)</SelectItem>
                  <SelectItem value="Protocolo">Protocolo Clínico</SelectItem>
                  <SelectItem value="Manual">Manual de Boas Práticas</SelectItem>
                  <SelectItem value="Fluxograma">Fluxograma Obrigatório</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="popRevisao" className="text-xs font-semibold">
                Data da Última Revisão
              </Label>
              <Input
                id="popRevisao"
                type="date"
                value={popRevisao}
                onChange={(e) => setPopRevisao(e.target.value)}
                className="h-8 text-xs rounded-xl"
              />
            </div>

            {/* Upload de Documento Digitalizado (PDF ou Imagem) */}
            <div className="space-y-1 pt-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Via Digitalizada Original (PDF ou Imagem)</span>
                <span className="text-[10px] text-muted-foreground font-normal">Exigência Vigilância</span>
              </Label>

              <div className="border border-dashed border-border/80 rounded-xl p-3 bg-muted/10 text-center">
                {arquivoSelecionado ? (
                  <div className="flex items-center justify-between gap-2 bg-card p-2 rounded-lg border border-border">
                    <div className="flex items-center gap-2 min-w-0 text-left">
                      <FileCheck2 className="size-4 text-teal-600 shrink-0" />
                      <div className="min-w-0 text-xs">
                        <span className="font-semibold block truncate">{arquivoSelecionado.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatarTamanhoArquivo(arquivoSelecionado.size)} (Novo arquivo selecionado)
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-rose-600"
                      onClick={() => {
                        setArquivoSelecionado(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      title="Descartar seleção"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : anexoAtual && !removerAnexoExistente ? (
                  <div className="flex items-center justify-between gap-2 bg-card p-2 rounded-lg border border-border">
                    <div className="flex items-center gap-2 min-w-0 text-left">
                      <FileCheck2 className="size-4 text-teal-600 shrink-0" />
                      <div className="min-w-0 text-xs">
                        <span className="font-semibold block truncate">{anexoAtual.nomeArquivo}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatarTamanhoArquivo(anexoAtual.tamanho)} · Anexo cadastrado
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[10px] gap-1"
                        onClick={() => {
                          setDocParaVisualizar({ anexo: anexoAtual, titulo: popTitulo || 'POP' })
                          setModalVisualizarDoc(true)
                        }}
                      >
                        <Eye className="size-3" /> Ver
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-rose-600"
                        onClick={() => setRemoverAnexoExistente(true)}
                        title="Remover anexo"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/*,.doc,.docx"
                      className="hidden"
                      id="input-pop-doc"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setArquivoSelecionado(e.target.files[0])
                          setRemoverAnexoExistente(false)
                        }
                      }}
                    />
                    <label
                      htmlFor="input-pop-doc"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1.5 py-2 hover:opacity-80 transition-opacity"
                    >
                      <UploadCloud className="size-6 text-teal-600" />
                      <span className="text-xs font-semibold text-foreground">
                        Clique para anexar o PDF ou documento original do POP
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Aceita PDF, fotos escaneadas e DOCX (até 15MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogPopOpen(false)}
              disabled={salvandoPop}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarPop}
              disabled={salvandoPop}
              className="text-xs rounded-xl bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
            >
              {salvandoPop ? 'Salvando...' : popEditando ? 'Atualizar POP' : 'Cadastrar POP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de POP */}
      <Dialog open={!!popParaExcluir} onOpenChange={(open) => !open && setPopParaExcluir(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="size-4" /> Excluir Procedimento
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Deseja remover o procedimento <strong>&quot;{popParaExcluir?.titulo}&quot;</strong>? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" size="sm" onClick={() => setPopParaExcluir(null)} className="text-xs rounded-xl">
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleExcluirPop} className="text-xs rounded-xl">
              Excluir POP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Visualizador de Documento Anexo */}
      <VisualizadorDocumentoModal
        anexo={docParaVisualizar?.anexo ?? null}
        tituloDocumento={docParaVisualizar?.titulo}
        aberto={modalVisualizarDoc}
        onClose={() => setModalVisualizarDoc(false)}
      />
    </Card>
  )
}
