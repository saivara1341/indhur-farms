import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("CRITICAL APP ERROR:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
                    <div className="max-w-md space-y-6">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-10 w-10 text-destructive" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                                Something went wrong
                            </h1>
                            <p className="text-muted-foreground">
                                We've encountered an unexpected error. Don't worry, your progress is likely safe.
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/50 p-4 text-left font-mono text-xs text-destructive overflow-auto max-h-[200px]">
                            <p className="font-bold mb-1">Error Details:</p>
                            {this.state.error?.name}: {this.state.error?.message}
                            {this.state.error?.stack && (
                                <pre className="mt-2 text-[10px] opacity-70">
                                    {this.state.error.stack.split("\n").slice(0, 3).join("\n")}
                                </pre>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button onClick={this.handleReload} size="lg" className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Reload Page
                            </Button>
                            <Button onClick={this.handleGoHome} variant="outline" size="lg" className="gap-2">
                                <Home className="h-4 w-4" />
                                Back to Home
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground pt-4">
                            If the problem persists, please contact support with the error details above.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
