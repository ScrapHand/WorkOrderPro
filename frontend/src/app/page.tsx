import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Work Order Pro</h1>
      <p className="mb-8 text-xl">The Multi-Tenant SaaS CMMS</p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/acme/login"
          className="rounded-lg bg-teal-600 px-8 py-3 hover:bg-teal-500 transition text-center min-w-[200px]"
        >
          Demo Tenant: Acme
        </Link>
        <Link
          href="/globex/login"
          className="rounded-lg bg-blue-600 px-8 py-3 hover:bg-blue-500 transition text-center min-w-[200px]"
        >
          Demo Tenant: Globex
        </Link>
      </div>

      <div className="mt-12 text-slate-400">
        <p>This is a scaffold. Frontend is ready. Backend API available at localhost:8000.</p>
      </div>
    </main>
  );
}
