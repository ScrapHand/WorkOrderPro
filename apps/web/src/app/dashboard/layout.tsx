import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            {/* Sidebar (Desktop) */}
            <div className="hidden border-r bg-muted/40 md:block fixed inset-y-0 left-0 z-10 w-[220px] lg:w-[280px]">
                <Sidebar />
            </div>

            {/* Main Area */}
            <div className="flex flex-col md:pl-[220px] lg:pl-[280px] min-h-screen">
                <Header />
                <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 bg-muted/10">
                    {children}
                </main>
            </div>
        </div>
    );
}
