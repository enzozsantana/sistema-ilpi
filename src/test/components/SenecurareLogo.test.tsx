import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SenecurareLogo } from '../../components/SenecurareLogo'

describe('SenecurareLogo Component', () => {
  it('renderiza a variante horizontal com o nome da marca', () => {
    render(<SenecurareLogo variant="horizontal" />)
    expect(screen.getByText('Sene')).toBeInTheDocument()
    expect(screen.getByText('curare')).toBeInTheDocument()
    expect(screen.getByAltText(/Senecurare/)).toBeInTheDocument()
  })

  it('exibe o slogan oficial quando showTagline é true', () => {
    render(<SenecurareLogo variant="horizontal" showTagline={true} />)
    expect(
      screen.getByText('Raízes de cuidado, laços de vida.')
    ).toBeInTheDocument()
  })

  it('renderiza a variante icon sem o texto por extenso', () => {
    render(<SenecurareLogo variant="icon" />)
    expect(screen.getByAltText(/Senecurare/)).toBeInTheDocument()
    expect(screen.queryByText('Sene')).not.toBeInTheDocument()
  })

  it('renderiza a variante full centralizada com o slogan quando solicitado', () => {
    render(<SenecurareLogo variant="full" showTagline={true} />)
    expect(screen.getByText('Sene')).toBeInTheDocument()
    expect(screen.getByText('curare')).toBeInTheDocument()
    expect(
      screen.getByText('Raízes de cuidado, laços de vida.')
    ).toBeInTheDocument()
  })
})
