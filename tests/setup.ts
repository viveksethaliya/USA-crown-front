import { vi } from 'vitest'

// Mock adminFetch and NextJS navigation
vi.mock('@/lib/api', () => ({
  adminFetch: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

// Mock lucide-react icons so they don't cause issues
vi.mock('lucide-react', () => ({
  UsersRound: () => null,
  Layout: () => null,
  Shield: () => null,
  Tag: () => null,
  Calendar: () => null,
  Activity: () => null,
  Eye: () => null,
  FileText: () => null,
  Plus: () => null,
  ChevronRight: () => null,
  Search: () => null,
  Trash2: () => null,
  Save: () => null,
  X: () => null,
  Edit2: () => null,
  Copy: () => null,
  PauseCircle: () => null,
  Archive: () => null,
  AlertCircle: () => null,
  PlayCircle: () => null,
  Loader2: () => null,
  ShoppingCart: () => null,
  ArrowRight: () => null
}))

// Setup window/localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {}
  return {
    getItem: function(key: string) { return store[key] || null },
    setItem: function(key: string, value: string) { store[key] = value.toString() },
    clear: function() { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
window.prompt = vi.fn()
window.confirm = vi.fn()
