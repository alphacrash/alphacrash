"use client"

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Instance = {
    instanceId: string
    state: string
    publicIp?: string
}

const API_URL = "https://fopvgculoi.execute-api.ap-south-1.amazonaws.com"
const TEN_MINUTES = 10 * 60 * 1000

export default function Page() {
    const [instance, setInstance] = useState<Instance | null>(null)
    const [disabled, setDisabled] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastChecked, setLastChecked] = useState<number | null>(null)
    const [authKey, setAuthKey] = useState<string>('')
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        // load saved auth key (if any)
        try {
            const saved = localStorage.getItem('minecraftAuthKey')
            if (saved) setAuthKey(saved)
        } catch (e) { }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    useEffect(() => {
        // persist auth key
        try {
            if (authKey) localStorage.setItem('minecraftAuthKey', authKey)
            else localStorage.removeItem('minecraftAuthKey')
        } catch (e) { }
    }, [authKey])

    function startDisableTimer() {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            setDisabled(true)
        }, TEN_MINUTES)
    }

    async function fetchDescribe() {
        setError(null)
        if (!authKey?.trim()) {
            setError('Auth key is required')
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/describe`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'x-auth-key': authKey.trim() },
            })
            if (!res.ok) throw new Error(`Describe failed: ${res.status}`)
            const data: Instance = await res.json()
            setInstance(data)
            setDisabled(false)
            setLastChecked(Date.now())
            startDisableTimer()
        } catch (err: any) {
            setError(err?.message ?? String(err))
        } finally {
            setLoading(false)
        }
    }

    async function handleAction(action: 'start' | 'stop') {
        setError(null)
        if (!authKey?.trim()) {
            setError('Auth key is required')
            return
        }
        const confirmed = confirm(`Are you sure you want to ${action} the instance?`)
        if (!confirmed) return
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-key': authKey.trim() },
            })
            if (!res.ok) throw new Error(`${action} failed: ${res.status}`)
            // After action, refresh status
            await fetchDescribe()
        } catch (err: any) {
            setError(err?.message ?? String(err))
            setLoading(false)
        }
    }

    const canAct = !disabled && !loading && instance !== null && !!authKey?.trim()

    return (
        <section>
            <h1 className="mb-2 text-2xl font-semibold tracking-tighter">Minecraft</h1>

            <div className="mb-4">
                <label className="block mb-2 text-sm text-neutral-700">Auth Key</label>
                <input
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    placeholder="x-auth-key"
                    className="border rounded px-3 py-2 w-full max-w-sm"
                    aria-label="Auth Key for API requests"
                />
            </div>

            <div className="flex flex-row items-center space-x-3 mb-4">
                <button
                    onClick={fetchDescribe}
                    className="rounded bg-neutral-900 text-white px-3 py-2 disabled:opacity-50"
                    disabled={loading || !authKey?.trim()}
                >
                    {loading ? 'Loading…' : 'Get Status'}
                </button>

                {instance ? (
                    instance.state === 'running' ? (
                        <button
                            onClick={() => handleAction('stop')}
                            className="rounded bg-red-600 text-white px-3 py-2 disabled:opacity-50"
                            disabled={!canAct}
                        >
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('start')}
                            className="rounded bg-green-600 text-white px-3 py-2 disabled:opacity-50"
                            disabled={!canAct}
                        >
                            Start
                        </button>
                    )
                ) : (
                    <button
                        className="rounded bg-neutral-200 text-neutral-700 px-3 py-2"
                        disabled
                    >
                        Start / Stop
                    </button>
                )}
            </div>

            {error && <p className="text-red-600 mb-2">Error: {error}</p>}

            {instance && (
                <div className="mb-4">
                    <p><strong>Public IP:</strong> <span style={{ fontSize: '24px' }}>{instance.publicIp ?? '—'}</span></p>
                    <p><strong>State:</strong> {instance.state === 'running' ? 'Running' : instance.state === 'stopped' ? 'Stopped' : instance.state}</p>
                </div>
            )}

            {lastChecked && (
                <p className="text-sm text-neutral-600">Last checked: {new Date(lastChecked).toLocaleString()}</p>
            )}
            <p className="text-sm text-neutral-600 mb-6">Buttons auto-disable after 10 minutes (or on refresh).</p>

            <div className="mt-6">
                <Link href="/" className="text-neutral-600 hover:underline">← Back</Link>
            </div>
        </section>
    )
}
