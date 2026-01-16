import { redirect } from "next/navigation";

export default function AdminPage({ params }: { params: { tenantSlug: string } }) {
    // Redirect /admin to /admin/company as a default dashboard
    redirect(`/${params.tenantSlug}/dashboard/admin/company`);
}
