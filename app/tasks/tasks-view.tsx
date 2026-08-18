'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { syncPush, syncPull } from './supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Subtask {
  id: string
  title: string
  hasBlocker: boolean
  blocker: string
  comments: string
  status?: 'To Do' | 'In Progress' | 'On Hold' | 'Done'
  completed?: boolean
}

interface Task {
  id: string
  title: string
  priority: 'High' | 'Medium' | 'Low' | 'Backlog'
  order: number
  hasBlocker: boolean
  blocker: string
  comments: string
  status?: 'To Do' | 'In Progress' | 'On Hold' | 'Done'
  completed?: boolean
  subtasks?: Subtask[]
}



export type StatusItemStatus = 'Pending' | 'In Progress' | 'Blocked' | 'Done'

export interface StatusItem {
  id: string
  title: string
  status: StatusItemStatus
  priority: Priority
  comments: string
  completed: boolean
  order: number
}

type Priority = Task['priority']
type TaskStatus = NonNullable<Task['status']>

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low', 'Backlog']
const TASK_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'On Hold', 'Done']


const STATUS_ITEM_STATUSES: StatusItemStatus[] = ['Pending', 'In Progress', 'Blocked', 'Done']



const STATUS_ITEM_COLORS: Record<StatusItemStatus, { bg: string; fg: string; border: string }> = {
  Pending: { bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1' },
  'In Progress': { bg: '#e0f2fe', fg: '#0369a1', border: '#bae6fd' },
  Blocked: { bg: '#ffedd5', fg: '#c2410c', border: '#fed7aa' },
  Done: { bg: '#dcfce7', fg: '#15803d', border: '#bbf7d0' },
}

const PRIORITY_COLORS: Record<Priority, string> = {
  High: 'var(--priority-high)',
  Medium: 'var(--priority-medium)',
  Low: 'var(--priority-low)',
  Backlog: 'var(--priority-backlog)',
}

const STATUS_COLORS: Record<TaskStatus, { bg: string; fg: string; border: string }> = {
  'To Do': { bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1' },
  'In Progress': { bg: '#e0f2fe', fg: '#0369a1', border: '#bae6fd' },
  'On Hold': { bg: '#fef3c7', fg: '#b45309', border: '#fde68a' },
  Done: { bg: '#dcfce7', fg: '#15803d', border: '#bbf7d0' },
}



const STORAGE_KEY = 'alphacrash-tasks'

const STORAGE_KEY_STATUS = 'alphacrash-status'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapPriority(p: unknown): Priority {
  if (p === 'P0' || p === 'P1' || p === 'High') return 'High'
  if (p === 'P2' || p === 'Medium' || p === 'Normal') return 'Medium'
  if (p === 'P3' || p === 'Low' || p === 'Default') return 'Low'
  if (p === 'Backlog') return 'Backlog'
  return 'Low'
}

function mapStatus(status: unknown, completed?: boolean): TaskStatus {
  if (completed || status === 'Done') return 'Done'
  if (status === 'In Progress') return 'In Progress'
  if (status === 'On Hold' || status === 'Paused') return 'On Hold'
  if (status === 'To Do' || status === 'Yet to start') return 'To Do'
  return 'To Do'
}

function getAllUsedIds(tasks: Task[], statusItems: StatusItem[] = []): Set<string> {
  const set = new Set<string>()
  for (const t of tasks) {
    if (t.id) set.add(t.id)
    if (Array.isArray(t.subtasks)) {
      for (const st of t.subtasks) {
        if (st.id) set.add(st.id)
      }
    }
  }
  for (const si of statusItems) {
    if (si.id) set.add(si.id)
  }
  return set
}

function generateId(existingTasks: Task[] = [], existingStatus: StatusItem[] = []): string {
  const usedIds = getAllUsedIds(existingTasks, existingStatus)
  let id = ''
  do {
    id = Math.floor(1000 + Math.random() * 9000).toString()
  } while (usedIds.has(id))
  return id
}

function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const usedIds = new Set<string>()

    const getUniqueId = (id?: string) => {
      let result = id
      if (!result || !/^\d{4}$/.test(result) || usedIds.has(result)) {
        do {
          result = Math.floor(1000 + Math.random() * 9000).toString()
        } while (usedIds.has(result))
      }
      usedIds.add(result)
      return result
    }

    return (parsed as Task[]).map((t) => {
      const id = getUniqueId(t.id)
      const completed = Boolean(t.completed || t.status === 'Done')
      const status = mapStatus(t.status, completed)
      const subtasks = Array.isArray(t.subtasks)
        ? t.subtasks.map((st) => {
          const stCompleted = Boolean(st.completed || st.status === 'Done')
          return {
            ...st,
            id: getUniqueId(st.id),
            status: mapStatus(st.status, stCompleted),
            completed: stCompleted,
            hasBlocker: Boolean(st.hasBlocker),
            blocker: st.blocker ?? '',
            comments: st.comments ?? '',
          }
        })
        : []

      return {
        ...t,
        id,
        priority: mapPriority(t.priority),
        status,
        completed,
        subtasks,
      }
    })
  } catch {
    return []
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}



function loadStatusItems(): StatusItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATUS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as StatusItem[]).map((si, idx) => ({
      id: si.id ?? Math.floor(1000 + Math.random() * 9000).toString(),
      title: String(si.title ?? '').trim(),
      status: (STATUS_ITEM_STATUSES.includes(si.status) ? si.status : 'Pending') as StatusItemStatus,
      priority: mapPriority(si.priority ?? 'Low'),
      comments: String(si.comments ?? '').trim(),
      completed: Boolean(si.completed || si.status === 'Done'),
      order: typeof si.order === 'number' ? si.order : idx + 1,
    }))
  } catch {
    return []
  }
}

function saveStatusItems(items: StatusItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(items))
}

function sortStatusItems(items: StatusItem[]): StatusItem[] {
  return [...items].sort((a, b) => {
    if (!!a.completed !== !!b.completed) return a.completed ? 1 : -1
    const pA = a.priority || 'Low'
    const pB = b.priority || 'Low'
    const diff = PRIORITIES.indexOf(pA) - PRIORITIES.indexOf(pB)
    if (diff !== 0) return diff
    return a.order - b.order
  })
}

function normalizeStatusOrders(items: StatusItem[]): StatusItem[] {
  const active = items.filter((si) => !si.completed)
  const completed = items.filter((si) => si.completed)

  const normalizeGroup = (groupItems: StatusItem[]) => {
    const groups: Record<Priority, StatusItem[]> = { High: [], Medium: [], Low: [], Backlog: [] }
    for (const si of groupItems) {
      const p = si.priority || 'Low'
      groups[p].push(si)
    }
    const result: StatusItem[] = []
    for (const p of PRIORITIES) {
      const sorted = groups[p].sort((a, b) => a.order - b.order)
      sorted.forEach((si, i) => {
        result.push({ ...si, priority: p, order: i + 1 })
      })
    }
    return result
  }

  return [...normalizeGroup(active), ...normalizeGroup(completed)]
}



/** Normalize orders within each priority group so they are sequential 1,2,3… */
function normalizeOrders(tasks: Task[]): Task[] {
  const active = tasks.filter((t) => !t.completed)
  const completed = tasks.filter((t) => t.completed)

  const normalizeGroup = (groupTasks: Task[]) => {
    const groups: Record<Priority, Task[]> = { High: [], Medium: [], Low: [], Backlog: [] }
    for (const t of groupTasks) {
      const p = mapPriority(t.priority)
      groups[p].push(t)
    }
    const result: Task[] = []
    for (const p of PRIORITIES) {
      const sorted = groups[p].sort((a, b) => a.order - b.order)
      sorted.forEach((t, i) => {
        result.push({ ...t, priority: p, order: i + 1 })
      })
    }
    return result
  }

  return [...normalizeGroup(active), ...normalizeGroup(completed)]
}

