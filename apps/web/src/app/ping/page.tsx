"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function PingPage() {
    const [status, setStatus] = useState("Idle");
    const [data, setData] = useState<any>(null);
    const [mode, setMode] = useState<"PROXY" | "DIRECT">("PROXY");

    const checkConnection = async () => {
        setStatus(`Checking via ${mode}...`);
        setData(null);
        try {
            let res;
            if (mode === "PROXY") {
                // Use the axios instance which uses the proxy /api/v1
                res = await api.get("/"); // Hits /api/v1/ (Welcome message)
                setData(res.data);
            } else {
                // Direct fetch to Render (bypass proxy)
                const response = await fetch("https://workorderpro-backend.onrender.com/api/v1/");
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const json = await response.json();
                setData(json);
            }
            setStatus("Success! Backend is reachable.");
        } catch (err: any) {
            console.error(err);
            setStatus(`Failed: ${err.message || "Unknown Error"}`);
            setData({ error: err.message, stack: err.stack });
        }
    };

    return (
        <div className="p-10 font-mono max-w-2xl mx-auto space-y-6">
            <h1 className="text-xl font-bold">Connectivity Smoke Test</h1>

            <div className="flex gap-4">
                <button
                    onClick={() => { setMode("PROXY"); checkConnection(); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Ping API Proxy (/api/v1)
                </button>
                <button
                    onClick={() => { setMode("DIRECT"); checkConnection(); }}
                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                    Ping Direct (Render)
                </button>
            </div>

            <div className="p-4 bg-muted border rounded-lg">
                <p className="font-bold">Mode: {mode}</p>
                <p>Status: <strong>{status}</strong></p>
                <pre className="mt-2 text-xs overflow-auto max-h-60 bg-slate-900 text-slate-50 p-2 rounded">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>

            <div className="text-sm text-muted-foreground p-4 bg-yellow-50/50 border border-yellow-200 rounded">
                <p><strong>Diagnosis Guide:</strong></p>
                <ul className="list-disc ml-5">
                    <li>If <strong>Proxy</strong> works: Next.js Rewrite is good. Auth Cookies should work.</li>
                    <li>If <strong>Direct</strong> works but Proxy fails: Next.js Config is broken.</li>
                    <li>If <strong>Direct</strong> fails (CORS): Backend Main.py needs the Vercel Origin.</li>
                </ul>
            </div>
        </div>
    );
}
