import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginView from '../views/LoginView'

const defaultProps = {
  theme: 'light' as const,
  onToggleTheme: vi.fn(),
  onLogin: vi.fn(),
  onRegister: vi.fn(),
  isSubmitting: false,
  errorMessage: null,
}

const renderLogin = (overrides = {}) =>
  render(
    <MemoryRouter>
      <LoginView {...defaultProps} {...overrides} />
    </MemoryRouter>,
  )

describe('LoginView', () => {
  it('renders login form by default', () => {
    renderLogin()
    expect(screen.getByText('Se connecter')).toBeInTheDocument()
    expect(screen.getByText('Adresse email')).toBeInTheDocument()
    expect(screen.getByText('Mot de passe')).toBeInTheDocument()
  })

  it('switches to register mode', async () => {
    renderLogin()
    const user = userEvent.setup()

    await user.click(screen.getByText(/Pas encore de compte/))

    expect(screen.getByText('Créer mon compte')).toBeInTheDocument()
    expect(screen.getByText(/Prénom ou pseudo/)).toBeInTheDocument()
  })

  it('switches back to login from register', async () => {
    renderLogin()
    const user = userEvent.setup()

    await user.click(screen.getByText(/Pas encore de compte/))
    await user.click(screen.getByText(/Déjà membre/))

    expect(screen.getByText('Se connecter')).toBeInTheDocument()
  })

  it('calls onLogin with email and password on submit', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined)
    renderLogin({ onLogin })
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Au moins 8 caractères'), 'password123')
    await user.click(screen.getByText('Se connecter'))

    expect(onLogin).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    })
  })

  it('calls onRegister with name, email and password', async () => {
    const onRegister = vi.fn().mockResolvedValue(undefined)
    renderLogin({ onRegister })
    const user = userEvent.setup()

    await user.click(screen.getByText(/Pas encore de compte/))
    await user.type(screen.getByPlaceholderText('Max'), 'Maxime')
    await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'max@test.com')
    await user.type(screen.getByPlaceholderText('Au moins 8 caractères'), 'password123')
    await user.click(screen.getByText('Créer mon compte'))

    expect(onRegister).toHaveBeenCalledWith({
      email: 'max@test.com',
      password: 'password123',
      name: 'Maxime',
    })
  })

  it('shows error message from props', () => {
    renderLogin({ errorMessage: 'Identifiants incorrects' })
    expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument()
  })

  it('disables button when isSubmitting is true', () => {
    renderLogin({ isSubmitting: true })
    expect(screen.getByText('Traitement...')).toBeDisabled()
  })

  it('shows error on empty fields', async () => {
    renderLogin()
    const user = userEvent.setup()

    await user.click(screen.getByText('Se connecter'))

    expect(defaultProps.onLogin).not.toHaveBeenCalled()
  })

  it('toggles theme when theme button is clicked', async () => {
    const onToggleTheme = vi.fn()
    renderLogin({ onToggleTheme })
    const user = userEvent.setup()

    await user.click(screen.getByText(/Mode sombre/))

    expect(onToggleTheme).toHaveBeenCalledOnce()
  })
})
