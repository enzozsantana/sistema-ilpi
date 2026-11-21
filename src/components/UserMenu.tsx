import { useNavigate } from 'react-router-dom'
import { CATS } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import type { Profissional } from '../types/ilpi'
import { Avatar } from './Ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ChevronDown, Download, CheckCircle2, LogOut, ShieldCheck, User } from 'lucide-react'
import { usePwaInstall } from '../hooks/usePwaInstall'

export function UserMenu({ profissional }: { profissional: Profissional }) {
  const { signOut, session } = useAuth()
  const navigate = useNavigate()
  const { canInstall, isInstalled, promptInstall } = usePwaInstall()

  async function onSair() {
    await signOut()
    navigate('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2.5 p-1.5 pr-2.5 rounded-full hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border/40 transition-all text-left">
        <Avatar r={profissional} size="sm" />
        <div className="hidden md:flex flex-col text-left leading-tight">
          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            {profissional.nome}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {CATS[profissional.cat]}
          </span>
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-md rounded-xl" sideOffset={8}>
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">{profissional.nome}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user.email || 'Profissional ativo'}
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-primary">
              <ShieldCheck className="size-3" />
              <span>{CATS[profissional.cat]} · {profissional.funcao || 'Plantão'}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2 text-xs py-2 cursor-pointer rounded-lg"
          onClick={() => navigate('/perfil')}
        >
          <User className="size-4 text-muted-foreground" />
          <span>Meu perfil</span>
        </DropdownMenuItem>

        {canInstall && (
          <DropdownMenuItem
            className="gap-2 text-xs py-2 cursor-pointer text-primary focus:text-primary font-medium rounded-lg"
            onClick={() => void promptInstall()}
          >
            <Download className="size-4 text-primary" />
            <span>Instalar Senecurare (App)</span>
          </DropdownMenuItem>
        )}

        {isInstalled && (
          <div className="px-2 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>App Senecurare instalado</span>
          </div>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2 text-xs py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg"
          onClick={() => void onSair()}
        >
          <LogOut className="size-4 text-destructive" />
          <span>Sair da conta</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
