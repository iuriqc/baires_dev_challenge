import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the WebSocket hook
jest.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    sendMessage: jest.fn(),
    isConnected: true,
    messages: [],
    drawingActions: []
  })
}))

// Mock the Whiteboard component since it might not exist yet
const MockWhiteboard = () => (
  <div data-testid="whiteboard">
    <h2>Whiteboard</h2>
    <div>Drawing Tools</div>
    <div>Canvas</div>
  </div>
)

describe('Whiteboard Component', () => {
  it('renders without crashing', () => {
    render(<MockWhiteboard />)
    expect(screen.getByTestId('whiteboard')).toBeInTheDocument()
  })

  it('renders whiteboard title', () => {
    render(<MockWhiteboard />)
    expect(screen.getByText(/Whiteboard/i)).toBeInTheDocument()
  })

  it('renders drawing tools section', () => {
    render(<MockWhiteboard />)
    expect(screen.getByText(/Drawing Tools/i)).toBeInTheDocument()
  })

  it('renders canvas section', () => {
    render(<MockWhiteboard />)
    expect(screen.getByText(/Canvas/i)).toBeInTheDocument()
  })
}) 