import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-muted/5">
            {/* Sidebar (Desktop) */}
            <aside className="hidden w-[240px] lg:w-[280px] flex-col border-r bg-background md:flex flex-shrink-0">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
                    <div className="mx-auto max-w-6xl w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
