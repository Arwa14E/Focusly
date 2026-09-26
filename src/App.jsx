import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock3,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Settings as SettingsIcon,
  Sun,
  TrendingUp,
  Trash2,
} from 'lucide-react'

import Sidebar from './components/Sidebar'
import { productivityData } from './data/dashboardData'

const BURGUNDY = '#6B2638'
const MUTED = '#756D70'

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getTodayKey = () => formatDateKey(new Date())

const formatPlannerDate = (dateString) => {
  const date = new Date(`${dateString}T12:00:00`)

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatShortDate = (dateString) => {
  const date = new Date(`${dateString}T12:00:00`)

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const sortTasksByTime = (taskList) => {
  return [...taskList].sort((a, b) => {
    const timeA = a.time || '23:59'
    const timeB = b.time || '23:59'

    return timeA.localeCompare(timeB)
  })
}

const mapTaskFromDatabase = (task) => ({
  ...task,
  date: task.task_date,
})

function App() {
  const initialDate = getTodayKey()
  const todayKey = getTodayKey()

  const [activeSection, setActiveSection] = useState('dashboard')

  // Supabase tasks
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [taskError, setTaskError] = useState('')

  // Filters
  const [taskFilter, setTaskFilter] = useState('All')

  // Add task
  const [newTask, setNewTask] = useState('')
  const [newPriority, setNewPriority] = useState('Medium')
  const [newTime, setNewTime] = useState('09:00')
  const [newTaskDate, setNewTaskDate] = useState(initialDate)

  // Edit task
  const [editingTask, setEditingTask] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState('Medium')
  const [editTime, setEditTime] = useState('09:00')
  const [editDate, setEditDate] = useState(initialDate)

  // Planner
  const [plannerDate, setPlannerDate] = useState(initialDate)

  // Settings
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Load tasks from Supabase
  useEffect(() => {
    const loadTasks = async () => {
      setLoadingTasks(true)
      setTaskError('')

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading tasks:', error)
        setTaskError('Unable to load tasks.')
        setLoadingTasks(false)
        return
      }

      setTasks(data.map(mapTaskFromDatabase))
      setLoadingTasks(false)
    }

    loadTasks()
  }, [])

  // Stats
  const completedCount = tasks.filter(
    (task) => task.completed
  ).length

  const activeCount = tasks.filter(
    (task) => !task.completed
  ).length

  const totalTasks = tasks.length

  const completionRate =
    totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100)
      : 0

      const weeklyCompletionData = Array.from(
  { length: 7 },
  (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))

    const dateKey = formatDateKey(date)

    const completed = tasks.filter(
      (task) =>
        task.task_date === dateKey &&
        task.completed
    ).length

    return {
      day: date.toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      tasks: completed,
    }
  }
)

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'Active') {
      return tasks.filter((task) => !task.completed)
    }

    if (taskFilter === 'Completed') {
      return tasks.filter((task) => task.completed)
    }

    return tasks
  }, [tasks, taskFilter])

  // Planner tasks
  const plannerTasks = useMemo(() => {
    return sortTasksByTime(
      tasks.filter((task) => task.date === plannerDate)
    )
  }, [tasks, plannerDate])

  const plannerCompleted = plannerTasks.filter(
    (task) => task.completed
  ).length

  const plannerActive = plannerTasks.filter(
    (task) => !task.completed
  ).length

  // Analytics
  const highPriorityCount = tasks.filter(
    (task) => task.priority === 'High'
  ).length

  const mediumPriorityCount = tasks.filter(
    (task) => task.priority === 'Medium'
  ).length

  const lowPriorityCount = tasks.filter(
    (task) => task.priority === 'Low'
  ).length

  const analyticsPriorityData = [
    { priority: 'High', tasks: highPriorityCount },
    { priority: 'Medium', tasks: mediumPriorityCount },
    { priority: 'Low', tasks: lowPriorityCount },
  ]

  const analyticsCompletionData = [
    { name: 'Completed', value: completedCount },
    { name: 'Active', value: activeCount },
  ]

  // Navigation
  const handleNavigate = (section) => {
    setActiveSection(section)
  }

  // Toggle task
  const toggleTask = async (id) => {
    const task = tasks.find((item) => item.id === id)

    if (!task) return

    setTaskError('')

    const newCompleted = !task.completed

    const { error } = await supabase
      .from('tasks')
      .update({
        completed: newCompleted,
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating task:', error)
      setTaskError('Unable to update task.')
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: newCompleted,
            }
          : item
      )
    )
  }

  // Delete task
  const deleteTask = async (id) => {
    setTaskError('')

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      setTaskError('Unable to delete task.')
      return
    }

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id)
    )

    if (editingTask === id) {
      cancelEdit()
    }
  }

  // Add task
  const addTask = async (event) => {
    event.preventDefault()

    if (!newTask.trim()) return

    setTaskError('')

    const taskToInsert = {
      title: newTask.trim(),
      time: newTime,
      priority: newPriority,
      completed: false,
      task_date: newTaskDate,
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select()
      .single()

    if (error) {
      console.error('Error adding task:', error)
      setTaskError('Unable to add task.')
      return
    }

    setTasks((currentTasks) => [
      ...currentTasks,
      mapTaskFromDatabase(data),
    ])

    setNewTask('')
    setNewPriority('Medium')
    setNewTime('09:00')

    setNewTaskDate(
      activeSection === 'planner'
        ? plannerDate
        : todayKey
    )
  }

  // Start editing
  const startEditing = (task) => {
    setEditingTask(task.id)
    setEditTitle(task.title)
    setEditPriority(task.priority)
    setEditTime(task.time || '09:00')
    setEditDate(task.date || todayKey)
  }

  // Save edit
  const saveEdit = async (id) => {
    if (!editTitle.trim()) return

    setTaskError('')

    const updates = {
      title: editTitle.trim(),
      priority: editPriority,
      time: editTime,
      task_date: editDate,
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      setTaskError('Unable to save task changes.')
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? mapTaskFromDatabase(data)
          : task
      )
    )

    cancelEdit()
  }

  // Cancel edit
  const cancelEdit = () => {
    setEditingTask(null)
    setEditTitle('')
    setEditPriority('Medium')
    setEditTime('09:00')
    setEditDate(todayKey)
  }

  // Planner date
  const changePlannerDate = (amount) => {
    const date = new Date(`${plannerDate}T12:00:00`)

    date.setDate(date.getDate() + amount)

    setPlannerDate(formatDateKey(date))
  }

  const goToToday = () => {
    setPlannerDate(todayKey)
  }

  const openAddTaskFromPlanner = () => {
    setNewTaskDate(plannerDate)
    setNewTask('')
    setNewPriority('Medium')
    setNewTime('09:00')

    setActiveSection('tasks')
  }

  // Reset all tasks
  const resetAllTasks = async () => {
    const confirmed = window.confirm(
      'Reset all tasks? This will permanently remove your current tasks.'
    )

    if (!confirmed) return

    setTaskError('')

    const { error } = await supabase
      .from('tasks')
      .delete()
      .not('id', 'is', null)

    if (error) {
      console.error('Error resetting tasks:', error)
      setTaskError('Unable to reset tasks.')
      return
    }

    setTasks([])
    setEditingTask(null)
  }

  // Save settings
  const saveSettings = () => {
    setSettingsSaved(true)

    setTimeout(() => {
      setSettingsSaved(false)
    }, 2500)
  }

  // Priority badge
  const renderPriorityBadge = (priority) => {
    const styles = {
      High: 'bg-[#F3E1E5] text-[#6B2638]',
      Medium: 'bg-[#EEE9E6] text-[#756D70]',
      Low: 'bg-[#E9EDE9] text-[#526357]',
    }

    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          styles[priority] || styles.Medium
        }`}
      >
        {priority}
      </span>
    )
  }

  // Task row
  const renderTaskRow = (task, options = {}) => {
    const showDate = options.showDate ?? false
    const isEditing = editingTask === task.id

    if (isEditing) {
      return (
        <div
          key={task.id}
          className="rounded-2xl border border-[#D9D5D2] bg-white p-4"
        >
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={editTitle}
              onChange={(event) =>
                setEditTitle(event.target.value)
              }
              className="rounded-xl border border-[#D9D5D2] bg-[#FCFAF8] px-3 py-2 text-sm outline-none focus:border-[#6B2638]"
              placeholder="Task title"
            />

            <select
              value={editPriority}
              onChange={(event) =>
                setEditPriority(event.target.value)
              }
              className="rounded-xl border border-[#D9D5D2] bg-[#FCFAF8] px-3 py-2 text-sm outline-none focus:border-[#6B2638]"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <input
              type="time"
              value={editTime}
              onChange={(event) =>
                setEditTime(event.target.value)
              }
              className="rounded-xl border border-[#D9D5D2] bg-[#FCFAF8] px-3 py-2 text-sm outline-none focus:border-[#6B2638]"
            />

            <input
              type="date"
              value={editDate}
              onChange={(event) =>
                setEditDate(event.target.value)
              }
              className="rounded-xl border border-[#D9D5D2] bg-[#FCFAF8] px-3 py-2 text-sm outline-none focus:border-[#6B2638]"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => saveEdit(task.id)}
              className="rounded-xl bg-[#6B2638] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4A1D2A]"
            >
              Save
            </button>

            <button
              onClick={cancelEdit}
              className="rounded-xl border border-[#D9D5D2] px-4 py-2 text-sm font-medium text-[#756D70] transition hover:bg-[#F8F5F2]"
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }

    return (
      <div
        key={task.id}
        className="group flex items-center gap-4 border-b border-[#EEE9E6] py-4 last:border-b-0"
      >
        <button
          onClick={() => toggleTask(task.id)}
          className="shrink-0"
          aria-label="Toggle task"
        >
          {task.completed ? (
            <CheckCircle2
              size={22}
              className="text-[#6B2638]"
            />
          ) : (
            <Circle
              size={22}
              className="text-[#B7B0AD] transition group-hover:text-[#6B2638]"
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-medium ${
              task.completed
                ? 'text-[#A39B9D] line-through'
                : 'text-[#292326]'
            }`}
          >
            {task.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#756D70]">
            <span className="flex items-center gap-1">
              <Clock3 size={13} />
              {task.time || '--:--'}
            </span>

            {showDate && task.date && (
              <span>{formatShortDate(task.date)}</span>
            )}
          </div>
        </div>

        {renderPriorityBadge(task.priority)}

        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => startEditing(task)}
            className="rounded-lg p-2 text-[#756D70] hover:bg-[#F3EFEC] hover:text-[#6B2638]"
            title="Edit"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={() => deleteTask(task.id)}
            className="rounded-lg p-2 text-[#756D70] hover:bg-[#F3EFEC] hover:text-[#6B2638]"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Dashboard
  const renderDashboard = () => {
    const todayTasks = sortTasksByTime(
      tasks.filter((task) => task.date === todayKey)
    )

    const todayActiveTasks = todayTasks.filter(
      (task) => !task.completed
    ).length

    return (
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-sm text-[#756D70]">
              Monday, September 28, 2026
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-[#292326]">
              Good morning, Arwa
            </h2>

            <p className="mt-2 text-sm text-[#756D70]">
              Stay focused and make today count.
            </p>
          </div>

          <button
            onClick={() => setActiveSection('tasks')}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#6B2638] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#4A1D2A]"
          >
            <Plus size={18} />
            Add task
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">Total tasks</p>

            <p className="mt-2 text-3xl font-semibold text-[#292326]">
              {totalTasks}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">Completed</p>

            <p className="mt-2 text-3xl font-semibold text-[#6B2638]">
              {completedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">Focus time</p>

            <p className="mt-2 text-3xl font-semibold text-[#292326]">
              14h
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              Productivity
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#6B2638]">
              {completionRate}%
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-[#292326]">
                Weekly focus
              </h3>

              <p className="mt-1 text-sm text-[#756D70]">
                Your focus hours over the last week.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={weeklyCompletionData}>
                  <defs>
                    <linearGradient
                      id="focusGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={BURGUNDY}
                        stopOpacity={0.22}
                      />

                      <stop
                        offset="100%"
                        stopColor={BURGUNDY}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#EEE9E6"
                  />

                  <XAxis
                    dataKey="day"
                    tick={{
                      fill: MUTED,
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: MUTED,
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke={BURGUNDY}
                    strokeWidth={2}
                    fill="url(#focusGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#292326]">
                  Today&apos;s tasks
                </h3>

                <p className="mt-1 text-sm text-[#756D70]">
                  {todayActiveTasks} active tasks
                </p>
              </div>

              <button
                onClick={() => setActiveSection('tasks')}
                className="text-sm font-medium text-[#6B2638] hover:underline"
              >
                View all
              </button>
            </div>

            <div>
              {loadingTasks ? (
                <p className="py-8 text-center text-sm text-[#756D70]">
                  Loading tasks...
                </p>
              ) : todayTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckSquare
                    size={32}
                    className="mx-auto text-[#B7B0AD]"
                  />

                  <p className="mt-3 text-sm font-medium text-[#292326]">
                    No tasks for today
                  </p>

                  <p className="mt-1 text-xs text-[#756D70]">
                    Add your first task to get started.
                  </p>
                </div>
              ) : (
                todayTasks.map((task) =>
                  renderTaskRow(task)
                )
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tasks page
  const renderTasks = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#292326]">
            Tasks
          </h2>

          <p className="mt-2 text-sm text-[#756D70]">
            Organize your tasks and stay on top of your priorities.
          </p>
        </div>

        {taskError && (
          <div className="rounded-xl border border-[#E8C9CF] bg-[#FDF3F5] px-4 py-3 text-sm text-[#6B2638]">
            {taskError}
          </div>
        )}

        <form
          onSubmit={addTask}
          className="rounded-2xl border border-[#D9D5D2] bg-white p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <Plus size={18} className="text-[#6B2638]" />

            <h3 className="font-semibold text-[#292326]">
              Add new task
            </h3>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <input
              value={newTask}
              onChange={(event) =>
                setNewTask(event.target.value)
              }
              placeholder="What needs to be done?"
              className="rounded-xl border border-[#D9D5D2] bg-[#FCFAF8] px-4 py-3 text-sm outline-none focus:border-[#6B2638] md:col-span-2"
            />

            <select
              value={newPriority}
              onChange={(event) =>
                setNewPriority(event.target.value)
              }
              className="rounded-xl border border-[#D9D5D2] bg-[#FCFAF8] px-4 py-3 text-sm outline-none focus:border-[#6B2638]"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <input
              type="time"
              value={newTime}
              onChange={(event) =>
                setNewTime(event.target.value)
              }
              className="rounded-xl border border-[#D9D5D2] bg-[#FCFAF8] px-4 py-3 text-sm outline-none focus:border-[#6B2638]"
            />

            <input
              type="date"
              value={newTaskDate}
              onChange={(event) =>
                setNewTaskDate(event.target.value)
              }
              className="rounded-xl border border-[#D9D5D2] bg-[#FCFAF8] px-4 py-3 text-sm outline-none focus:border-[#6B2638]"
            />
          </div>

          <button
            type="submit"
            disabled={loadingTasks}
            className="mt-4 flex items-center gap-2 rounded-xl bg-[#6B2638] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4A1D2A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={17} />
            Add task
          </button>
        </form>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              All tasks
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {totalTasks}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              Active
            </p>

            <p className="mt-2 text-2xl font-semibold text-[#6B2638]">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              Completed
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {completedCount}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9D5D2] bg-white p-6">
          <div className="mb-5 flex flex-wrap gap-2">
            {['All', 'Active', 'Completed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTaskFilter(filter)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  taskFilter === filter
                    ? 'bg-[#6B2638] text-white'
                    : 'bg-[#F3EFEC] text-[#756D70] hover:text-[#4A1D2A]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div>
            {loadingTasks ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#D9D5D2] border-t-[#6B2638]" />

                <p className="mt-4 text-sm text-[#756D70]">
                  Loading tasks...
                </p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-12 text-center">
                <CheckSquare
                  size={34}
                  className="mx-auto text-[#B7B0AD]"
                />

                <p className="mt-3 text-sm font-medium text-[#292326]">
                  No tasks here
                </p>

                <p className="mt-1 text-sm text-[#756D70]">
                  Add a task to get started.
                </p>
              </div>
            ) : (
              sortTasksByTime(filteredTasks).map((task) =>
                renderTaskRow(task, {
                  showDate: true,
                })
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  // Planner
  const renderPlanner = () => {
    return (
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1 text-sm text-[#756D70]">
              Planner
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-[#292326]">
              Plan your day
            </h2>

            <p className="mt-2 text-sm text-[#756D70]">
              Keep your tasks organized by day and time.
            </p>
          </div>

          <button
            onClick={openAddTaskFromPlanner}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#6B2638] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4A1D2A]"
          >
            <Plus size={18} />
            Add task
          </button>
        </div>

        {taskError && (
          <div className="rounded-xl border border-[#E8C9CF] bg-[#FDF3F5] px-4 py-3 text-sm text-[#6B2638]">
            {taskError}
          </div>
        )}

        <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button
              onClick={() => changePlannerDate(-1)}
              className="rounded-xl border border-[#D9D5D2] px-4 py-2 text-sm font-medium text-[#756D70] transition hover:bg-[#F8F5F2]"
            >
              ← Previous
            </button>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-[#6B2638]">
                <CalendarDays size={19} />

                <span className="text-sm font-medium">
                  {formatPlannerDate(plannerDate)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={goToToday}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    plannerDate === todayKey
                      ? 'bg-[#6B2638] text-white'
                      : 'bg-[#F3EFEC] text-[#756D70]'
                  }`}
                >
                  Today
                </button>

                <input
                  type="date"
                  value={plannerDate}
                  onChange={(event) =>
                    setPlannerDate(event.target.value)
                  }
                  className="rounded-lg border border-[#D9D5D2] bg-[#FCFAF8] px-2 py-1 text-xs outline-none focus:border-[#6B2638]"
                />
              </div>
            </div>

            <button
              onClick={() => changePlannerDate(1)}
              className="rounded-xl border border-[#D9D5D2] px-4 py-2 text-sm font-medium text-[#756D70] transition hover:bg-[#F8F5F2]"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              Tasks
            </p>

            <p className="mt-2 text-2xl font-semibold text-[#292326]">
              {plannerTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              Completed
            </p>

            <p className="mt-2 text-2xl font-semibold text-[#6B2638]">
              {plannerCompleted}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              Remaining
            </p>

            <p className="mt-2 text-2xl font-semibold text-[#292326]">
              {plannerActive}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9D5D2] bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#292326]">
                Schedule
              </h3>

              <p className="mt-1 text-sm text-[#756D70]">
                Tasks sorted by time.
              </p>
            </div>

            {plannerDate === todayKey && (
              <span className="rounded-full bg-[#F3E1E5] px-3 py-1 text-xs font-medium text-[#6B2638]">
                Today
              </span>
            )}
          </div>

          {loadingTasks ? (
            <div className="py-14 text-center">
              <p className="text-sm text-[#756D70]">
                Loading tasks...
              </p>
            </div>
          ) : plannerTasks.length === 0 ? (
            <div className="py-14 text-center">
              <CalendarDays
                size={38}
                className="mx-auto text-[#B7B0AD]"
              />

              <p className="mt-4 font-medium text-[#292326]">
                No tasks planned
              </p>

              <p className="mt-1 text-sm text-[#756D70]">
                Add a task for this day to build your schedule.
              </p>

              <button
                onClick={openAddTaskFromPlanner}
                className="mt-5 rounded-xl bg-[#6B2638] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4A1D2A]"
              >
                Add task
              </button>
            </div>
          ) : (
            <div>
              {plannerTasks.map((task) =>
                renderTaskRow(task)
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Analytics
  const renderAnalytics = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#292326]">
            Analytics
          </h2>

          <p className="mt-2 text-sm text-[#756D70]">
            Understand your productivity and task progress.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#756D70]">
                Completion rate
              </p>

              <TrendingUp
                size={18}
                className="text-[#6B2638]"
              />
            </div>

            <p className="mt-3 text-3xl font-semibold text-[#6B2638]">
              {completionRate}%
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              Total tasks
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#292326]">
              {totalTasks}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              Completed
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#292326]">
              {completedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-5">
            <p className="text-sm text-[#756D70]">
              High priority
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#6B2638]">
              {highPriorityCount}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-[#292326]">
                Tasks by priority
              </h3>

              <p className="mt-1 text-sm text-[#756D70]">
                Distribution of your current tasks.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={analyticsPriorityData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#EEE9E6"
                  />

                  <XAxis
                    dataKey="priority"
                    tick={{
                      fill: MUTED,
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: MUTED,
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="tasks"
                    fill={BURGUNDY}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D9D5D2] bg-white p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-[#292326]">
                Tasks Completed
              </h3>

              <p className="mt-1 text-sm text-[#756D70]">
                Completed tasks over the last 7 days
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={analyticsCompletionData}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#EEE9E6"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{
                      fill: MUTED,
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{
                      fill: MUTED,
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    fill={BURGUNDY}
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9D5D2] bg-white p-6">
          <div className="mb-5">
            <h3 className="font-semibold text-[#292326]">
              Productivity summary
            </h3>

            <p className="mt-1 text-sm text-[#756D70]">
              A quick overview of your current workspace.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-[#F8F5F2] p-4">
              <p className="text-xs text-[#756D70]">
                High priority
              </p>

              <p className="mt-2 text-xl font-semibold text-[#6B2638]">
                {highPriorityCount}
              </p>
            </div>

            <div className="rounded-xl bg-[#F8F5F2] p-4">
              <p className="text-xs text-[#756D70]">
                Medium priority
              </p>

              <p className="mt-2 text-xl font-semibold text-[#292326]">
                {mediumPriorityCount}
              </p>
            </div>

            <div className="rounded-xl bg-[#F8F5F2] p-4">
              <p className="text-xs text-[#756D70]">
                Low priority
              </p>

              <p className="mt-2 text-xl font-semibold text-[#292326]">
                {lowPriorityCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Settings
  const renderSettings = () => {
    return (
      <div className="max-w-3xl space-y-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#292326]">
            Settings
          </h2>

          <p className="mt-2 text-sm text-[#756D70]">
            Manage your Focusly workspace preferences.
          </p>
        </div>

        <div className="rounded-2xl border border-[#D9D5D2] bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#F3E1E5] p-3 text-[#6B2638]">
              <SettingsIcon size={20} />
            </div>

            <div>
              <h3 className="font-semibold text-[#292326]">
                Preferences
              </h3>

              <p className="mt-1 text-sm text-[#756D70]">
                Customize how Focusly behaves for you.
              </p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-[#EEE9E6]">
            <div className="flex items-center justify-between gap-4 py-5">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon
                    size={19}
                    className="text-[#6B2638]"
                  />
                ) : (
                  <Sun
                    size={19}
                    className="text-[#6B2638]"
                  />
                )}

                <div>
                  <p className="text-sm font-medium text-[#292326]">
                    Appearance
                  </p>

                  <p className="mt-1 text-xs text-[#756D70]">
                    {darkMode
                      ? 'Dark mode is selected.'
                      : 'Light mode is selected.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative h-6 w-11 rounded-full transition ${
                  darkMode
                    ? 'bg-[#6B2638]'
                    : 'bg-[#D9D5D2]'
                }`}
                aria-label="Toggle appearance"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    darkMode ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-5">
              <div className="flex items-center gap-3">
                <Clock3
                  size={19}
                  className="text-[#6B2638]"
                />

                <div>
                  <p className="text-sm font-medium text-[#292326]">
                    Notifications
                  </p>

                  <p className="mt-1 text-xs text-[#756D70]">
                    Receive productivity reminders.
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setNotifications(!notifications)
                }
                className={`relative h-6 w-11 rounded-full transition ${
                  notifications
                    ? 'bg-[#6B2638]'
                    : 'bg-[#D9D5D2]'
                }`}
                aria-label="Toggle notifications"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    notifications ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9D5D2] bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#F3EFEC] p-3 text-[#6B2638]">
              <RotateCcw size={20} />
            </div>

            <div>
              <h3 className="font-semibold text-[#292326]">
                Workspace data
              </h3>

              <p className="mt-1 text-sm text-[#756D70]">
                Reset your current task data.
              </p>
            </div>
          </div>

          {taskError && (
            <div className="mt-5 rounded-xl border border-[#E8C9CF] bg-[#FDF3F5] px-4 py-3 text-sm text-[#6B2638]">
              {taskError}
            </div>
          )}

          <button
            onClick={resetAllTasks}
            className="mt-5 flex items-center gap-2 rounded-xl border border-[#D9D5D2] px-4 py-2.5 text-sm font-medium text-[#6B2638] transition hover:bg-[#F8F5F2]"
          >
            <RotateCcw size={16} />
            Reset all tasks
          </button>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[#D9D5D2] bg-white p-5">
          <div>
            <p className="text-sm font-medium text-[#292326]">
              Save preferences
            </p>

            <p className="mt-1 text-xs text-[#756D70]">
              Your preferences are currently saved for this
              session.
            </p>
          </div>

          <button
            onClick={saveSettings}
            className="rounded-xl bg-[#6B2638] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#4A1D2A]"
          >
            Save
          </button>
        </div>

        {settingsSaved && (
          <div className="flex items-center gap-2 rounded-xl bg-[#E9EDE9] px-4 py-3 text-sm text-[#526357]">
            <Check size={17} />
            Preferences saved successfully.
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    if (activeSection === 'tasks') {
      return renderTasks()
    }

    if (activeSection === 'planner') {
      return renderPlanner()
    }

    if (activeSection === 'analytics') {
      return renderAnalytics()
    }

    if (activeSection === 'settings') {
      return renderSettings()
    }

    return renderDashboard()
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? 'bg-[#211E20]'
          : 'bg-[#F8F5F2]'
      }`}
    >
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      <main className="ml-64 min-h-screen">
        <div className="mx-auto max-w-[1500px] px-8 py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default App