'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { syncPush, syncPull } from './supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
}

type Priority = Task['priority']
type TaskStatus = NonNullable<Task['status']>

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low', 'Backlog']
const TASK_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'On Hold', 'Done']

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
  'Done': { bg: '#dcfce7', fg: '#15803d', border: '#bbf7d0' },
}

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

const STORAGE_KEY = 'alphacrash-tasks'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(existingTasks: Task[] = []): string {
  const existingIds = new Set(existingTasks.map((t) => t.id))
  let id = ''
  do {
    id = Math.floor(1000 + Math.random() * 9000).toString()
  } while (existingIds.has(id))
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
    return (parsed as Task[]).map((t) => {
      let id = t.id
      if (!id || !/^\d{4}$/.test(id) || usedIds.has(id)) {
        do {
          id = Math.floor(1000 + Math.random() * 9000).toString()
        } while (usedIds.has(id))
      }
      usedIds.add(id)
      const completed = Boolean(t.completed || t.status === 'Done')
      const status = mapStatus(t.status, completed)
      return {
        ...t,
        id,
        priority: mapPriority(t.priority),
        status,
        completed,
      }
    })
  } catch {
    return []
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
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
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    validP &&
    validS &&
    typeof obj.order === 'number' &&
    typeof obj.hasBlocker === 'boolean' &&
    typeof obj.blocker === 'string' &&
    typeof obj.comments === 'string' &&
    (typeof obj.completed === 'undefined' || typeof obj.completed === 'boolean')
  )
}

// ---------------------------------------------------------------------------
// Reusable Component
// ---------------------------------------------------------------------------

export default function TasksView({
  showJsonOptions = false,
}: {
  showJsonOptions?: boolean
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loaded, setLoaded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state
  const [syncModal, setSyncModal] = useState<'push' | 'pull' | null>(null)
  const [syncPassword, setSyncPassword] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formPriority, setFormPriority] = useState<Priority>('Low')
  const [formStatus, setFormStatus] = useState<TaskStatus>('To Do')
  const [formBlocker, setFormBlocker] = useState(false)
  const [formBlockerText, setFormBlockerText] = useState('')
  const [formComments, setFormComments] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadTasks()
    setTasks(normalizeOrders(loaded))
    setLoaded(true)
  }, [])

  // Persist whenever tasks change
  const persist = useCallback((updated: Task[]) => {
    const normalized = normalizeOrders(updated)
    setTasks(normalized)
    saveTasks(normalized)
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
      const result = await syncPush(syncPassword, sortTasks(tasks))
      if (result.success) {
        setSyncFeedback({ type: 'success', message: 'Pushed to cloud successfully!' })
        setTimeout(() => closeSyncModal(), 1500)
      } else {
        setSyncFeedback({ type: 'error', message: result.error ?? 'Push failed' })
      }
    } else {
      const result = await syncPull(syncPassword)
      if (result.success && Array.isArray(result.data)) {
        if (!(result.data as unknown[]).every(isValidTask)) {
          setSyncFeedback({ type: 'error', message: 'Cloud data is malformed' })
        } else {
          persist(result.data as Task[])
          setSyncFeedback({ type: 'success', message: 'Pulled from cloud successfully!' })
          setTimeout(() => closeSyncModal(), 1500)
        }
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

  return (
    <section className="tasks-page">
      <div className="tasks-header">
        <h1 className="mb-2 text-2xl font-semibold tracking-tighter">Tasks</h1>
        <div className="tasks-toolbar">
          <div className="tasks-toolbar-left">
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

          <div className="tasks-toolbar-right">
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

      {/* Edit form */}
      {editingId && (
        <div className="tasks-form-card">
          <h2 className="tasks-form-heading">Edit Task</h2>
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
            submitLabel="Save"
          />
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
                        </div>

                        {/* Actions */}
                        <div className="tasks-item-actions">
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
                            onClick={() => handleDelete(task.id)}
                            aria-label="Delete task"
                            title="Delete"
                          >
                            ✕
                          </button>
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
                </div>

                {/* Actions */}
                <div className="tasks-item-actions">
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
                    onClick={() => handleDelete(task.id)}
                    aria-label="Delete task"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
                className={`tasks-alert ${
                  syncFeedback.type === 'success'
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
