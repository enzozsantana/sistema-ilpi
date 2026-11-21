import jsPDF from 'jspdf'

export interface MiniCertificadoOptions {
  profissionalNome: string
  cpf?: string
  conselho?: string
  funcao?: string
  cursoTitulo: string
  cargaHoraria: string
  instituicaoNome: string
  concluidoEm: string
  notaObtida?: number
}

function normalizarNomeArquivo(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
}

export async function gerarMiniCertificado(options: MiniCertificadoOptions): Promise<void> {
  const {
    profissionalNome,
    cpf,
    conselho,
    funcao,
    cursoTitulo,
    cargaHoraria,
    instituicaoNome,
    concluidoEm,
    notaObtida,
  } = options

  // A5 Landscape (210mm x 148mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5',
  })

  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  // Background decoration & borders
  doc.setFillColor(250, 252, 251) // subtle warm mint tint
  doc.rect(0, 0, width, height, 'F')

  // Elegant double border
  doc.setDrawColor(32, 107, 102) // #206B66 teal
  doc.setLineWidth(1.2)
  doc.rect(7, 7, width - 14, height - 14)

  doc.setDrawColor(217, 105, 79) // #D9694F coral accent
  doc.setLineWidth(0.4)
  doc.rect(9, 9, width - 18, height - 18)

  // Header: Institution & ANVISA label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(32, 107, 102)
  doc.text(instituicaoNome.toUpperCase() || 'INSTITUIÇÃO DE LONGA PERMANÊNCIA PARA IDOSOS', width / 2, 18, {
    align: 'center',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(110, 110, 110)
  doc.text('PROGRAMA DE EDUCAÇÃO PERMANENTE E CAPACITAÇÃO CONTINUADA — RDC Nº 502/2021 ANVISA', width / 2, 22, {
    align: 'center',
  })

  // Title: CERTIFICADO DE CONCLUSÃO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(23, 43, 40)
  doc.text('CERTIFICADO DE CAPACITAÇÃO', width / 2, 34, { align: 'center' })

  // Decorative divider
  doc.setDrawColor(217, 105, 79)
  doc.setLineWidth(0.8)
  doc.line(width / 2 - 35, 37, width / 2 + 35, 37)

  // Body text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50, 50, 50)
  doc.text('Certificamos que o(a) colaborador(a)', width / 2, 47, { align: 'center' })

  // Employee Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(18, 63, 74)
  doc.text(profissionalNome, width / 2, 55, { align: 'center' })

  // Credentials info (CPF, Conselho, Cargo)
  const credenciais: string[] = []
  if (funcao) credenciais.push(`Função: ${funcao}`)
  if (cpf) credenciais.push(`CPF: ${cpf}`)
  if (conselho) credenciais.push(`Registro: ${conselho}`)

  if (credenciais.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(90, 90, 90)
    doc.text(credenciais.join('  •  '), width / 2, 61, { align: 'center' })
  }

  // Course completion text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50, 50, 50)
  doc.text(
    'concluiu com êxito o treinamento teórico e prático de educação permanente:',
    width / 2,
    71,
    { align: 'center' },
  )

  // Course Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(217, 105, 79) // Coral brand
  doc.text(`"${cursoTitulo}"`, width / 2, 80, { align: 'center' })

  // Course details (Duration, Date, Score)
  const dataFormatada = new Date(concluidoEm).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const detalhes = [
    `Carga Horária: ${cargaHoraria || '1 hora'}`,
    `Data de Conclusão: ${dataFormatada}`,
    typeof notaObtida === 'number' ? `Aproveitamento: ${notaObtida}%` : null,
  ]
    .filter(Boolean)
    .join('   |   ')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(70, 70, 70)
  doc.text(detalhes, width / 2, 88, { align: 'center' })

  // Signatures section
  const ySignatures = 120

  // Left: Responsible Technician
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(25, ySignatures, 85, ySignatures)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(40, 40, 40)
  doc.text('Responsável Técnico / Enfermagem', 55, ySignatures + 4, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(110, 110, 110)
  doc.text('Coordenação de Capacitação ILPI', 55, ySignatures + 7.5, { align: 'center' })

  // Right: Collaborator Signature
  doc.line(width - 85, ySignatures, width - 25, ySignatures)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(40, 40, 40)
  doc.text(profissionalNome, width - 55, ySignatures + 4, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(110, 110, 110)
  doc.text('Assinatura do(a) Colaborador(a)', width - 55, ySignatures + 7.5, { align: 'center' })

  // Footer note & validation token
  const codigoAutenticacao = Math.random().toString(36).substring(2, 10).toUpperCase()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(140, 140, 140)
  doc.text(
    `Documento emitido eletronicamente via Sistema Senecurare ILPI. Cód. de Autenticidade: ${codigoAutenticacao}`,
    width / 2,
    height - 11,
    { align: 'center' },
  )

  const filename = `certificado-${normalizarNomeArquivo(profissionalNome)}-${normalizarNomeArquivo(cursoTitulo)}.pdf`
  doc.save(filename)
}
