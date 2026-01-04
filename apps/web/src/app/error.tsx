"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/10 text-center">
            <div className="bg-background p-8 rounded-xl shadow-lg border max-w-md w-full">
                <div className="mx-auto h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-2">Application Error</h2>
                <p className="text-muted-foreground mb-6">
                    An unexpected error occurred.
                </p>
                <div className="space-y-2">
                    <Button
                        onClick={() => reset()}
                        className="w-full"
                    >
                        Try Again
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = "/dashboard"}
                        className="w-full"
                    >
                        Go to Dashboard
                    </Button>
                </div>
                {process.env.NODE_ENV === "development" && (
                    <div className="mt-6 text-left p-4 bg-slate-950 text-slate-50 rounded-md text-xs overflow-auto max-h-40">
                        <code>{error.toString()}</code>
                    </div>
                )}
            </div>
        </div>
    );
}
