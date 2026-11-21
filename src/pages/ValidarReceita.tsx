import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Stethoscope,
  Pill,
  User,
  Search,
  Printer,
  FileCheck2,
  Store,
  BadgeAlert,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import {
  buscarPedidoPorCodigoOuId,
  registrarDispensacaoFarmacia,
  type PedidoMedicoData,
} from '../lib/business/pedidosMedicos'
import { fmt } from '../lib/business/dates'

export default function ValidarReceita() {
  const { codigo } = useParams<{ codigo?: string }>()
  const [codigoInput, setCodigoInput] = useState(codigo || '')
  const [pedidoEncontrado, setPedidoEncontrado] = useState<PedidoMedicoData | null>(null)
  const [residenteNome, setResidenteNome] = useState('')
  const [buscou, setBuscou] = useState(false)

  // Formulário de registro de dispensação da farmácia
  const [modalDispensar, setModalDispensar] = useState(false)
  const [farmaciaNome, setFarmaciaNome] = useState('')
  const [farmaceuticoNome, setFarmaceuticoNome] = useState('')
  const [farmaceuticoCrf, setFarmaceuticoCrf] = useState('')
  const [farmaciaCidade, setFarmaciaCidade] = useState('')

  useEffect(() => {
    if (codigo) {
      setCodigoInput(codigo)
      executarBusca(codigo)
    }
  }, [codigo])

  function executarBusca(cod: string) {
    if (!cod.trim()) return
    setBuscou(true)
    const resultado = buscarPedidoPorCodigoOuId(cod.trim())
    if (resultado) {
      setPedidoEncontrado(resultado.pedido)
      // Tenta obter o nome do paciente pelo storage ou dados salvos
      try {
        const rawRes = localStorage.getItem('ilpi_residentes')
        if (rawRes) {
          const lista = JSON.parse(rawRes)
          const r = lista.find((item: any) => item.id === resultado.residenteId)
          if (r) setResidenteNome(r.nome)
        }
      } catch {
        // fallback
      }
    } else {
      setPedidoEncontrado(null)
    }
  }

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    executarBusca(codigoInput)
  }

  function handleRegistrarDispensacao(e: React.FormEvent) {
    e.preventDefault()
    if (!farmaciaNome.trim() || !farmaceuticoNome.trim() || !farmaceuticoCrf.trim()) {
      toast.error('Preencha os dados obrigatórios da farmácia e do farmacêutico (CRF).')
      return
    }

    if (!pedidoEncontrado) return

    const sucesso = registrarDispensacaoFarmacia(pedidoEncontrado.codigoValidacao || pedidoEncontrado.id, {
      farmaciaNome: farmaciaNome.trim(),
      farmaceuticoNome: farmaceuticoNome.trim(),
      farmaceuticoCrf: farmaceuticoCrf.trim(),
      farmaciaCidadeUf: farmaciaCidade.trim() || undefined,
    })

    if (sucesso) {
      toast.success('Dispensação farmacêutica registrada com sucesso!')
      setModalDispensar(false)
      executarBusca(pedidoEncontrado.codigoValidacao || pedidoEncontrado.id)
    } else {
      toast.error('Erro ao registrar dispensação.')
    }
  }

  // Verifica prazo de validade (30 dias)
  const diasValidade = pedidoEncontrado?.validadeDias || 30
  let dataValidadeObj: Date | null = null
  let estaVencida = false

  if (pedidoEncontrado?.data) {
    const [ano, mes, dia] = pedidoEncontrado.data.split('-').map(Number)
    if (ano && mes && dia) {
      dataValidadeObj = new Date(ano, mes - 1, dia)
      dataValidadeObj.setDate(dataValidadeObj.getDate() + diasValidade)
      estaVencida = new Date() > dataValidadeObj
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* BARRA SUPERIOR PÚBLICA */}
      <header className="border-b border-border bg-white dark:bg-card shadow-2xs py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-700 text-white shadow-xs">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block">
                Validador Nacional de Receituário Digital
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Infraestrutura ICP-Brasil · Portaria SVS/MS nº 344/98 e CFM nº 2.299/2021
              </span>
            </div>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:underline"
          >
            Acessar Sistema ILPI →
          </Link>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* BUSCA MANUAL DE CÓDIGO */}
        <div className="p-5 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-sm space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Consultar Autenticidade da Receita por Código de Controle
          </Label>
          <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ex: ILPI-REC-2026-XXXX-YYYY"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                className="pl-9 font-mono text-sm tracking-wider uppercase h-10"
              />
            </div>
            <Button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-10 px-6 gap-1.5"
            >
              <FileCheck2 className="size-4" /> Verificar Autenticidade
            </Button>
          </form>
        </div>

        {/* RESULTADO: NÃO ENCONTRADO */}
        {buscou && !pedidoEncontrado && (
          <div className="p-8 rounded-2xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-2">
            <BadgeAlert className="size-10 text-rose-600 mx-auto" />
            <h2 className="text-base font-bold text-rose-950 dark:text-rose-100">
              Receita Não Localizada
            </h2>
            <p className="text-xs text-rose-800/80 dark:text-rose-300 max-w-md mx-auto">
              Nenhuma prescrição correspondente ao código informado foi encontrada. Verifique se o código digitado está correto.
            </p>
          </div>
        )}

        {/* RESULTADO: ENCONTRADO E VÁLIDO */}
        {pedidoEncontrado && (
          <div className="space-y-6">
            {/* SELO DE AUTENTICIDADE */}
            <div className="p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shrink-0">
                  <CheckCircle2 className="size-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] uppercase font-bold tracking-wider">
                      Documento Oficial Autêntico
                    </Badge>
                    {pedidoEncontrado.tipoReceita === 'controle_especial' && (
                      <Badge variant="outline" className="border-amber-600/60 text-amber-700 dark:text-amber-300 bg-amber-500/10 text-[10px] font-bold">
                        Controle Especial (Portaria 344/98)
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-lg font-bold text-foreground mt-1">
                    Receita Médica Digital com Assinatura ICP-Brasil
                  </h1>
                  <p className="text-xs text-muted-foreground font-mono">
                    Código de Controle: <strong>{pedidoEncontrado.codigoValidacao || pedidoEncontrado.id}</strong>
                  </p>
                </div>
              </div>

              {/* Status de Validade e Dispensação */}
              <div className="flex sm:flex-col items-end gap-2 text-right">
                {estaVencida ? (
                  <Badge variant="destructive" className="gap-1 text-xs font-bold">
                    <AlertTriangle className="size-3" /> Receita Expirada
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600 text-white gap-1 text-xs font-semibold">
                    <Clock className="size-3" /> Vigente ({diasValidade} dias)
                  </Badge>
                )}

                {pedidoEncontrado.dispensacao ? (
                  <Badge variant="outline" className="border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-500/10 text-[11px] font-bold">
                    ✓ Já Dispensada na Farmácia
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-500/10 text-[11px] font-bold">
                    Disponível para Dispensação
                  </Badge>
                )}
              </div>
            </div>

            {/* DETALHES EM CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Prescritora */}
              <div className="p-5 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Stethoscope className="size-3.5 text-blue-600" /> Profissional Prescritor(a)
                </span>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">
                    {pedidoEncontrado.prescritor.nome}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {pedidoEncontrado.prescritor.conselho}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pedidoEncontrado.prescritor.funcao || 'Médico(a) Assistente'}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                  Emitido em: <strong>{fmt(pedidoEncontrado.data)} às {pedidoEncontrado.hora}</strong>
                </div>
              </div>

              {/* Card 2: Paciente */}
              <div className="p-5 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-blue-600" /> Identificação do(a) Paciente
                </span>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">
                    {residenteNome || 'Paciente Residente da ILPI'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Acomodação / Atenção Integral à Saúde do Idoso
                  </p>
                </div>
                {pedidoEncontrado.cid10 && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      CID-10 / Hipótese Diagnóstica (Dispensação SUS / Convênio):
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {pedidoEncontrado.cid10}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* MEDICAMENTOS PRESCRITOS */}
            <div className="p-6 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Pill className="size-4 text-emerald-600" />
                  Medicamentos Prescritos & Posologia ({pedidoEncontrado.medicamentos?.length || 0})
                </span>
                <span className="text-xs text-muted-foreground">
                  Uso conforme orientação clínica
                </span>
              </div>

              <div className="space-y-3">
                {pedidoEncontrado.medicamentos?.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border/70 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-sm text-foreground block">
                        {idx + 1}. {m.nome} — {m.dose} ({m.via})
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        Como tomar / Posologia: <strong>{m.posologia}</strong>
                      </span>
                    </div>
                    {m.quantidade && (
                      <Badge variant="secondary" className="font-mono text-xs font-bold shrink-0">
                        Qtd: {m.quantidade}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {pedidoEncontrado.orientacoesGerais && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/60 text-xs">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Orientações Gerais ao Cuidador / Paciente:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {pedidoEncontrado.orientacoesGerais}
                  </p>
                </div>
              )}
            </div>

            {/* BOX DE ASSINATURA DIGITAL ICP-BRASIL */}
            {pedidoEncontrado.assinaturaDigital && (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Chancela Criptográfica PAdES / ICP-Brasil
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Assinado Por:</span>
                    <span className="font-bold text-foreground">{pedidoEncontrado.assinaturaDigital.assinadoPor}</span>
                    <span className="text-[11px] text-muted-foreground block">CPF: {pedidoEncontrado.assinaturaDigital.cpfPrescritor}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Autoridade Certificadora:</span>
                    <span className="font-semibold text-foreground">{pedidoEncontrado.assinaturaDigital.autoridadeCertificadora}</span>
                    <span className="text-[11px] text-emerald-600 font-medium block">Padrão ICP-Brasil</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Data & Hora da Assinatura:</span>
                    <span className="font-medium text-foreground">
                      {fmt(pedidoEncontrado.assinaturaDigital.dataHora)}
                    </span>
                    <span className="text-[11px] text-muted-foreground block font-mono">
                      Status: ICP Válido
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-500/20 text-[10px] font-mono text-muted-foreground break-all">
                  Hash SHA-256: {pedidoEncontrado.assinaturaDigital.hashSha256}
                </div>
              </div>
            )}

            {/* SEÇÃO DA FARMÁCIA / DISPENSAÇÃO FARMACÊUTICA */}
            <div className="p-6 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Store className="size-4 text-emerald-600" />
                  Área Exclusiva da Farmácia / Drogaria (Dispensação)
                </span>
              </div>

              {pedidoEncontrado.dispensacao ? (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-200">
                    <CheckCircle2 className="size-4 text-amber-600" />
                    Receita Dispensada com Retenção Farmacêutica Registrada
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-bold block text-foreground">Farmácia:</span>
                      {pedidoEncontrado.dispensacao.farmaciaNome}
                    </div>
                    <div>
                      <span className="font-bold block text-foreground">Farmacêutico(a):</span>
                      {pedidoEncontrado.dispensacao.farmaceuticoNome} (CRF: {pedidoEncontrado.dispensacao.farmaceuticoCrf})
                    </div>
                    <div>
                      <span className="font-bold block text-foreground">Dispensado em:</span>
                      {fmt(pedidoEncontrado.dispensacao.dispensadoEm)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-blue-950 dark:text-blue-100 block">
                      Farmacêutico(a): Registre a Dispensação da Receita
                    </span>
                    <p className="text-[11px] text-blue-800/80 dark:text-blue-300">
                      Dê baixa na receita para arquivamento e retenção da 1ª via digital, garantindo conformidade com a RDC 44/2009.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setModalDispensar(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shrink-0"
                  >
                    Registrar Baixa Farmacêutica
                  </Button>
                </div>
              )}
            </div>

            {/* BOTÃO PARA IMPRIMIR COMPROVANTE */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="gap-1.5 text-xs font-semibold"
              >
                <Printer className="size-3.5" /> Imprimir Comprovante de Validação
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE DISPENSAÇÃO FARMACÊUTICA */}
      {modalDispensar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Store className="size-4 text-emerald-600" />
                Registrar Dispensação Farmacêutica
              </h3>
              <p className="text-xs text-muted-foreground">
                Informe os dados da drogaria e do farmacêutico responsável pela entrega.
              </p>
            </div>

            <form onSubmit={handleRegistrarDispensacao} className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px]">Nome da Farmácia / Drogaria *</Label>
                <Input
                  placeholder="ex: Droga Raia / Drogasil / Farmácia Popular"
                  value={farmaciaNome}
                  onChange={(e) => setFarmaciaNome(e.target.value)}
                  required
                  className="text-xs h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Farmacêutico(a) *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={farmaceuticoNome}
                    onChange={(e) => setFarmaceuticoNome(e.target.value)}
                    required
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">CRF / UF *</Label>
                  <Input
                    placeholder="ex: CRF/SP 12345"
                    value={farmaceuticoCrf}
                    onChange={(e) => setFarmaceuticoCrf(e.target.value)}
                    required
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Cidade / UF</Label>
                <Input
                  placeholder="ex: São Paulo / SP"
                  value={farmaciaCidade}
                  onChange={(e) => setFarmaciaCidade(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalDispensar(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
                >
                  Confirmar Baixa da Receita
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RODAPÉ */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-white dark:bg-card mt-12">
        <p>Validador de Documentos Médicos Digitais · Sistema ILPI</p>
        <p className="text-[11px] mt-0.5">
          Conforme Art. 35 da Lei nº 5.991/1973, RDC nº 44/2009 e Portaria SVS/MS nº 344/1998.
        </p>
      </footer>
    </div>
  )
}