/** Sort tasks by priority then order */
function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!!a.completed !== !!b.completed) {
      return a.completed ? 1 : -1
    }
    const pi = PRIORITIES.indexOf(mapPriority(a.priority)) - PRIORITIES.indexOf(mapPriority(b.priority))
    if (pi !== 0) return pi
    return a.order - b.order
  })
}

function isValidTask(t: unknown): t is Task {
  if (typeof t !== 'object' || t === null) return false
  const obj = t as Record<string, unknown>
  const validP = PRIORITIES.includes(obj.priority as Priority) || ['P0', 'P1', 'P2', 'P3'].includes(obj.priority as string)
  const validS = typeof obj.status === 'undefined' || TASK_STATUSES.includes(obj.status as TaskStatus) || ['Paused', 'Yet to start'].includes(obj.status as string)
  const validSub = typeof obj.subtasks === 'undefined' || Array.isArray(obj.subtasks)
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    validP &&
    validS &&
    validSub &&
    typeof obj.order === 'number' &&
    typeof obj.hasBlocker === 'boolean' &&
    typeof obj.blocker === 'string' &&
    typeof obj.comments === 'string' &&
    (typeof obj.completed === 'undefined' || typeof obj.completed === 'boolean')
  )
}

type DeleteTarget =
  | { type: 'task'; id: string; title: string }
  | { type: 'subtask'; taskId: string; subtaskId: string; title: string }
  | { type: 'status'; id: string; title: string }

// ---------------------------------------------------------------------------
// Reusable Component
// ---------------------------------------------------------------------------

