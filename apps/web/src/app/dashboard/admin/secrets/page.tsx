"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Save } from "lucide-react";

// Known integrations we want to support easily
const INTEGRATIONS = [
    { key: "STRIPE_SECRET_KEY", label: "Stripe Secret Key", placeholder: "sk_live_..." },
    { key: "STRIPE_PUBLISHABLE_KEY", label: "Stripe Publishable Key", placeholder: "pk_live_..." },
    { key: "OPENAI_API_KEY", label: "OpenAI API Key", placeholder: "sk-..." },
    { key: "AWS_ACCESS_KEY_ID", label: "AWS Access Key ID", placeholder: "AKIA..." },
    { key: "AWS_SECRET_ACCESS_KEY", label: "AWS Secret Access Key", placeholder: "..." },
    { key: "SENDGRID_API_KEY", label: "SendGrid API Key", placeholder: "SG..." },
];

export default function SecretsPage() {
    const { config, refreshConfig } = useTheme();
    const [secrets, setSecrets] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    // Track which fields are modified to only send those
    const [modified, setModified] = useState<Record<string, string>>({});

    useEffect(() => {
        if (config?.secrets) {
            setSecrets(config.secrets);
        }
    }, [config]);

    const handleChange = (key: string, value: string) => {
        setModified(prev => ({ ...prev, [key]: value }));
        // Update local display immediately
        setSecrets(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (Object.keys(modified).length === 0) {
            toast.info("No changes to save");
            return;
        }

        try {
            setLoading(true);
            await api.patch("/tenant/config", {
                secrets: modified
            });
            toast.success("Secrets updated successfully");
            setModified({});
            refreshConfig();
        } catch (error: any) {
            toast.error("Failed to update secrets: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Secrets & Integrations</h2>
                <p className="text-muted-foreground">Manage API keys and private configuration.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                        Values are encrypted at rest. Existing keys are masked.
                        Enter a new value to overwrite.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {INTEGRATIONS.map((item) => (
                        <div key={item.key} className="grid w-full items-center gap-1.5">
                            <Label htmlFor={item.key}>{item.label}</Label>
                            <div className="relative">
                                <Input
                                    id={item.key}
                                    type="password"
                                    placeholder={item.placeholder}
                                    value={secrets[item.key] || ""}
                                    onChange={(e) => handleChange(item.key, e.target.value)}
                                    className="pr-10 font-mono"
                                />
                                <div className="absolute right-3 top-2.5 text-muted-foreground">
                                    <Lock className="w-4 h-4" />
                                </div>
                            </div>
                            {modified[item.key] && (
                                <p className="text-xs text-yellow-600 font-medium">Unsaved changes</p>
                            )}
                        </div>
                    ))}

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} disabled={loading} className="min-w-[120px]">
                            {loading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Secrets</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
