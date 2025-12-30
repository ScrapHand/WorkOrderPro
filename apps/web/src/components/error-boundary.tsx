"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/10 text-center">
                    <div className="bg-background p-8 rounded-xl shadow-lg border max-w-md w-full">
                        <div className="mx-auto h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                        <p className="text-muted-foreground mb-6">
                            The application encountered an unexpected error. Our team has been notified.
                        </p>
                        <div className="space-y-2">
                            <Button
                                onClick={() => {
                                    this.setState({ hasError: false });
                                    window.location.reload();
                                }}
                                className="w-full"
                            >
                                Reload Page
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
                                <code>{this.state.error?.toString()}</code>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