export default function TasksView({
  showJsonOptions = false,
}: {
  showJsonOptions?: boolean
}) {
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'tasks' | 'status'>('tasks')

  // Tasks & Status state
  const [tasks, setTasks] = useState<Task[]>([])
  const [statusItems, setStatusItems] = useState<StatusItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // Edit modals state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  // Subtask expand state
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set())

  // Sync state
  const [syncModal, setSyncModal] = useState<'push' | 'pull' | null>(null)
  const [syncPassword, setSyncPassword] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Subtask UI state
  const [addingSubtaskId, setAddingSubtaskId] = useState<string | null>(null)
  const [editingSubtask, setEditingSubtask] = useState<{ taskId: string; subtask: Subtask } | null>(null)

  // Task Form state
  const [formTitle, setFormTitle] = useState('')
  const [formPriority, setFormPriority] = useState<Priority>('Low')
  const [formStatus, setFormStatus] = useState<TaskStatus>('To Do')
  const [formBlocker, setFormBlocker] = useState(false)
  const [formBlockerText, setFormBlockerText] = useState('')
  const [formComments, setFormComments] = useState('')



  // Status Form state
  const [statusFormTitle, setStatusFormTitle] = useState('')
  const [statusFormStatus, setStatusFormStatus] = useState<StatusItemStatus>('Pending')
  const [statusFormPriority, setStatusFormPriority] = useState<Priority>('Low')
  const [statusFormComments, setStatusFormComments] = useState('')
  const [showAddStatusModal, setShowAddStatusModal] = useState(false)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const loadedTasks = loadTasks()
    const loadedStatus = loadStatusItems()
    setTasks(normalizeOrders(loadedTasks))
    setStatusItems(loadedStatus)
    setLoaded(true)
  }, [])

  // Persist whenever tasks or PRs change
  const persist = useCallback((updated: Task[]) => {
    const normalized = normalizeOrders(updated)
    setTasks(normalized)
    saveTasks(normalized)
  }, [])



  const persistStatusItems = useCallback((updated: StatusItem[]) => {
    setStatusItems(updated)
    saveStatusItems(updated)
  }, [])

  // ------ Add Task ------
  function handleAdd() {
    if (!formTitle.trim()) return
    const sameP = tasks.filter((t) => !t.completed && t.priority === formPriority)
    const maxOrder = sameP.length > 0 ? Math.max(...sameP.map((t) => t.order)) : 0
    const isDone = formStatus === 'Done'
    const newTask: Task = {
      id: generateId(tasks),
      title: formTitle.trim(),
      priority: formPriority,
      order: maxOrder + 1,
      hasBlocker: formBlocker,
      blocker: formBlocker ? formBlockerText.trim() : '',
      comments: formComments.trim(),
      status: formStatus,
      completed: isDone,
    }
    persist([...tasks, newTask])
    resetForm()
    setShowAddForm(false)
  }

  // ------ Edit Task ------
  function startEdit(task: Task) {
    setEditingId(task.id)
    setFormTitle(task.title)
    setFormPriority(task.priority)
    setFormStatus(task.status ?? (task.completed ? 'Done' : 'To Do'))
    setFormBlocker(task.hasBlocker)
    setFormBlockerText(task.blocker)
    setFormComments(task.comments)
  }

  function handleSaveEdit() {
    if (!editingId || !formTitle.trim()) return
    const original = tasks.find((t) => t.id === editingId)
    if (!original) return

    const priorityChanged = original.priority !== formPriority
    const isDone = formStatus === 'Done'

    let updatedTasks: Task[]
    if (priorityChanged) {
      // When changing priority, put at the end of the new priority group
      const newGroupSize = tasks.filter(
        (t) => !t.completed && t.priority === formPriority && t.id !== editingId
      ).length
      updatedTasks = tasks.map((t) =>
        t.id === editingId
          ? {
            ...t,
            title: formTitle.trim(),
            priority: formPriority,
            order: newGroupSize + 1,
            hasBlocker: formBlocker,
            blocker: formBlocker ? formBlockerText.trim() : '',
            comments: formComments.trim(),
            status: formStatus,
            completed: isDone,
          }
          : t
      )
    } else {
      updatedTasks = tasks.map((t) =>
        t.id === editingId
          ? {
            ...t,
            title: formTitle.trim(),
            hasBlocker: formBlocker,
            blocker: formBlocker ? formBlockerText.trim() : '',
            comments: formComments.trim(),
            status: formStatus,
            completed: isDone,
          }
          : t
      )
    }
    persist(updatedTasks)
    setEditingId(null)
    resetForm()
  }

  function cancelEdit() {
    setEditingId(null)
    resetForm()
  }

  // ------ Toggle Complete ------
  function toggleComplete(id: string) {
    const updatedTasks = tasks.map((t) => {
      if (t.id !== id) return t
      const isNowCompleted = !t.completed
      return {
        ...t,
        completed: isNowCompleted,
        status: isNowCompleted ? ('Done' as TaskStatus) : ('To Do' as TaskStatus),
      }
    })
    persist(updatedTasks)
  }

  // ------ Change Status Directly ------
  function updateStatus(id: string, status: TaskStatus) {
    const isDone = status === 'Done'
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, status, completed: isDone } : t
    )
    persist(updatedTasks)
  }

  // ------ Delete Task ------
  function handleDelete(id: string) {
    persist(tasks.filter((t) => t.id !== id))
    if (editingId === id) {
      setEditingId(null)
      resetForm()
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'task') {
      handleDelete(deleteTarget.id)
    } else if (deleteTarget.type === 'subtask') {
      handleDeleteSubtask(deleteTarget.taskId, deleteTarget.subtaskId)
    } else if (deleteTarget.type === 'status') {
      handleStatusDelete(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  // ------ Status Item Handlers ------
  function moveStatusItem(id: string, direction: 'up' | 'down') {
    const active = sortStatusItems(statusItems.filter((si) => !si.completed))
    const idx = active.findIndex((si) => si.id === id)
    if (idx === -1) return

    const newActive = [...active]
    if (direction === 'up' && idx > 0) {
      ;[newActive[idx - 1], newActive[idx]] = [newActive[idx], newActive[idx - 1]]
    } else if (direction === 'down' && idx < newActive.length - 1) {
      ;[newActive[idx], newActive[idx + 1]] = [newActive[idx + 1], newActive[idx]]
    } else {
      return
    }

    const completed = sortStatusItems(statusItems.filter((si) => si.completed))
    const reorderedActive = newActive.map((si, i) => ({ ...si, order: i + 1 }))
    const reorderedCompleted = completed.map((si, i) => ({ ...si, order: reorderedActive.length + i + 1 }))
    persistStatusItems(normalizeStatusOrders([...reorderedActive, ...reorderedCompleted]))
  }

  function resetStatusForm() {
    setStatusFormTitle('')
    setStatusFormStatus('Pending')
    setStatusFormPriority('Low')
    setStatusFormComments('')
  }

  function handleAddStatus() {
    if (!statusFormTitle.trim()) return
    const isDone = statusFormStatus === 'Done'
    const newItem: StatusItem = {
      id: generateId(tasks, statusItems),
      title: statusFormTitle.trim(),
      status: statusFormStatus,
      priority: statusFormPriority,
      comments: statusFormComments.trim(),
      completed: isDone,
      order: statusItems.length + 1,
    }
    persistStatusItems(normalizeStatusOrders([...statusItems, newItem]))
    resetStatusForm()
    setShowAddStatusModal(false)
  }

  function startEditStatus(item: StatusItem) {
    setEditingStatusId(item.id)
    setStatusFormTitle(item.title)
    setStatusFormStatus(item.status)
    setStatusFormPriority(item.priority || 'Low')
    setStatusFormComments(item.comments)
  }

  function handleSaveEditStatus() {
    if (!editingStatusId || !statusFormTitle.trim()) return
    const isDone = statusFormStatus === 'Done'
    const updated = statusItems.map((si) =>
      si.id === editingStatusId
        ? {
            ...si,
            title: statusFormTitle.trim(),
            status: statusFormStatus,
            priority: statusFormPriority,
            comments: statusFormComments.trim(),
            completed: isDone,
          }
        : si
    )
    persistStatusItems(normalizeStatusOrders(updated))
    setEditingStatusId(null)
    resetStatusForm()
  }

  function cancelStatusEdit() {
    setEditingStatusId(null)
    resetStatusForm()
  }

  function updateStatusItemStatus(id: string, status: StatusItemStatus) {
    const isDone = status === 'Done'
    const updated = statusItems.map((si) =>
      si.id === id ? { ...si, status, completed: isDone } : si
    )
    persistStatusItems(normalizeStatusOrders(updated))
  }

  function toggleStatusComplete(id: string) {
    const updated = statusItems.map((si) => {
      if (si.id !== id) return si
      const isNowDone = !si.completed
      return {
        ...si,
        completed: isNowDone,
        status: isNowDone ? ('Done' as StatusItemStatus) : ('Pending' as StatusItemStatus),
      }
    })
    persistStatusItems(normalizeStatusOrders(updated))
  }

  function handleStatusDelete(id: string) {
    persistStatusItems(statusItems.filter((si) => si.id !== id))
    if (editingStatusId === id) {
      setEditingStatusId(null)
      resetStatusForm()
    }
  }

  // ------ Subtask Expand Toggle ------
  function toggleSubtaskExpand(id: string) {
    setExpandedSubtasks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ------ Subtask Handlers ------
  function handleAddSubtask(
    taskId: string,
    data: { title: string; hasBlocker: boolean; blocker: string; comments: string; status: TaskStatus }
  ) {
    const isDone = data.status === 'Done'
    const newSubtask: Subtask = {
      id: generateId(tasks),
      title: data.title.trim(),
      hasBlocker: data.hasBlocker,
      blocker: data.hasBlocker ? data.blocker.trim() : '',
      comments: data.comments.trim(),
      status: data.status,
      completed: isDone,
    }

    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t
      const list = t.subtasks ?? []
      return { ...t, subtasks: [...list, newSubtask] }
    })
    persist(updated)
    setAddingSubtaskId(null)
  }

  function handleSaveSubtaskEdit(
    taskId: string,
    subtaskId: string,
    data: { title: string; hasBlocker: boolean; blocker: string; comments: string; status: TaskStatus }
  ) {
    const isDone = data.status === 'Done'
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t
      const list = (t.subtasks ?? []).map((st) =>
        st.id === subtaskId
          ? {
            ...st,
            title: data.title.trim(),
            hasBlocker: data.hasBlocker,
            blocker: data.hasBlocker ? data.blocker.trim() : '',
            comments: data.comments.trim(),
            status: data.status,
            completed: isDone,
          }
          : st
      )
      return { ...t, subtasks: list }
    })
    persist(updated)
    setEditingSubtask(null)
  }

  function handleToggleSubtaskComplete(taskId: string, subtaskId: string) {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t
      const list = (t.subtasks ?? []).map((st) => {
        if (st.id !== subtaskId) return st
        const isNowDone = !st.completed
        return {
          ...st,
          completed: isNowDone,
          status: isNowDone ? ('Done' as TaskStatus) : ('To Do' as TaskStatus),
        }
      })
      return { ...t, subtasks: list }
    })
    persist(updated)
  }

  function handleUpdateSubtaskStatus(taskId: string, subtaskId: string, status: TaskStatus) {
    const isDone = status === 'Done'
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t
      const list = (t.subtasks ?? []).map((st) =>
        st.id === subtaskId ? { ...st, status, completed: isDone } : st
      )
      return { ...t, subtasks: list }
    })
    persist(updated)
  }

  function handleDeleteSubtask(taskId: string, subtaskId: string) {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t
      return { ...t, subtasks: (t.subtasks ?? []).filter((st) => st.id !== subtaskId) }
    })
    persist(updated)
  }

  // ------ Move Up / Down ------
  function moveTask(id: string, direction: 'up' | 'down') {
    const activeTasks = sortTasks(tasks.filter((t) => !t.completed))
    const idx = activeTasks.findIndex((t) => t.id === id)
    if (idx === -1) return

    const current = activeTasks[idx]

    if (direction === 'up') {
      if (idx === 0) return // already at top
      const above = activeTasks[idx - 1]
      if (above.priority === current.priority) {
        // Swap within same priority
        const updatedTasks = tasks.map((t) => {
          if (t.id === current.id) return { ...t, order: above.order }
          if (t.id === above.id) return { ...t, order: current.order }
          return t
        })
        persist(updatedTasks)
      } else {
        // Move into the priority above, at the end
        const newPriority = above.priority as Priority
        const newGroupSize = activeTasks.filter(
          (t) => t.priority === newPriority && t.id !== current.id
        ).length
        const updatedTasks = tasks.map((t) =>
          t.id === current.id
            ? { ...t, priority: newPriority, order: newGroupSize + 1 }
            : t
        )
        persist(updatedTasks)
      }
    } else {
      if (idx === activeTasks.length - 1) return // already at bottom
      const below = activeTasks[idx + 1]
      if (below.priority === current.priority) {
        // Swap within same priority
        const updatedTasks = tasks.map((t) => {
          if (t.id === current.id) return { ...t, order: below.order }
          if (t.id === below.id) return { ...t, order: current.order }
          return t
        })
        persist(updatedTasks)
      } else {
        // Move into the priority below, at position 1
        const newPriority = below.priority as Priority
        const updatedTasks = tasks.map((t) => {
          if (t.id === current.id) return { ...t, priority: newPriority, order: 0 }
          return t
        })
        persist(updatedTasks)
      }
    }
  }

  // ------ Export ------
  function handleExport() {
    const blob = new Blob([JSON.stringify(sortTasks(tasks), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ------ Import ------
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null)
    setImportSuccess(false)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result
        if (typeof text !== 'string') throw new Error('Could not read file')
        const parsed = JSON.parse(text)
        if (!Array.isArray(parsed)) throw new Error('JSON must be an array of tasks')
        if (!parsed.every(isValidTask)) {
          throw new Error('Invalid task data in JSON file.')
        }
        persist(parsed)
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to import')
      }
    }
    reader.readAsText(file)
    // Reset file input so re-importing same file works
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function resetForm() {
    setFormTitle('')
    setFormPriority('Low')
    setFormStatus('To Do')
    setFormBlocker(false)
    setFormBlockerText('')
    setFormComments('')
  }

  // ------ Supabase Sync ------
  function openSyncModal(mode: 'push' | 'pull') {
    setSyncPassword('')
    setSyncFeedback(null)
    setSyncModal(mode)
  }

  function closeSyncModal() {
    setSyncModal(null)
    setSyncPassword('')
    setSyncing(false)
  }

  async function handleSync() {
    if (!syncModal || !syncPassword) return
    setSyncing(true)
    setSyncFeedback(null)

    if (syncModal === 'push') {
      const payload = { tasks: sortTasks(tasks), statusItems: sortStatusItems(statusItems) }
      const result = await syncPush(syncPassword, payload)
      if (result.success) {
        closeSyncModal()
      } else {
        setSyncFeedback({ type: 'error', message: result.error ?? 'Push failed' })
      }
    } else {
      const result = await syncPull(syncPassword)
      if (result.success && result.data) {
        let pulledTasks: Task[] = []
        let pulledStatusItems: StatusItem[] = []

        if (Array.isArray(result.data)) {
          pulledTasks = result.data as Task[]
        } else if (typeof result.data === 'object' && result.data !== null) {
          const obj = result.data as Record<string, unknown>
          if (Array.isArray(obj.tasks)) pulledTasks = obj.tasks as Task[]
          if (Array.isArray(obj.statusItems)) pulledStatusItems = obj.statusItems as StatusItem[]
        }

        if (pulledTasks.length > 0) persist(pulledTasks)
        if (pulledStatusItems.length > 0) persistStatusItems(pulledStatusItems)
        closeSyncModal()
      } else {
        setSyncFeedback({ type: 'error', message: result.error ?? 'Pull failed' })
      }
    }
    setSyncing(false)
  }

  // ------ Render ------
  if (!loaded) {
    return (
      <section>
        <h1 className="mb-2 text-2xl font-semibold tracking-tighter">Tasks</h1>
        <p className="text-neutral-500">Loading…</p>
      </section>
    )
  }

  const activeTasks = sortTasks(tasks.filter((t) => !t.completed))
  const completedTasks = sortTasks(tasks.filter((t) => t.completed))



  const activeStatusItems = sortStatusItems(statusItems.filter((s) => !s.completed))
  const completedStatusItems = sortStatusItems(statusItems.filter((s) => s.completed))

  return (
    <section className="tasks-page">
      <div className="tasks-header">
        <h1 className="mb-2 text-2xl font-semibold tracking-tighter">Tasks</h1>

        <div className="tasks-toolbar">
          <div className="tasks-toolbar-left">
            {showJsonOptions && (
              <>
                <button
                  className="tasks-btn tasks-btn-secondary"
                  onClick={handleExport}
                  disabled={tasks.length === 0}
                  id="export-btn"
                >
                  Export JSON
                </button>
                <label className="tasks-btn tasks-btn-secondary tasks-import-label" id="import-btn">
                  Import JSON
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImport}
                    className="tasks-hidden-input"
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation Segmented Control */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem' }}>
          <div className="tasks-tabs-nav">
            <button
              className={`tasks-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
              id="tab-tasks"
            >
              <span className="tasks-tab-icon">📋</span>
              Tasks <span className="tasks-tab-badge">{activeTasks.length}</span>
            </button>

            <button
              className={`tasks-tab-btn ${activeTab === 'status' ? 'active' : ''}`}
              onClick={() => setActiveTab('status')}
              id="tab-status"
            >
              <span className="tasks-tab-icon">📊</span>
              Status <span className="tasks-tab-badge">{activeStatusItems.length}</span>
            </button>
          </div>

          <div className="tasks-toolbar-right" style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="tasks-btn tasks-btn-sync tasks-btn-push"
              onClick={() => openSyncModal('push')}
              disabled={tasks.length === 0}
              id="sync-push-btn"
            >
              ↑ Push
            </button>
            <button
              className="tasks-btn tasks-btn-sync tasks-btn-pull"
              onClick={() => openSyncModal('pull')}
              id="sync-pull-btn"
            >
              ↓ Pull
            </button>
          </div>
        </div>
      </div>

      {/* Import feedback */}
      {importError && (
        <div className="tasks-alert tasks-alert-error" role="alert">
          <strong>Import failed:</strong> {importError}
          <button
            className="tasks-alert-dismiss"
            onClick={() => setImportError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      {importSuccess && (
        <div className="tasks-alert tasks-alert-success" role="status">
          Tasks imported successfully!
        </div>
      )}

       {/* Active Tab Content */}
      {activeTab === 'tasks' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '0.5rem' }}>
            <h2 className="text-lg font-semibold tracking-tight" style={{ margin: 0 }}>
              Task Tracker
            </h2>
            <button
              className="tasks-btn tasks-btn-primary"
              onClick={() => {
                resetForm()
                setEditingId(null)
                setShowAddForm(!showAddForm)
              }}
              id="add-task-btn"
            >
              {showAddForm ? 'Cancel' : '+ Add Task'}
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="tasks-form-card">
              <h2 className="tasks-form-heading">New Task</h2>
              <TaskForm
                title={formTitle}
                priority={formPriority}
                status={formStatus}
                hasBlocker={formBlocker}
                blockerText={formBlockerText}
                comments={formComments}
                onTitleChange={setFormTitle}
                onPriorityChange={setFormPriority}
                onStatusChange={setFormStatus}
                onBlockerChange={setFormBlocker}
                onBlockerTextChange={setFormBlockerText}
                onCommentsChange={setFormComments}
                onSubmit={handleAdd}
                submitLabel="Add Task"
              />
            </div>
          )}

          {/* Edit Task Modal */}
          {editingId && (
            <div className="tasks-modal-overlay" onClick={cancelEdit}>
              <div
                className="tasks-modal tasks-modal-edit"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="edit-modal-title"
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <h3 id="edit-modal-title" className="tasks-modal-title" style={{ margin: 0 }}>
                    Edit Task #{editingId}
                  </h3>
                  <button
                    className="tasks-alert-dismiss"
                    onClick={cancelEdit}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <TaskForm
                  title={formTitle}
                  priority={formPriority}
                  status={formStatus}
                  hasBlocker={formBlocker}
                  blockerText={formBlockerText}
                  comments={formComments}
                  onTitleChange={setFormTitle}
                  onPriorityChange={setFormPriority}
                  onStatusChange={setFormStatus}
                  onBlockerChange={setFormBlocker}
                  onBlockerTextChange={setFormBlockerText}
                  onCommentsChange={setFormComments}
                  onSubmit={handleSaveEdit}
                  onCancel={cancelEdit}
                  submitLabel="Save Changes"
                />
              </div>
            </div>
          )}

          {/* Task list grouped by priority sections */}
          {activeTasks.length === 0 ? (
            <p className="text-neutral-500 mt-8 text-center">
              {completedTasks.length > 0
                ? 'No active tasks.'
                : 'No tasks yet. Add one to get started.'}
            </p>
          ) : (
            <div className="tasks-sections">
              {PRIORITIES.map((priority) => {
                const groupTasks = activeTasks.filter((t) => t.priority === priority)
                if (groupTasks.length === 0) return null

                return (
                  <div key={priority} className="tasks-section">
                    <div className="tasks-section-header">
                      <span
                        className="tasks-section-dot"
                        style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                      />
                      <h2 className="tasks-section-title">
                        {priority} Priority
                      </h2>
                      <span className="tasks-section-count">{groupTasks.length}</span>
                    </div>
                    <div className="tasks-list">
                      {groupTasks.map((task) => {
                        const globalIdx = activeTasks.findIndex((t) => t.id === task.id)
                        const isFirstActive = globalIdx === 0
                        const isLastActive = globalIdx === activeTasks.length - 1

                        return (
                          <div key={task.id} className="tasks-item" id={`task-${task.id}`}>
                            {/* Move controls */}
                            <div className="tasks-move-controls">
                              <button
                                className="tasks-move-btn"
                                onClick={() => moveTask(task.id, 'up')}
                                disabled={isFirstActive}
                                aria-label="Move up"
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                className="tasks-move-btn"
                                onClick={() => moveTask(task.id, 'down')}
                                disabled={isLastActive}
                                aria-label="Move down"
                                title="Move down"
                              >
                                ↓
                              </button>
                            </div>

                            {/* Badges column */}
                            <div className="tasks-badges-col">
                              <span
                                className="tasks-priority-badge"
                                style={{
                                  backgroundColor: PRIORITY_COLORS[task.priority],
                                }}
                                title={`Priority: ${task.priority}`}
                              >
                                {task.priority}
                              </span>
                              <span className="tasks-id-badge" title={`Task ID: #${task.id}`}>
                                #{task.id}
                              </span>
                            </div>

                            {/* Content */}
                            <div className="tasks-item-content">
                              <div className="tasks-item-header">
                                <div className="tasks-item-title">{task.title}</div>
                              </div>
                              {task.hasBlocker && task.blocker && (
                                <div className="tasks-item-blocker">
                                  <span className="tasks-blocker-icon">⚠</span>
                                  <span>Blocker: {task.blocker}</span>
                                </div>
                              )}
                              {task.hasBlocker && !task.blocker && (
                                <div className="tasks-item-blocker">
                                  <span className="tasks-blocker-icon">⚠</span>
                                  <span>Blocked (no details)</span>
                                </div>
                              )}
                              {task.comments && (
                                <div className="tasks-item-comments">
                                  <span className="tasks-comments-icon">💬</span>
                                  <span>{task.comments}</span>
                                </div>
                              )}

                              {/* Subtasks Container */}
                              <div className="tasks-subtasks-container">
                                {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
                                  <div className="tasks-subtasks-header">
                                    Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
                                  </div>
                                )}

                                {Array.isArray(task.subtasks) &&
                                  task.subtasks.map((st) =>
                                    editingSubtask?.taskId === task.id && editingSubtask?.subtask.id === st.id ? (
                                      <SubtaskForm
                                        key={st.id}
                                        initial={st}
                                        onSave={(data) => handleSaveSubtaskEdit(task.id, st.id, data)}
                                        onCancel={() => setEditingSubtask(null)}
                                      />
                                    ) : (
                                      <SubtaskItem
                                        key={st.id}
                                        subtask={st}
                                        taskId={task.id}
                                        isExpanded={expandedSubtasks.has(st.id)}
                                        onToggleExpand={() => toggleSubtaskExpand(st.id)}
                                        onToggleComplete={() => handleToggleSubtaskComplete(task.id, st.id)}
                                        onUpdateStatus={(status) => handleUpdateSubtaskStatus(task.id, st.id, status)}
                                        onStartEdit={() => {
                                          if (!expandedSubtasks.has(st.id)) toggleSubtaskExpand(st.id)
                                          setEditingSubtask({ taskId: task.id, subtask: st })
                                        }}
                                        onDelete={() =>
                                          setDeleteTarget({
                                            type: 'subtask',
                                            taskId: task.id,
                                            subtaskId: st.id,
                                            title: st.title,
                                          })
                                        }
                                      />
                                    )
                                  )}

                                {addingSubtaskId === task.id ? (
                                  <SubtaskForm
                                    onSave={(data) => handleAddSubtask(task.id, data)}
                                    onCancel={() => setAddingSubtaskId(null)}
                                  />
                                ) : (
                                  <button
                                    className="tasks-add-subtask-btn"
                                    onClick={() => setAddingSubtaskId(task.id)}
                                    title="Add subtask"
                                  >
                                    + Subtask
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="tasks-item-actions">
                              <select
                                className="tasks-status-select"
                                style={{
                                  backgroundColor: STATUS_COLORS[task.status ?? 'To Do'].bg,
                                  color: STATUS_COLORS[task.status ?? 'To Do'].fg,
                                  borderColor: STATUS_COLORS[task.status ?? 'To Do'].border,
                                }}
                                value={task.status ?? 'To Do'}
                                onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                                title="Change task status"
                              >
                                {TASK_STATUSES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>

                              <div className="tasks-action-btns-row">
                                <button
                                  className="tasks-action-btn tasks-action-complete"
                                  onClick={() => toggleComplete(task.id)}
                                  aria-label="Mark complete"
                                  title="Mark complete"
                                >
                                  ✓
                                </button>
                                <button
                                  className="tasks-action-btn tasks-action-edit"
                                  onClick={() => startEdit(task)}
                                  aria-label="Edit task"
                                  title="Edit"
                                  disabled={editingId === task.id}
                                >
                                  ✎
                                </button>
                                <button
                                  className="tasks-action-btn tasks-action-delete"
                                  onClick={() => setDeleteTarget({ type: 'task', id: task.id, title: task.title })}
                                  aria-label="Delete task"
                                  title="Delete"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          {(activeTasks.length > 0 || completedTasks.length > 0) && (
            <div className="tasks-legend">
              {PRIORITIES.map((p) => (
                <span key={p} className="tasks-legend-item">
                  <span
                    className="tasks-legend-dot"
                    style={{ backgroundColor: PRIORITY_COLORS[p] }}
                  />
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <div className="tasks-completed-section">
              <div className="tasks-section-header tasks-completed-header">
                <span className="tasks-section-dot tasks-completed-dot" />
                <h2 className="tasks-section-title">Completed Tasks</h2>
                <span className="tasks-section-count">{completedTasks.length}</span>
              </div>
              <div className="tasks-list">
                {completedTasks.map((task) => (
                  <div key={task.id} className="tasks-item tasks-item-completed" id={`task-${task.id}`}>
                    {/* Badges column */}
                    <div className="tasks-badges-col">
                      <span
                        className="tasks-priority-badge tasks-priority-badge-completed"
                        style={{
                          backgroundColor: PRIORITY_COLORS[task.priority],
                        }}
                        title={`Priority: ${task.priority}`}
                      >
                        {task.priority}
                      </span>
                      <span className="tasks-id-badge tasks-id-badge-completed" title={`Task ID: #${task.id}`}>
                        #{task.id}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="tasks-item-content">
                      <div className="tasks-item-header">
                        <div className="tasks-item-title tasks-item-title-completed">{task.title}</div>
                      </div>
                      {task.hasBlocker && task.blocker && (
                        <div className="tasks-item-blocker">
                          <span className="tasks-blocker-icon">⚠</span>
                          <span>Blocker: {task.blocker}</span>
                        </div>
                      )}
                      {task.comments && (
                        <div className="tasks-item-comments">
                          <span className="tasks-comments-icon">💬</span>
                          <span>{task.comments}</span>
                        </div>
                      )}

                      {/* Subtasks Container */}
                      <div className="tasks-subtasks-container">
                        {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
                          <div className="tasks-subtasks-header">
                            Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
                          </div>
                        )}

                        {Array.isArray(task.subtasks) &&
                          task.subtasks.map((st) => (
                            <SubtaskItem
                              key={st.id}
                              subtask={st}
                              taskId={task.id}
                              isExpanded={expandedSubtasks.has(st.id)}
                              onToggleExpand={() => toggleSubtaskExpand(st.id)}
                              onToggleComplete={() => handleToggleSubtaskComplete(task.id, st.id)}
                              onUpdateStatus={(status) => handleUpdateSubtaskStatus(task.id, st.id, status)}
                              onStartEdit={() => {
                                if (!expandedSubtasks.has(st.id)) toggleSubtaskExpand(st.id)
                                setEditingSubtask({ taskId: task.id, subtask: st })
                              }}
                              onDelete={() =>
                                setDeleteTarget({
                                  type: 'subtask',
                                  taskId: task.id,
                                  subtaskId: st.id,
                                  title: st.title,
                                })
                              }
                            />
                          ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="tasks-item-actions">
                      <select
                        className="tasks-status-select"
                        style={{
                          backgroundColor: STATUS_COLORS['Done'].bg,
                          color: STATUS_COLORS['Done'].fg,
                          borderColor: STATUS_COLORS['Done'].border,
                        }}
                        value={task.status ?? 'Done'}
                        onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                        title="Change task status"
                      >
                        {TASK_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <div className="tasks-action-btns-row">
                        <button
                          className="tasks-action-btn tasks-action-restore"
                          onClick={() => toggleComplete(task.id)}
                          aria-label="Restore task"
                          title="Restore task to active"
                        >
                          ↩
                        </button>
                        <button
                          className="tasks-action-btn tasks-action-delete"
                          onClick={() => setDeleteTarget({ type: 'task', id: task.id, title: task.title })}
                          aria-label="Delete task"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Status Tab Content */
        <StatusSection
          activeItems={activeStatusItems}
          completedItems={completedStatusItems}
          onAddNew={() => {
            resetStatusForm()
            setEditingStatusId(null)
            setShowAddStatusModal(true)
          }}
          onStartEdit={startEditStatus}
          onDelete={(si) => setDeleteTarget({ type: 'status', id: si.id, title: si.title })}
          onUpdateStatus={updateStatusItemStatus}
          onToggleComplete={toggleStatusComplete}
          onMoveItem={moveStatusItem}
        />
      )}

      {/* Add / Edit Status Form Modal */}
      {(showAddStatusModal || editingStatusId !== null) && (
        <StatusFormModal
          isEdit={editingStatusId !== null}
          id={editingStatusId ?? undefined}
          title={statusFormTitle}
          status={statusFormStatus}
          priority={statusFormPriority}
          comments={statusFormComments}
          onTitleChange={setStatusFormTitle}
          onStatusChange={setStatusFormStatus}
          onPriorityChange={setStatusFormPriority}
          onCommentsChange={setStatusFormComments}
          onSubmit={editingStatusId ? handleSaveEditStatus : handleAddStatus}
          onCancel={() => {
            setShowAddStatusModal(false)
            cancelStatusEdit()
          }}
        />
      )}

      {/* Sync password modal */}
      {syncModal && (
        <div className="tasks-modal-overlay" onClick={closeSyncModal}>
          <div
            className="tasks-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="sync-modal-title"
          >
            <h3 id="sync-modal-title" className="tasks-modal-title">
              {syncModal === 'push' ? '↑ Push to Cloud' : '↓ Pull from Cloud'}
            </h3>
            <p className="tasks-modal-desc">
              {syncModal === 'push'
                ? 'Upload your local tasks to Supabase. This will overwrite cloud data.'
                : 'Download tasks from Supabase. This will replace your local data.'}
            </p>
            <div className="tasks-field">
              <label className="tasks-label" htmlFor="sync-password">
                Password
              </label>
              <input
                id="sync-password"
                type="password"
                className="tasks-input"
                placeholder="Enter sync password"
                value={syncPassword}
                onChange={(e) => setSyncPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && syncPassword) handleSync()
                }}
                autoFocus
                disabled={syncing}
              />
            </div>
            {syncFeedback && (
              <div
                className={`tasks-alert ${syncFeedback.type === 'success'
                    ? 'tasks-alert-success'
                    : 'tasks-alert-error'
                  }`}
                style={{ marginTop: '0.5rem', marginBottom: 0 }}
              >
                {syncFeedback.message}
              </div>
            )}
            <div className="tasks-form-actions" style={{ marginTop: '0.75rem' }}>
              <button
                className="tasks-btn tasks-btn-primary"
                onClick={handleSync}
                disabled={!syncPassword || syncing}
              >
                {syncing
                  ? 'Syncing…'
                  : syncModal === 'push'
                    ? 'Push'
                    : 'Pull'}
              </button>
              <button
                className="tasks-btn tasks-btn-ghost"
                onClick={closeSyncModal}
                disabled={syncing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="tasks-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="tasks-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-modal-title"
          >
            <h3 id="delete-modal-title" className="tasks-modal-title">
              Delete {deleteTarget.type === 'task' ? 'Task' : deleteTarget.type === 'status' ? 'Status Item' : 'Subtask'}
            </h3>
            <p className="tasks-modal-desc">
              Are you sure you want to delete &quot;<strong>{deleteTarget.title}</strong>&quot; (#
              {deleteTarget.type === 'subtask' ? deleteTarget.subtaskId : deleteTarget.id})? This action cannot be undone.
            </p>
            <div className="tasks-form-actions" style={{ marginTop: '1rem' }}>
              <button
                className="tasks-btn tasks-btn-danger"
                onClick={confirmDelete}
                autoFocus
              >
                Delete
              </button>
              <button
                className="tasks-btn tasks-btn-ghost"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// TaskForm sub-component
// ---------------------------------------------------------------------------

function TaskForm({
  title,
  priority,
  status,
  hasBlocker,
  blockerText,
  comments,
  onTitleChange,
  onPriorityChange,
  onStatusChange,
  onBlockerChange,
  onBlockerTextChange,
  onCommentsChange,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  title: string
  priority: Priority
  status: TaskStatus
  hasBlocker: boolean
  blockerText: string
  comments: string
  onTitleChange: (v: string) => void
  onPriorityChange: (v: Priority) => void
  onStatusChange: (v: TaskStatus) => void
  onBlockerChange: (v: boolean) => void
  onBlockerTextChange: (v: string) => void
  onCommentsChange: (v: string) => void
  onSubmit: () => void
  onCancel?: () => void
  submitLabel: string
}) {
  return (
    <div className="tasks-form">
      {/* Title */}
      <div className="tasks-field">
        <label className="tasks-label" htmlFor="task-title">
          Title
        </label>
        <input
          id="task-title"
          type="text"
          className="tasks-input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
          }}
          autoFocus
        />
      </div>

      {/* Priority & Status Row */}
      <div className="tasks-form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Priority */}
        <div className="tasks-field" style={{ flex: 1, minWidth: '180px' }}>
          <label className="tasks-label">Priority</label>
          <div className="tasks-priority-options">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                className={`tasks-priority-option ${priority === p ? 'active' : ''}`}
                style={{
                  borderColor: priority === p ? PRIORITY_COLORS[p] : undefined,
                  backgroundColor:
                    priority === p ? PRIORITY_COLORS[p] + '18' : undefined,
                }}
                onClick={() => onPriorityChange(p)}
              >
                <span
                  className="tasks-priority-option-dot"
                  style={{ backgroundColor: PRIORITY_COLORS[p] }}
                />
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="tasks-field" style={{ minWidth: '140px' }}>
          <label className="tasks-label" htmlFor="task-status-form">
            Status
          </label>
          <select
            id="task-status-form"
            className="tasks-input"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
            style={{ cursor: 'pointer' }}
          >
            {TASK_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Blocker */}
      <div className="tasks-field">
        <label className="tasks-label tasks-checkbox-label">
          <input
            type="checkbox"
            checked={hasBlocker}
            onChange={(e) => onBlockerChange(e.target.checked)}
            className="tasks-checkbox"
          />
          Has Blocker
        </label>
        {hasBlocker && (
          <input
            type="text"
            className="tasks-input tasks-input-blocker"
            placeholder="Describe the blocker…"
            value={blockerText}
            onChange={(e) => onBlockerTextChange(e.target.value)}
          />
        )}
      </div>

      {/* Comments */}
      <div className="tasks-field">
        <label className="tasks-label" htmlFor="task-comments">
          Comments
        </label>
        <textarea
          id="task-comments"
          className="tasks-textarea"
          placeholder="Notes, context, follow-ups…"
          value={comments}
          onChange={(e) => onCommentsChange(e.target.value)}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="tasks-form-actions">
        <button
          className="tasks-btn tasks-btn-primary"
          onClick={onSubmit}
          disabled={!title.trim()}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button className="tasks-btn tasks-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubtaskForm sub-component
// ---------------------------------------------------------------------------

function SubtaskForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Subtask>
  onSave: (data: { title: string; hasBlocker: boolean; blocker: string; comments: string; status: TaskStatus }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'To Do')
  const [hasBlocker, setHasBlocker] = useState(initial?.hasBlocker ?? false)
  const [blockerText, setBlockerText] = useState(initial?.blocker ?? '')
  const [comments, setComments] = useState(initial?.comments ?? '')

  return (
    <div className="tasks-subtask-form">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="tasks-input"
          style={{ flex: 1, minWidth: '150px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
          placeholder="Subtask title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) {
              onSave({ title: title.trim(), hasBlocker, blocker: blockerText, comments, status })
            }
          }}
          autoFocus
        />
        <select
          className="tasks-input"
          style={{ width: '110px', padding: '0.25rem 0.4rem', fontSize: '0.75rem', cursor: 'pointer' }}
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
        >
          {TASK_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.35rem', flexWrap: 'wrap' }}>
        <label className="tasks-checkbox-label" style={{ fontSize: '0.75rem' }}>
          <input
            type="checkbox"
            checked={hasBlocker}
            onChange={(e) => setHasBlocker(e.target.checked)}
            className="tasks-checkbox"
          />
          Has Blocker
        </label>
        {hasBlocker && (
          <input
            type="text"
            className="tasks-input"
            style={{ flex: 1, minWidth: '120px', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
            placeholder="Blocker details…"
            value={blockerText}
            onChange={(e) => setBlockerText(e.target.value)}
          />
        )}
      </div>

      <div style={{ marginTop: '0.35rem' }}>
        <input
          type="text"
          className="tasks-input"
          style={{ width: '100%', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
          placeholder="Comments (optional)…"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
        <button
          className="tasks-btn tasks-btn-primary"
          style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
          onClick={() => {
            if (title.trim()) onSave({ title: title.trim(), hasBlocker, blocker: blockerText, comments, status })
          }}
          disabled={!title.trim()}
        >
          Save Subtask
        </button>
        <button
          className="tasks-btn tasks-btn-ghost"
          style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubtaskItem sub-component
// ---------------------------------------------------------------------------

function SubtaskItem({
  subtask,
  taskId,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onUpdateStatus,
  onStartEdit,
  onDelete,
}: {
  subtask: Subtask
  taskId: string
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleComplete: () => void
  onUpdateStatus: (status: TaskStatus) => void
  onStartEdit: () => void
  onDelete: () => void
}) {
  const st = subtask

  if (!isExpanded) {
    return (
      <div className={`tasks-subtask-item collapsed ${st.completed ? 'completed' : ''}`}>
        <button
          className="tasks-subtask-expand-btn"
          onClick={onToggleExpand}
          title="Expand subtask"
          aria-label="Expand subtask"
        >
          <svg
            className="tasks-subtask-chevron"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <span
          className={`tasks-subtask-title ${st.completed ? 'tasks-item-title-completed' : ''}`}
          onClick={onToggleExpand}
          style={{ cursor: 'pointer' }}
        >
          {st.title}
        </span>
      </div>
    )
  }

  return (
    <div className={`tasks-subtask-item expanded ${st.completed ? 'completed' : ''}`}>
      <button
        className="tasks-subtask-expand-btn expanded"
        onClick={onToggleExpand}
        title="Collapse subtask"
        aria-label="Collapse subtask"
      >
        <svg
          className="tasks-subtask-chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <span className="tasks-id-badge tasks-subtask-id" title={`Subtask ID: #${st.id}`}>
        #{st.id}
      </span>
      <div className="tasks-subtask-content">
        <span className={`tasks-subtask-title ${st.completed ? 'tasks-item-title-completed' : ''}`}>
          {st.title}
        </span>
        {st.hasBlocker && (
          <div className="tasks-item-blocker" style={{ fontSize: '0.72rem' }}>
            <span className="tasks-blocker-icon">⚠</span>
            <span>Blocker: {st.blocker || 'Blocked'}</span>
          </div>
        )}
        {st.comments && (
          <div className="tasks-item-comments" style={{ fontSize: '0.72rem' }}>
            <span className="tasks-comments-icon">💬</span>
            <span>{st.comments}</span>
          </div>
        )}
      </div>
      <div className="tasks-item-actions">
        <select
          className="tasks-status-select"
          style={{
            backgroundColor: STATUS_COLORS[st.status ?? 'To Do'].bg,
            color: STATUS_COLORS[st.status ?? 'To Do'].fg,
            borderColor: STATUS_COLORS[st.status ?? 'To Do'].border,
          }}
          value={st.status ?? 'To Do'}
          onChange={(e) => onUpdateStatus(e.target.value as TaskStatus)}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="tasks-action-btns-row">
          <button
            className={`tasks-action-btn ${st.completed ? 'tasks-action-restore' : 'tasks-action-complete'}`}
            onClick={onToggleComplete}
            title={st.completed ? 'Restore subtask' : 'Mark subtask complete'}
          >
            {st.completed ? '↩' : '✓'}
          </button>
          <button
            className="tasks-action-btn tasks-action-edit"
            onClick={onStartEdit}
            title="Edit subtask"
          >
            ✎
          </button>
          <button
            className="tasks-action-btn tasks-action-delete"
            onClick={onDelete}
            title="Delete subtask"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}



// ---------------------------------------------------------------------------
// Status Section & Form Modal
// ---------------------------------------------------------------------------

function StatusSection({
  activeItems,
  completedItems,
  onAddNew,
  onStartEdit,
  onDelete,
  onUpdateStatus,
  onToggleComplete,
  onMoveItem,
}: {
  activeItems: StatusItem[]
  completedItems: StatusItem[]
  onAddNew: () => void
  onStartEdit: (item: StatusItem) => void
  onDelete: (item: StatusItem) => void
  onUpdateStatus: (id: string, status: StatusItemStatus) => void
  onToggleComplete: (id: string) => void
  onMoveItem: (id: string, direction: 'up' | 'down') => void
}) {
  const hasItems = activeItems.length > 0 || completedItems.length > 0

  return (
    <div className="tasks-pr-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '0.5rem' }}>
        <h2 className="text-lg font-semibold tracking-tight" style={{ margin: 0 }}>
          Status Tracker
        </h2>
        <button
          className="tasks-btn tasks-btn-primary"
          onClick={onAddNew}
          id="add-status-btn"
        >
          + Add Status
        </button>
      </div>

      {!hasItems && (
        <div className="tasks-empty-state">
          <p className="tasks-empty-title">No status items tracked yet</p>
          <p className="tasks-empty-desc">Click &ldquo;+ Add Status&rdquo; to start tracking statuses.</p>
        </div>
      )}

      {/* Active Status Items */}
      {activeItems.length > 0 && (
        <div className="tasks-sections">
          {PRIORITIES.map((priority) => {
            const groupItems = activeItems.filter((si) => si.priority === priority)
            if (groupItems.length === 0) return null

            return (
              <div key={priority} className="tasks-section">
                <div className="tasks-section-header">
                  <span
                    className="tasks-section-dot"
                    style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                  />
                  <h2 className="tasks-section-title">{priority} Priority</h2>
                  <span className="tasks-section-count">{groupItems.length}</span>
                </div>
                <div className="tasks-list">
                  {groupItems.map((si) => {
                    const globalIdx = activeItems.findIndex((x) => x.id === si.id)
                    const isFirstActive = globalIdx === 0
                    const isLastActive = globalIdx === activeItems.length - 1

                    return (
                      <div key={si.id} className="status-item-card" id={`status-${si.id}`}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <div className="tasks-move-controls" style={{ marginRight: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <button
                              className="tasks-move-btn"
                              onClick={() => onMoveItem(si.id, 'up')}
                              disabled={isFirstActive}
                              aria-label="Move up"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              className="tasks-move-btn"
                              onClick={() => onMoveItem(si.id, 'down')}
                              disabled={isLastActive}
                              aria-label="Move down"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                          
                          <div className="status-item-content">
                            <div className="status-item-title">{si.title}</div>
                            {si.comments && (
                              <div className="tasks-item-comments" style={{ marginTop: '0.2rem' }}>
                                <span className="tasks-comments-icon">💬</span>
                                <span>{si.comments}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="tasks-item-actions">
                          <select
                            className="tasks-status-select"
                            style={{
                              backgroundColor: STATUS_ITEM_COLORS[si.status].bg,
                              color: STATUS_ITEM_COLORS[si.status].fg,
                              borderColor: STATUS_ITEM_COLORS[si.status].border,
                            }}
                            value={si.status}
                            onChange={(e) => onUpdateStatus(si.id, e.target.value as StatusItemStatus)}
                            title="Change status"
                          >
                            {STATUS_ITEM_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>

                          <div className="tasks-action-btns-row">
                            <button
                              className="tasks-action-btn tasks-action-complete"
                              onClick={() => onToggleComplete(si.id)}
                              title="Mark Done"
                            >
                              ✓
                            </button>
                            <button
                              className="tasks-action-btn tasks-action-edit"
                              onClick={() => onStartEdit(si)}
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              className="tasks-action-btn tasks-action-delete"
                              onClick={() => onDelete(si)}
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed Status Items */}
      {completedItems.length > 0 && (
        <div className="tasks-completed-section">
          <div className="tasks-section-header tasks-completed-header">
            <span className="tasks-section-dot tasks-completed-dot" />
            <h2 className="tasks-section-title">Completed</h2>
            <span className="tasks-section-count">{completedItems.length}</span>
          </div>
          <div className="tasks-list">
            {completedItems.map((si) => (
              <div key={si.id} className="status-item-card completed" id={`status-${si.id}`}>
                <div className="status-item-content">
                  <div className="status-item-title completed">{si.title}</div>
                  {si.comments && (
                    <div className="tasks-item-comments" style={{ marginTop: '0.2rem' }}>
                      <span className="tasks-comments-icon">💬</span>
                      <span>{si.comments}</span>
                    </div>
                  )}
                </div>

                <div className="tasks-item-actions">
                  <select
                    className="tasks-status-select"
                    style={{
                      backgroundColor: STATUS_ITEM_COLORS[si.status].bg,
                      color: STATUS_ITEM_COLORS[si.status].fg,
                      borderColor: STATUS_ITEM_COLORS[si.status].border,
                    }}
                    value={si.status}
                    onChange={(e) => onUpdateStatus(si.id, e.target.value as StatusItemStatus)}
                  >
                    {STATUS_ITEM_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <div className="tasks-action-btns-row">
                    <button
                      className="tasks-action-btn tasks-action-restore"
                      onClick={() => onToggleComplete(si.id)}
                      title="Restore"
                    >
                      ↩
                    </button>
                    <button
                      className="tasks-action-btn tasks-action-delete"
                      onClick={() => onDelete(si)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusFormModal({
  isEdit,
  id,
  title,
  status,
  priority,
  comments,
  onTitleChange,
  onStatusChange,
  onPriorityChange,
  onCommentsChange,
  onSubmit,
  onCancel,
}: {
  isEdit: boolean
  id?: string
  title: string
  status: StatusItemStatus
  priority: Priority
  comments: string
  onTitleChange: (val: string) => void
  onStatusChange: (val: StatusItemStatus) => void
  onPriorityChange: (val: Priority) => void
  onCommentsChange: (val: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div className="tasks-modal-overlay" onClick={onCancel}>
      <div
        className="tasks-modal tasks-modal-edit"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        style={{ maxWidth: '440px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 className="tasks-modal-title" style={{ margin: 0 }}>
            {isEdit ? `Edit Status #${id}` : 'New Status Item'}
          </h3>
          <button className="tasks-alert-dismiss" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="tasks-form"
        >
          <div className="tasks-form-group">
            <label className="tasks-label">Title *</label>
            <input
              type="text"
              className="tasks-input"
              placeholder="What are you tracking?"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="tasks-form-group">
            <label className="tasks-label">Priority</label>
            <select
              className="tasks-input"
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value as Priority)}
              style={{ cursor: 'pointer' }}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="tasks-form-group">
            <label className="tasks-label">Status</label>
            <select
              className="tasks-input"
              value={status}
              onChange={(e) => onStatusChange(e.target.value as StatusItemStatus)}
              style={{ cursor: 'pointer' }}
            >
              {STATUS_ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="tasks-form-group">
            <label className="tasks-label">Comments</label>
            <textarea
              className="tasks-textarea"
              placeholder="Optional notes..."
              rows={2}
              value={comments}
              onChange={(e) => onCommentsChange(e.target.value)}
            />
          </div>

          <div className="tasks-form-actions">
            <button type="submit" className="tasks-btn tasks-btn-primary" disabled={!title.trim()}>
              {isEdit ? 'Save Changes' : 'Create'}
            </button>
            <button type="button" className="tasks-btn tasks-btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
