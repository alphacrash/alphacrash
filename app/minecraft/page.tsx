"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

type Instance = {
    instanceId: string
    state: string
    publicIp?: string
}

const API_URL = "https://fopvgculoi.execute-api.ap-south-1.amazonaws.com"
const TEN_MINUTES = 10 * 60 * 1000

type ConfirmModalProps = {
    open: boolean
    title: string
    description: string
    confirmText: string
    confirmColor: "green" | "red"
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
}

function ConfirmModal({
    open,
    title,
    description,
    confirmText,
    confirmColor,
    loading,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl p-6">
                <h2 className="text-lg font-semibold mb-2">{title}</h2>
                <p className="text-sm text-neutral-600 mb-6">
                    {description}
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 rounded-md border text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded-md text-white disabled:opacity-50 cursor-pointer ${confirmColor === "red"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        {loading ? "Please wait…" : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function Page() {
    const [mounted, setMounted] = useState(false)

    const [instance, setInstance] = useState<Instance | null>(null)
    const [disabled, setDisabled] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastChecked, setLastChecked] = useState<number | null>(null)
    const [authKey, setAuthKey] = useState("")
    const [confirmAction, setConfirmAction] = useState<
        "start" | "stop" | null
    >(null)

    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        setMounted(true)

        try {
            const saved = localStorage.getItem("minecraftAuthKey")
            if (saved) setAuthKey(saved)
        } catch { }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    useEffect(() => {
        if (!mounted) return
        try {
            if (authKey)
                localStorage.setItem("minecraftAuthKey", authKey)
            else localStorage.removeItem("minecraftAuthKey")
        } catch { }
    }, [authKey, mounted])

    function startDisableTimer() {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            setDisabled(true)
        }, TEN_MINUTES)
    }

    async function fetchDescribe() {
        setError(null)
        if (!authKey.trim()) {
            setError("Auth key is required")
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/describe`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-auth-key": authKey.trim(),
                },
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

    async function handleAction(action: "start" | "stop") {
        setError(null)
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/${action}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-auth-key": authKey.trim(),
                },
            })

            if (!res.ok) throw new Error(`${action} failed: ${res.status}`)

            await fetchDescribe()
        } catch (err: any) {
            setError(err?.message ?? String(err))
        } finally {
            setLoading(false)
            setConfirmAction(null)
        }
    }

    const canAct =
        mounted &&
        !disabled &&
        !loading &&
        instance !== null &&
        !!authKey.trim()

    return (
        <section>
            <h1 className="mb-2 text-2xl font-semibold tracking-tighter">
                Minecraft
            </h1>

            {mounted && (
                <div className="mb-4">
                    <label className="block mb-2 text-sm text-neutral-700">
                        Auth Key
                    </label>
                    <input
                        value={authKey}
                        onChange={(e) =>
                            setAuthKey(e.target.value)
                        }
                        className="border rounded px-3 py-2 w-full max-w-sm"
                    />
                </div>
            )}

            <div className="flex items-center space-x-3 mb-4">
                <button
                    onClick={fetchDescribe}
                    disabled={
                        !mounted || loading || !authKey.trim()
                    }
                    className="rounded bg-neutral-900 text-white px-3 py-2 disabled:opacity-50"
                >
                    {loading ? "Loading…" : "Get Status"}
                </button>

                {instance ? (
                    instance.state === "running" ? (
                        <button
                            onClick={() =>
                                setConfirmAction("stop")
                            }
                            disabled={!canAct}
                            className="rounded bg-red-600 text-white px-3 py-2 disabled:opacity-50"
                        >
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={() =>
                                setConfirmAction("start")
                            }
                            disabled={!canAct}
                            className="rounded bg-green-600 text-white px-3 py-2 disabled:opacity-50"
                        >
                            Start
                        </button>
                    )
                ) : (
                    <button
                        disabled
                        className="rounded bg-neutral-200 text-neutral-700 px-3 py-2"
                    >
                        Start / Stop
                    </button>
                )}
            </div>

            {error && (
                <p className="text-red-600 mb-2">
                    Error: {error}
                </p>
            )}

            {instance && (
                <div className="mb-4">
                    <p>
                        <strong>Public IP:</strong>{" "}
                        <span className="text-2xl">
                            {instance.publicIp
                                ? `${instance.publicIp}:25565`
                                : "—"}
                        </span>
                    </p>
                    <p>
                        <strong>State:</strong>{" "}
                        {instance.state === "running"
                            ? "Running"
                            : instance.state === "stopped"
                                ? "Stopped"
                                : instance.state}
                    </p>
                </div>
            )}

            {lastChecked && (
                <p className="text-sm text-neutral-600">
                    Last checked:{" "}
                    {new Date(
                        lastChecked
                    ).toLocaleString()}
                </p>
            )}

            <p className="text-sm text-neutral-600 mb-6">
                Buttons auto-disable after 10 minutes (or on
                refresh).
            </p>

            <div className="mt-6">
                <Link
                    href="/"
                    className="text-neutral-600 hover:underline"
                >
                    ← Back
                </Link>
            </div>

            <ConfirmModal
                open={confirmAction !== null}
                title={
                    confirmAction === "stop"
                        ? "Stop Minecraft Server"
                        : "Start Minecraft Server"
                }
                description={
                    confirmAction === "stop"
                        ? "The server will shut down and players will be disconnected."
                        : "The server will start. It may take 1–2 minutes to become reachable."
                }
                confirmText={
                    confirmAction === "stop"
                        ? "Stop Server"
                        : "Start Server"
                }
                confirmColor={
                    confirmAction === "stop"
                        ? "red"
                        : "green"
                }
                loading={loading}
                onCancel={() => setConfirmAction(null)}
                onConfirm={() =>
                    handleAction(confirmAction!)
                }
            />
        </section>
    )
}