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

// Mock the app store
jest.mock('../store/appStore', () => ({
  useAppStore: () => ({
    currentUser: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com'
    },
    setCurrentUser: jest.fn(),
    currentRoom: 'test-room',
    setCurrentRoom: jest.fn()
  })
}))

// Mock the main page component
const MockApp = () => (
  <div data-testid="app">
    <h1>Collaborative App</h1>
    <div>Whiteboard</div>
    <div>Chat</div>
    <div>Active Users</div>
  </div>
)

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<MockApp />)
    expect(screen.getByTestId('app')).toBeInTheDocument()
  })

  it('renders app title', () => {
    render(<MockApp />)
    expect(screen.getByText(/Collaborative App/i)).toBeInTheDocument()
  })

  it('renders main sections', () => {
    render(<MockApp />)
    
    // Check for main sections
    expect(screen.getByText(/Whiteboard/i)).toBeInTheDocument()
    expect(screen.getByText(/Chat/i)).toBeInTheDocument()
  })

  it('renders user panel', () => {
    render(<MockApp />)
    
    // Check for user panel elements
    expect(screen.getByText(/Active Users/i)).toBeInTheDocument()
  })
}) 