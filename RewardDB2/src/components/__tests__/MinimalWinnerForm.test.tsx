import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MinimalWinnerForm from '../MinimalWinnerForm'
import axios from 'axios'
import * as firestore from '../../firebase'

vi.mock('axios')
vi.mock('../../firebase', () => ({ db: {}, auth: {} }))

// Mock useUserProfile to avoid depending on firebase auth in tests
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

describe('MinimalWinnerForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('uploads image to Cloudinary and calls addDoc', async () => {
    // mock axios post
    (axios.post as any).mockResolvedValue({ data: { secure_url: 'https://res.cloudinary/test.png' } })

    render(<MinimalWinnerForm />)

    // Fill in testimonial
    const heading = screen.getByLabelText(/Headline/i) || screen.getByRole('textbox', { name: /Headline/i })
    // MinimalWinnerForm labels are not using aria-label for heading, but we can find by placeholder via DOM queries
    const submitBtn = screen.getByRole('button', { name: /submit/i })

    // Simulate file input change: create a fake file
    const file = new File(['hello'], 'hello.png', { type: 'image/png' })
    const fileInput = screen.getByLabelText(/Photo/i) || screen.getByTestId('file-input')
    // Workaround: find input[type=file]
    const fileInputs = document.querySelectorAll('input[type=file]')
    expect(fileInputs.length).toBeGreaterThan(0)
    const input = fileInputs[0] as HTMLInputElement
    // fire change
    Object.defineProperty(input, 'files', { value: [file] })
    fireEvent.change(input)

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled()
      expect(mockAddDoc).toHaveBeenCalled()
    })
  })
})
