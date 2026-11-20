import { type AnexoDocumento, formatarTamanhoArquivo, baixarDocumento, abrirDocumento } from '../lib/documentosStorage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Download, ExternalLink, FileText, Image as ImageIcon, ShieldCheck } from 'lucide-react'

interface VisualizadorDocumentoModalProps {
  anexo: AnexoDocumento | null
  tituloDocumento?: string
  aberto: boolean
  onClose: () => void
}

export function VisualizadorDocumentoModal({
  anexo,
  tituloDocumento,
  aberto,
  onClose,
}: VisualizadorDocumentoModalProps) {
  if (!anexo) return null

  const isPdf = anexo.tipoMime === 'application/pdf' || anexo.nomeArquivo.toLowerCase().endsWith('.pdf')
  const isImage = anexo.tipoMime.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(anexo.nomeArquivo)

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 sm:px-6 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isImage ? (
                  <ImageIcon className="size-4 text-sky-600" />
                ) : (
                  <FileText className="size-4 text-teal-600" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Comprovante Digital Oficial · Vigilância Sanitária
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground mt-0.5 truncate">
                {tituloDocumento || anexo.nomeArquivo}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>Arquivo: <strong>{anexo.nomeArquivo}</strong></span>
                <span>•</span>
                <span>{formatarTamanhoArquivo(anexo.tamanho)}</span>
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 text-xs">
                <ShieldCheck className="size-3 mr-1" /> Documento Autêntico
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 flex-1 overflow-y-auto bg-muted/10 min-h-[50vh] max-h-[70vh] flex flex-col items-center justify-center">
          {isImage && (
            <div className="w-full flex justify-center items-center py-2">
              <img
                src={anexo.url}
                alt={anexo.nomeArquivo}
                className="max-h-[62vh] max-w-full rounded-xl object-contain shadow-md border border-border/60"
              />
            </div>
          )}

          {isPdf && (
            <div className="w-full h-[62vh] flex flex-col rounded-xl overflow-hidden border border-border/60 bg-white">
              <iframe
                src={anexo.url}
                title={anexo.nomeArquivo}
                className="w-full h-full border-none"
              />
            </div>
          )}

          {!isImage && !isPdf && (
            <div className="text-center p-8 space-y-3">
              <FileText className="size-16 text-teal-600 mx-auto opacity-80" />
              <div>
                <p className="font-semibold text-foreground text-sm">{anexo.nomeArquivo}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Arquivo do tipo ({anexo.tipoMime || 'documento'}). Utilize as ações abaixo para abrir ou baixar.
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => baixarDocumento(anexo)}
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
              >
                <Download className="size-4" /> Baixar Documento
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-3 sm:px-6 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => abrirDocumento(anexo)}
              className="gap-1.5 text-xs rounded-xl"
              title="Abrir em tela cheia / nova aba"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Abrir em Nova Aba</span>
              <span className="sm:hidden">Abrir</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => baixarDocumento(anexo)}
              className="gap-1.5 text-xs rounded-xl"
              title="Baixar arquivo original"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Baixar Arquivo</span>
              <span className="sm:hidden">Baixar</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
