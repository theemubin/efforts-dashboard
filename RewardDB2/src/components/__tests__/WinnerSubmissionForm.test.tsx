import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WinnerSubmissionForm from '../WinnerSubmissionForm'
import axios from 'axios'

vi.mock('axios')
vi.mock('../../firebase', () => ({ db: {}, auth: {} }))

vi.mock('../../hooks/useUserProfile', () => ({
  useUserProfile: () => ({ profile: { displayName: 'Test User', house: 'TestHouse', campus: 'TestCampus' } })
}))

const mockAddDoc = vi.fn()
vi.mock('firebase/firestore', async () => {
  const original: any = await vi.importActual('firebase/firestore')
  return {
    ...original,
    addDoc: (...args: any[]) => mockAddDoc(...args)
  }
})

describe('WinnerSubmissionForm', () => {
  beforeEach(() => vi.resetAllMocks())

  it('uploads via Cloudinary and writes Firestore document', async () => {
    (axios.post as any).mockResolvedValue({ data: { secure_url: 'https://res.cloudinary/test2.png' } })
    render(<WinnerSubmissionForm />)

    // find file input
    const fileInputs = document.querySelectorAll('input[type=file]')
    expect(fileInputs.length).toBeGreaterThan(0)
    const input = fileInputs[0] as HTMLInputElement
    const file = new File(['x'], 'x.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file] })
    fireEvent.change(input)

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled()
      expect(mockAddDoc).toHaveBeenCalled()
    })
  })
})
