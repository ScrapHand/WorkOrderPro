"use client";

import { NewWorkOrderWizard } from "@/components/work-orders/NewWorkOrderWizard";

export default function NewWorkOrderPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Create Work Order</h1>
            <NewWorkOrderWizard />
        </div>
    );
}
