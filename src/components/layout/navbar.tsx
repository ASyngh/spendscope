import Link from "next/link";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 flex h-14 max-w-screen-2xl items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold text-xl tracking-tight">SpendScope<span className="text-primary">.</span></span>
                    </Link>
                </div>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/audit" className="transition-colors hover:text-primary">
                        Run Audit
                    </Link>
                    <Link
                        href="/audit"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-semibold transition-colors"
                    >
                        Start Free
                    </Link>
                </nav>
            </div>
        </header>
    );
}
