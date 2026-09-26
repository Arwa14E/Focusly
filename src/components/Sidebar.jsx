import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Settings,
} from 'lucide-react'

function Sidebar({ activeSection, onNavigate }) {
  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, target: 'dashboard' },
    { label: 'Tasks', icon: CheckSquare, target: 'tasks' },
    { label: 'Planner', icon: CalendarDays, target: 'planner' },
    { label: 'Analytics', icon: BarChart3, target: 'analytics' },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#D9D5D2] bg-[#FCFAF8]">

      <div className="flex h-20 items-center border-b border-[#D9D5D2] px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#4A1D2A]">
            Focusly
          </h1>

          <p className="text-xs text-[#756D70]">
            Productivity workspace
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.target

          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.target)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-[#6B2638] text-white shadow-sm'
                  : 'text-[#756D70] hover:bg-[#EEE9E6] hover:text-[#4A1D2A]'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-[#D9D5D2] p-4">
        <button
          onClick={() => onNavigate('settings')}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            activeSection === 'settings'
              ? 'bg-[#6B2638] text-white'
              : 'text-[#756D70] hover:bg-[#EEE9E6] hover:text-[#4A1D2A]'
          }`}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>

    </aside>
  )
}

export default Sidebar