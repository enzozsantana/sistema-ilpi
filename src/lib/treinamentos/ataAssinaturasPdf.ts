import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AtribuicaoTreinamento } from '../../types/treinamentos'

export interface AtaAssinaturasOptions {
  instituicaoNome: string
  cursoTitulo?: string
  atribuicoes: AtribuicaoTreinamento[]
  filtroStatus?: string
}

export async function gerarAtaAssinaturasAnvisa(options: AtaAssinaturasOptions): Promise<void> {
  const { instituicaoNome, cursoTitulo, atribuicoes, filtroStatus } = options

  // A4 Landscape format (297 x 210 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const width = doc.internal.pageSize.getWidth()

  // Header Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(18, 63, 74) // #123F4A
  doc.text('ATA DE TREINAMENTO E CAPACITAÇÃO CONTINUADA', 14, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(70, 70, 70)
  doc.text('Conformidade Sanitária — Resolução RDC nº 502/2021 ANVISA', 14, 20)

  // Institution & Meta info box
  doc.setFontSize(8.5)
  doc.setTextColor(30, 30, 30)
  doc.text(`Instituição: ${instituicaoNome || 'Instituição de Longa Permanência para Idosos'}`, 14, 27)

  if (cursoTitulo) {
    doc.text(`Treinamento: ${cursoTitulo}`, 14, 32)
  }

  const agora = new Date().toLocaleString('pt-BR')
  doc.text(`Data de Emissão: ${agora}`, width - 14, 27, { align: 'right' })
  if (filtroStatus) {
    doc.text(`Filtro Aplicado: ${filtroStatus}`, width - 14, 32, { align: 'right' })
  }

  const startY = cursoTitulo ? 37 : 33

  // Table rows
  const tableData = atribuicoes.map((item, index) => {
    const dataConclusao = item.concluidoEm
      ? new Date(item.concluidoEm).toLocaleDateString('pt-BR')
      : '-'
    const nota = typeof item.notaObtida === 'number' ? `${item.notaObtida}%` : '-'
    const statusTxt =
      item.status === 'concluido'
        ? 'Concluído'
        : item.status === 'atrasado'
          ? 'Atrasado'
          : 'Pendente'

    return [
      String(index + 1),
      item.profissionalNome,
      item.profissionalCat ? item.profissionalCat.toUpperCase() : '-',
      item.profissionalCpf || '-',
      item.cursoTitulo,
      statusTxt,
      dataConclusao,
      nota,
      '', // Blank column for manual pen signature!
    ]
  })

  autoTable(doc, {
    startY,
    head: [
      [
        '#',
        'Colaborador(a)',
        'Função',
        'CPF / Reg.',
        'Tema da Capacitação',
        'Status',
        'Conclusão',
        'Nota',
        'Assinatura do Profissional',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [32, 107, 102], // #206B66
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 20 },
      3: { cellWidth: 26 },
      4: { cellWidth: 55 },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 56 }, // Space for physical signature
    },
    alternateRowStyles: {
      fillColor: [248, 250, 249],
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.text(
        `Documento comprobatório para fiscalização sanitária. Página ${data.pageNumber} de ${pageCount}`,
        14,
        doc.internal.pageSize.getHeight() - 8,
      )
    },
  })

  // Signatures of Technical Management at bottom of last page
  const finalY = (doc as any).lastAutoTable?.finalY ?? startY + 50
  const pageHeight = doc.internal.pageSize.getHeight()

  let sigY = finalY + 18
  if (sigY + 20 > pageHeight) {
    doc.addPage()
    sigY = 25
  }

  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.4)
  doc.line(14, sigY, 90, sigY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(40, 40, 40)
  doc.text('Responsável Técnico(a) (RT / Enfermagem)', 14, sigY + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text('Assinatura e Carimbo Profissional', 14, sigY + 7.5)

  doc.line(width - 90, sigY, width - 14, sigY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(40, 40, 40)
  doc.text('Diretoria / Gestão Administrativa', width - 90, sigY + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text('Visto de Conformidade RDC 502/2021', width - 90, sigY + 7.5)

  const hoje = new Date().toISOString().slice(0, 10)
  doc.save(`ata-treinamento-anvisa-${hoje}.pdf`)
}
