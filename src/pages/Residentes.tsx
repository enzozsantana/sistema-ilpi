import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumoDia, nivelEst } from '../lib/business/estoque'
import { ultAval, totalEsc, SCALES } from '../lib/business/escalas'
import { docsPend } from '../lib/business/indicadores'
import { iso } from '../lib/business/dates'
import { can } from '../lib/permissions'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { supabase } from '../lib/supabase'
import { Allergy, Avatar, EmptyState, PageHeader, ResidentMeta, StatusBadge } from '../components/Ui'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  AlertTriangle,
  ArrowRight,
  LayoutGrid,
  List,
  Loader2,
  Package,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const T = iso(new Date())

function grau(r: ReturnType<typeof useIlpiData>['residentes'][0]) {
  const a = ultAval(r, 'fugulin')
  if (!a) return 0
  const t = totalEsc('fugulin', a.resp)
  return SCALES.fugulin.classif(t).grau ?? 0
}

export default function Residentes() {
  const { profissional } = useAuth()
  const data = useIlpiData()
  const { residentes } = data
  const navigate = useNavigate()

  const [busca, setBusca] = useState('')
  const [filtroGrau, setFiltroGrau] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Modal Novo Residente
  const [modalNovo, setModalNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoQuarto, setNovoQuarto] = useState('')
  const [novoSexo, setNovoSexo] = useState<'M' | 'F' | 'Outro'>('F')
  const [novoNasc, setNovoNasc] = useState('')
  const [novoAdmissao, setNovoAdmissao] = useState(T)
  const [novoConvenio, setNovoConvenio] = useState('Particular')
  const [novoAlergias, setNovoAlergias] = useState('')
  const [novoDoencas, setNovoDoencas] = useState('')
  const [novoOutras, setNovoOutras] = useState('')
  const [novoRespNome, setNovoRespNome] = useState('')
  const [novoRespParentesco, setNovoRespParentesco] = useState('')
  const [novoRespTel, setNovoRespTel] = useState('')
  const [novoGosta, setNovoGosta] = useState('')
  const [novoComida, setNovoComida] = useState('')

  async function handleSalvarNovo(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) {
      toast.error('Informe o nome do residente.')
      return
    }
    if (!novoQuarto.trim()) {
      toast.error('Informe o quarto do residente.')
      return
    }

    setSalvando(true)
    const novoId = 'r_' + Math.random().toString(36).substring(2, 9)
    const doencasArr = novoDoencas
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      id: novoId,
      nome: novoNome.trim(),
      sexo: novoSexo,
      nasc: novoNasc || null,
      quarto: novoQuarto.trim(),
      admissao: novoAdmissao || T,
      convenio: novoConvenio.trim() || 'Particular',
      alergias: novoAlergias.trim(),
      doencas: doencasArr,
      outras: novoOutras.trim(),
      cirurgias: '',
      status: 'ativo',
      entrada: 'Família',
      responsavel: {
        nome: novoRespNome.trim(),
        parentesco: novoRespParentesco.trim(),
        tel: novoRespTel.trim(),
      },
      docs: {
        rg: false,
        cpf: false,
        sus: false,
        vacina: false,
        contrato: false,
        funerario: false,
      },
      pref: {
        gosta: novoGosta.trim(),
        comida: novoComida.trim(),
      },
    }

    const { error } = await supabase.from('residentes').insert(payload)
    setSalvando(false)

    if (error) {
      toast.error('Erro ao cadastrar residente no Supabase: ' + error.message)
      return
    }

    toast.success('Residente acolhido com sucesso!')
    setModalNovo(false)
    setNovoNome('')
    setNovoQuarto('')
    setNovoNasc('')
    setNovoAlergias('')
    setNovoDoencas('')
    setNovoOutras('')
    setNovoRespNome('')
    setNovoRespParentesco('')
    setNovoRespTel('')
    setNovoGosta('')
    setNovoComida('')

    await data.refresh()
    navigate(`/residentes/${novoId}`)
  }

  const listaFiltrada = useMemo(() => {
    return [...residentes]
      .filter((r) => {
        if (busca.trim()) {
          const q = busca.toLowerCase()
          const matchNome = r.nome.toLowerCase().includes(q)
          const matchQuarto = String(r.quarto).toLowerCase().includes(q)
          if (!matchNome && !matchQuarto) return false
        }
        if (filtroGrau !== 'todos') {
          const g = grau(r)
          if (filtroGrau === 'g1' && g !== 1) return false
          if (filtroGrau === 'g2' && g !== 2) return false
          if (filtroGrau === 'g3' && g !== 3) return false
          if (filtroGrau === 'obito' && r.status !== 'obito') return false
          if (filtroGrau === 'ativos' && r.status === 'obito') return false
        }
        return true
      })
      .sort(
        (a, b) =>
          Number(a.status === 'obito') - Number(b.status === 'obito') ||
          String(a.quarto).localeCompare(String(b.quarto), 'pt', { numeric: true }),
      )
  }, [residentes, busca, filtroGrau])

  const totalAtivos = residentes.filter((r) => r.status !== 'obito').length
  const totalG23 = residentes.filter((r) => {
    const g = grau(r)
    return r.status !== 'obito' && (g === 2 || g === 3)
  }).length
  const totalComAlergia = residentes.filter((r) => r.status !== 'obito' && !!r.alergias).length

  if (!profissional) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Residentes"
        lede="Diretório de residentes, prontuários individualizados e acompanhamento por grau de dependência."
        badge={
          <Badge variant="secondary" className="font-semibold text-xs">
            {totalAtivos} acolhidos ativos
          </Badge>
        }
        actions={
          can(profissional.cat, 'gerir') && (
            <Button
              onClick={() => setModalNovo(true)}
              className="gap-2 rounded-xl text-xs font-semibold shadow-xs bg-[#123F4A] hover:bg-[#123F4A]/90 text-white"
            >
              <UserPlus className="size-4" />
              <span>Novo Residente</span>
            </Button>
          )
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Total de Ativos
              </span>
              <span className="text-xl font-bold text-foreground">{totalAtivos}</span>
            </div>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Graus 2 e 3 (RDC 502)
              </span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {totalG23}
              </span>
            </div>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <UserCheck className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Com Alergias
              </span>
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                {totalComAlergia}
              </span>
            </div>
            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Capacidade Instalada
              </span>
              <span className="text-xl font-bold text-foreground">{residentes.length}</span>
            </div>
            <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <Package className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou quarto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40">
            <Button
              size="xs"
              variant={filtroGrau === 'todos' ? 'default' : 'ghost'}
              onClick={() => setFiltroGrau('todos')}
              className="text-xs rounded-lg h-7 px-2.5"
            >
              Todos
            </Button>
            <Button
              size="xs"
              variant={filtroGrau === 'g1' ? 'default' : 'ghost'}
              onClick={() => setFiltroGrau('g1')}
              className="text-xs rounded-lg h-7 px-2.5"
            >
              Grau 1
            </Button>
            <Button
              size="xs"
              variant={filtroGrau === 'g2' ? 'default' : 'ghost'}
              onClick={() => setFiltroGrau('g2')}
              className="text-xs rounded-lg h-7 px-2.5"
            >
              Grau 2
            </Button>
            <Button
              size="xs"
              variant={filtroGrau === 'g3' ? 'default' : 'ghost'}
              onClick={() => setFiltroGrau('g3')}
              className="text-xs rounded-lg h-7 px-2.5"
            >
              Grau 3
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40 ml-auto sm:ml-0">
            <Button
              size="icon-xs"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              aria-label="Visualização em grade"
              className="size-7 rounded-lg"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
              aria-label="Visualização em lista"
              className="size-7 rounded-lg"
            >
              <List className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid or Table View */}
      {listaFiltrada.length === 0 ? (
        <EmptyState title="Nenhum residente encontrado">
          Tente ajustar os filtros ou o termo de busca para visualizar os prontuários.
        </EmptyState>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {listaFiltrada.map((r) => {
            const g = grau(r)
            const pend = can(profissional.cat, 'gerir') ? docsPend(r).length : 0
            const baixo = can(profissional.cat, 'estoque')
              ? r.estoque.filter((it) => nivelEst(consumoDia(r, it, T), it) !== 'ok').length
              : 0

            return (
              <Card
                key={r.id}
                onClick={() => navigate(`/residentes/${r.id}/pasta`)}
                className={cn(
                  'group flex flex-col justify-between p-4 rounded-2xl border border-border/70 hover:border-primary/50 hover:shadow-sm bg-card hover:bg-muted/15 transition-all duration-150 cursor-pointer text-left',
                  r.status === 'obito' && 'opacity-60 bg-muted/30'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar r={r} size="lg" className="ring-1 ring-border/50 group-hover:ring-primary/40 transition-all" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors font-heading">
                          {r.nome}
                        </h3>
                        <ResidentMeta r={r} />
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0">
                      Q.{r.quarto}
                    </Badge>
                  </div>

                  <Allergy alergias={r.alergias} />

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {g ? (
                      <StatusBadge tone={g === 1 ? 'ok' : g === 2 ? 'warn' : 'danger'}>
                        Fugulin: Grau {g}
                      </StatusBadge>
                    ) : null}
                    {pend > 0 && (
                      <StatusBadge tone="warn">
                        {pend} doc{pend > 1 ? 's' : ''} pend.
                      </StatusBadge>
                    )}
                    {baixo > 0 && <StatusBadge tone="danger">{baixo} estoque baixo</StatusBadge>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40 text-xs font-semibold text-primary">
                  <span>Acessar prontuário</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border border-border/70 shadow-xs overflow-hidden rounded-2xl">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs font-semibold">Residente</TableHead>
                <TableHead className="text-xs font-semibold">Quarto</TableHead>
                <TableHead className="text-xs font-semibold">Dependência</TableHead>
                <TableHead className="text-xs font-semibold">Alergias</TableHead>
                <TableHead className="text-xs font-semibold">Alertas / Estoque</TableHead>
                <TableHead className="text-xs font-semibold text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listaFiltrada.map((r) => {
                const g = grau(r)
                const pend = can(profissional.cat, 'gerir') ? docsPend(r).length : 0
                const baixo = can(profissional.cat, 'estoque')
                  ? r.estoque.filter((it) => nivelEst(consumoDia(r, it, T), it) !== 'ok').length
                  : 0

                return (
                  <TableRow
                    key={r.id}
                    onClick={() => navigate(`/residentes/${r.id}/pasta`)}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar r={r} size="sm" />
                        <div>
                          <span className="font-semibold text-foreground text-xs block">
                            {r.nome}
                          </span>
                          <ResidentMeta r={r} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">Quarto {r.quarto}</TableCell>
                    <TableCell>
                      {g ? (
                        <StatusBadge tone={g === 1 ? 'ok' : g === 2 ? 'warn' : 'danger'}>
                          Grau {g}
                        </StatusBadge>
                      ) : (
                        <span className="text-xs text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Allergy alergias={r.alergias} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {pend > 0 && <StatusBadge tone="warn">{pend} pendentes</StatusBadge>}
                        {baixo > 0 && <StatusBadge tone="danger">{baixo} em falta</StatusBadge>}
                        {pend === 0 && baixo === 0 && (
                          <span className="text-xs text-muted-foreground">Normal</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="xs" variant="ghost" className="text-primary font-semibold text-xs gap-1">
                        Prontuário <ArrowRight className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      {/* Modal de Cadastro de Novo Residente */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSalvarNovo}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="size-5 text-[#123F4A]" />
                Novo Acolhimento de Residente
              </DialogTitle>
              <DialogDescription className="text-xs">
                Preencha os dados cadastrais e clínicos iniciais do idoso para criação imediata do prontuário no Supabase.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Seção 1: Dados Pessoais */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                <span className="font-bold text-foreground text-xs block">1. Identificação Básica</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label htmlFor="nome" className="text-[11px] font-semibold text-muted-foreground">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Ex: Maria das Graças Silva"
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quarto" className="text-[11px] font-semibold text-muted-foreground">Quarto / Leito *</Label>
                    <Input
                      id="quarto"
                      value={novoQuarto}
                      onChange={(e) => setNovoQuarto(e.target.value)}
                      placeholder="Ex: 5 ou 12B"
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sexo" className="text-[11px] font-semibold text-muted-foreground">Sexo</Label>
                    <select
                      id="sexo"
                      value={novoSexo}
                      onChange={(e) => setNovoSexo(e.target.value as 'M' | 'F' | 'Outro')}
                      className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                    >
                      <option value="F">Feminino</option>
                      <option value="M">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nasc" className="text-[11px] font-semibold text-muted-foreground">Data de Nascimento</Label>
                    <Input
                      id="nasc"
                      type="date"
                      value={novoNasc}
                      onChange={(e) => setNovoNasc(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="admissao" className="text-[11px] font-semibold text-muted-foreground">Data de Admissão</Label>
                    <Input
                      id="admissao"
                      type="date"
                      value={novoAdmissao}
                      onChange={(e) => setNovoAdmissao(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="convenio" className="text-[11px] font-semibold text-muted-foreground">Convênio / Pagador</Label>
                    <Input
                      id="convenio"
                      value={novoConvenio}
                      onChange={(e) => setNovoConvenio(e.target.value)}
                      placeholder="Ex: Particular, SUS, Unimed..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="alergias" className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Alergias Conhecidas (se houver)</Label>
                    <Input
                      id="alergias"
                      value={novoAlergias}
                      onChange={(e) => setNovoAlergias(e.target.value)}
                      placeholder="Ex: Dipirona, Penicilina, Frutos do mar..."
                      className="h-8 text-xs border-rose-300 dark:border-rose-900"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Diagnósticos Clínicos */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                <span className="font-bold text-foreground text-xs block">2. Diagnósticos Clínicos & Comorbidades</span>
                <div className="space-y-1">
                  <Label htmlFor="doencas" className="text-[11px] font-semibold text-muted-foreground">
                    Doenças Crônicas (separadas por vírgula)
                  </Label>
                  <Input
                    id="doencas"
                    value={novoDoencas}
                    onChange={(e) => setNovoDoencas(e.target.value)}
                    placeholder="Ex: HAS, Diabetes Tipo 2, AVE, Osteoporose, Alzheimer..."
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="outras" className="text-[11px] font-semibold text-muted-foreground">
                    Outras condições relevantes ou histórico cirúrgico
                  </Label>
                  <Input
                    id="outras"
                    value={novoOutras}
                    onChange={(e) => setNovoOutras(e.target.value)}
                    placeholder="Ex: Glaucoma no olho esquerdo, artroplastia de quadril..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Seção 3: Responsável Familiar */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                <span className="font-bold text-foreground text-xs block">3. Responsável Familiar / Contato de Emergência</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="respNome" className="text-[11px] font-semibold text-muted-foreground">Nome do Responsável</Label>
                    <Input
                      id="respNome"
                      value={novoRespNome}
                      onChange={(e) => setNovoRespNome(e.target.value)}
                      placeholder="Ex: Carlos Eduardo Silva"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="respPar" className="text-[11px] font-semibold text-muted-foreground">Parentesco</Label>
                    <Input
                      id="respPar"
                      value={novoRespParentesco}
                      onChange={(e) => setNovoRespParentesco(e.target.value)}
                      placeholder="Ex: Filho(a), Sobrinho(a)..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="respTel" className="text-[11px] font-semibold text-muted-foreground">Telefone / WhatsApp</Label>
                    <Input
                      id="respTel"
                      value={novoRespTel}
                      onChange={(e) => setNovoRespTel(e.target.value)}
                      placeholder="Ex: (11) 98888-7777"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Hábitos e Afeto */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                <span className="font-bold text-foreground text-xs block">4. Hábitos e Humanização (Árvore do Vínculo)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prefGosta" className="text-[11px] font-semibold text-muted-foreground">Do que gosta / Atividades que aprecia</Label>
                    <Input
                      id="prefGosta"
                      value={novoGosta}
                      onChange={(e) => setNovoGosta(e.target.value)}
                      placeholder="Ex: Ouvir rádio, passear no jardim..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prefComida" className="text-[11px] font-semibold text-muted-foreground">Preferências Alimentares</Label>
                    <Input
                      id="prefComida"
                      value={novoComida}
                      onChange={(e) => setNovoComida(e.target.value)}
                      placeholder="Ex: Café com leite bem quente, frutas picadas..."
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNovo(false)}
                disabled={salvando}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="text-xs font-semibold gap-1.5 bg-[#123F4A] hover:bg-[#123F4A]/90 text-white"
              >
                {salvando ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Salvando no Supabase...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5" />
                    <span>Concluir Acolhimento</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
