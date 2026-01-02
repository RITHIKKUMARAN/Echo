'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Book, MessageCircle, Video, Users, History, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const studentLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Notebook', href: '/dashboard/notebook', icon: Book },
    { name: 'Doubt Forum', href: '/dashboard/forum', icon: MessageCircle },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Video },
    { name: 'Peer Connect', href: '/dashboard/connect', icon: Users },
    { name: 'Study History', href: '/dashboard/history', icon: History },
];

const professorLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Notebook', href: '/dashboard/notebook', icon: Book },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Video },
    { name: 'Peer Connect', href: '/dashboard/connect', icon: Users },
    { name: 'Professor View', href: '/dashboard/professor', icon: GraduationCap },
];

export default function Navigation() {
    const pathname = usePathname();
    const { user, isProfessor } = useAuth();

    // Show different links based on role
    const links = isProfessor ? professorLinks : studentLinks;

    return (
        <nav className="h-screen w-20 hover:w-64 transition-all duration-500 ease-out group fixed left-0 top-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-xl border-r border-white/10">
            {/* Logo / Brand */}
            <div className="h-20 flex items-center justify-center border-b border-white/5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                    E
                </div>
                <span className="ml-3 font-bold text-xl text-white opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden translate-x-4 group-hover:translate-x-0">
                    Echo
                </span>
            </div>

            {/* Links */}
            <div className="flex-1 py-8 flex flex-col gap-2 px-3">
                {links.map(link => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center p-3 rounded-xl transition-all duration-300 relative overflow-hidden group/item",
                                isActive ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className={cn("w-6 h-6 min-w-[24px] transition-colors", isActive ? "text-blue-400" : "group-hover/item:text-blue-300")} />
                            <span className="ml-3 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap translate-x-4 group-hover:translate-x-0 delay-75">
                                {link.name}
                            </span>
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                        </Link>
                    )
                })}
            </div>

            {/* Footer / Profile */}
            <div className="p-4 border-t border-white/5">
                <Link href="/dashboard/settings" className="flex items-center overflow-hidden p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex-shrink-0 border border-white/20 flex items-center justify-center text-white text-xs font-bold">
                        {isProfessor ? 'P' : (user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U')}
                    </div>
                    <div className="ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                        <p className="text-sm font-medium text-white">
                            {isProfessor ? 'Professor' : (user?.displayName || user?.email?.split('@')[0] || 'User')}
                        </p>
                        <p className="text-xs text-slate-400">
                            {isProfessor ? 'professor@gmail.com' : (user?.email || 'student@echo.edu')}
                        </p>
                    </div>
                </Link>
            </div>
        </nav>
    )
}
