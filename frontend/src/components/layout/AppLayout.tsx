import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1" style={{ overflow: 'hidden' }}>
        <TopBar />
        <main
          className="flex-grow-1 p-4"
          style={{ overflowY: 'auto', background: '#f8f9fa' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
