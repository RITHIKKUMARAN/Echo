import Navigation from '@/components/Platform/Navigation';
import AIBot from '@/components/Platform/AIBot';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 ml-20 transition-all duration-300 relative z-10 p-8">
                {children}
            </main>
            <AIBot />
        </div>
    );
}
