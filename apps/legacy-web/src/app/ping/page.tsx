"use client";
import { useState } from "react";
// Legacy app might use different API util, but let's try standard fetch first for 'Direct'
// and 'Proxy' if configured. 
// Legacy app likely doesn't have the same @/lib/api.ts setup or uses axios directly.
// We'll stick to pure fetch for this diagnostic page to be dependency-free.

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
                // Legacy Web Proxy Test
                // Assuming legacy web uses Next.js rewrites? Or maybe it doesn't?
                // If legacy web talks to backend directly in client components, Proxy might fail if not configured.
                // We'll try hitting the relative path.
                res = await fetch("/api/v1/");
                if (!res.ok) throw new Error(`HTTP ${res.status} (Proxy)`);
                const json = await res.json();
                setData(json);
            } else {
                // Direct fetch to Render (bypass proxy)
                const response = await fetch("https://workorderpro-backend.onrender.com/api/v1/");
                if (!response.ok) throw new Error(`HTTP ${response.status} (Direct)`);
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
        <div className="p-10 font-mono max-w-2xl mx-auto space-y-6 bg-white text-black">
            <h1 className="text-xl font-bold">Legacy Web - Connectivity Smoke Test</h1>

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

            <div className="p-4 bg-gray-100 border rounded-lg">
                <p className="font-bold">Mode: {mode}</p>
                <p>Status: <strong>{status}</strong></p>
                <pre className="mt-2 text-xs overflow-auto max-h-60 bg-gray-900 text-green-400 p-2 rounded">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>

            <div className="text-sm text-gray-600 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p><strong>Diagnosis Guide:</strong></p>
                <ul className="list-disc ml-5">
                    <li>If <strong>Proxy</strong> works: Next.js Rewrite is good.</li>
                    <li>If <strong>Direct</strong> works but Proxy fails: Frontend Config issue.</li>
                    <li>If <strong>Direct</strong> fails (CORS): Backend Main.py needs Vercel Origin.</li>
                </ul>
            </div>
        </div>
    );
}
