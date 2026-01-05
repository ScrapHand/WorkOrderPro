import { useTheme } from "@/context/ThemeContext";

export function useTerminology() {
    const { config } = useTheme();
    const terms = config?.branding?.terminology;

    // Helper to singularize (naive but effective for English defaults)
    const singular = (plural: string | undefined, fallback: string) => {
        if (!plural) return fallback;
        if (plural.endsWith('s')) return plural.slice(0, -1);
        return plural; // If it doesn't end in s, assume it's same or irregular (inventory)
    };

    return {
        // Work Orders
        workOrders: terms?.workOrders || "Work Orders",
        workOrder: singular(terms?.workOrders, "Work Order"),

        // Assets
        assets: terms?.assets || "Assets",
        asset: singular(terms?.assets, "Asset"),

        // Inventory (Uncountable usually)
        inventory: terms?.inventory || "Inventory",

        // Technicians
        technicians: terms?.technicians || "Technicians",
        technician: singular(terms?.technicians, "Technician"),

        // Reports
        reports: terms?.reports || "Reports",
        report: singular(terms?.reports, "Report"),

        // Customers/Tenants
        customers: terms?.customers || "Customers",
        customer: singular(terms?.customers, "Customer"),
    };
}
