"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminService } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, Save } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/lib/auth/types";

export default function SecretsPage() {
    return (
        <RoleGuard allowedRoles={[UserRole.ADMIN]}>
            <SecretsContent />
        </RoleGuard>
    );
}

function SecretsContent() {
    const queryClient = useQueryClient();
    const [secrets, setSecrets] = useState({
        STRIPE_SECRET_KEY: "",
        OPENAI_API_KEY: "",
        SENDGRID_API_KEY: "",
    });
    const [visibility, setVisibility] = useState<Record<string, boolean>>({});

    const { data: config, isLoading } = useQuery({
        queryKey: ["tenantConfig"],
        queryFn: AdminService.getConfig
    });

    useEffect(() => {
        if (config?.secrets) {
            setSecrets(prev => ({
                ...prev,
                ...config.secrets
            }));
        }
    }, [config]);

    const mutation = useMutation({
        mutationFn: AdminService.updateSecrets,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenantConfig"] });
            toast.success("Secrets updated successfully");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update secrets");
        }
    });

    const handleSave = (key: string, value: string) => {
        // Only send if value is not masked (i.e. user typed something new)
        if (value.includes("****")) return;

        mutation.mutate({ [key]: value });
    };

    const toggleVisibility = (key: string) => {
        setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key: string, val: string) => {
        setSecrets(prev => ({ ...prev, [key]: val }));
    };

    if (isLoading) return <div>Loading secrets...</div>;

    const secretKeys = [
        { key: "STRIPE_SECRET_KEY", label: "Stripe Secret Key", desc: "For processing payments." },
        { key: "OPENAI_API_KEY", label: "OpenAI API Key", desc: "For AI-powered features." },
        { key: "SENDGRID_API_KEY", label: "SendGrid API Key", desc: "For sending email notifications." },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Secrets Management</h1>
                <p className="text-muted-foreground">Manage external API keys and secure credentials.</p>
            </div>

            <div className="grid gap-6">
                {secretKeys.map(({ key, label, desc }) => (
                    <Card key={key}>
                        <CardHeader>
                            <CardTitle className="text-base">{label}</CardTitle>
                            <CardDescription>{desc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type={visibility[key] ? "text" : "password"}
                                        className="pl-9 pr-10 font-mono"
                                        placeholder="sk_test_..."
                                        value={secrets[key as keyof typeof secrets] || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => toggleVisibility(key)}
                                    >
                                        {visibility[key] ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => handleSave(key, secrets[key as keyof typeof secrets])}
                                    disabled={mutation.isPending || (secrets[key as keyof typeof secrets] || "").includes("****")}
                                >
                                    <Save className="mr-2 h-4 w-4" /> Save
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2">
                                {(secrets[key as keyof typeof secrets] || "").includes("****")
                                    ? "Value is masked. Type to overwrite."
                                    : "Unsaved changes."}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
