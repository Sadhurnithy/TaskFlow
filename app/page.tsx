"use client"

import Link from "next/link"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Command,
    Zap,
    Layout,
    Shield,
    Smartphone,
    Cpu,
    CheckCircle2,
    ArrowRight
} from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"

// --- Premium Components ---

const TrafficLights = () => (
    <div className="flex gap-2 group">
        <div className="h-3 w-3 rounded-full bg-[#FF5F57] border border-[#E0443E] shadow-sm" />
        <div className="h-3 w-3 rounded-full bg-[#FEBC2E] border border-[#D89E24] shadow-sm" />
        <div className="h-3 w-3 rounded-full bg-[#28C840] border border-[#1AAB29] shadow-sm" />
    </div>
)

const MacWindow = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`relative rounded-2xl border border-white/60 bg-white/80 backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 ${className}`}>
        <div className="h-12 border-b border-black/5 flex items-center px-5 justify-between bg-white/40 sticky top-0 z-10">
            <TrafficLights />
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-50">
                <Shield className="h-3 w-3" />
                <span className="text-[10px] font-medium tracking-wider uppercase">Secure Enclave</span>
            </div>
        </div>
        {children}
    </div>
)

// --- Main Page ---

export default function Home() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    // Parallax Values
    const yHero = useTransform(scrollYProgress, [0, 0.5], [0, 100])
    const opacityHero = useTransform(scrollYProgress, [0, 0.4], [1, 0])

    const yFeatures = useTransform(scrollYProgress, [0.1, 0.4], [50, 0])

    return (
        <div ref={containerRef} className="flex min-h-screen flex-col bg-[#FAFAFA] font-sans text-zinc-900 selection:bg-black selection:text-white overflow-x-hidden w-full">

            {/* Navbar - Floating Dock Style */}
            <header className="fixed top-4 md:top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="pointer-events-auto h-12 md:h-14 flex items-center justify-between gap-2 p-1.5 pl-4 pr-1.5 rounded-full border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg shadow-black/5 ring-1 ring-black/5 w-full max-w-sm md:max-w-2xl"
                >
                    <Link href="/" className="flex items-center gap-2 group mr-auto">
                        <div className="bg-black text-white p-1 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <Command className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-semibold tracking-tight text-sm">TaskNotes</span>
                    </Link>

                    <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2">
                        {['Features', 'Security', 'Enterprise'].map((item) => (
                            <Link key={item} href={`#${item.toLowerCase()}`} className="px-4 py-1.5 text-sm font-medium text-zinc-500 hover:text-black hover:bg-black/5 rounded-full transition-all">
                                {item}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 pl-4">
                        <Link href="/login" className="hidden sm:block px-3 py-1.5 text-xs font-medium hover:text-black text-zinc-500 hover:bg-black/5 rounded-full transition-all">Log in</Link>
                        <Link href="/login">
                            <Button size="sm" className="rounded-full bg-black text-white hover:bg-zinc-800 px-4 md:px-5 h-8 md:h-9 text-xs font-semibold shadow-md transition-all hover:scale-105">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </header>

            <main className="flex-1 w-full pt-28 md:pt-32">

                {/* --- Hero Section --- */}
                <section className="relative px-4 pb-16 md:pb-24 pt-8 md:pt-12 overflow-hidden">
                    {/* Ambient Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[500px] bg-gradient-to-b from-blue-50/80 to-purple-50/80 blur-3xl opacity-60 -z-10 rounded-full mix-blend-multiply" />

                    <motion.div
                        style={{ y: yHero, opacity: opacityHero }}
                        className="container mx-auto text-center max-w-4xl"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Badge variant="secondary" className="mb-6 md:mb-8 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase border border-zinc-200 bg-white/60 backdrop-blur-md text-zinc-500 shadow-sm">
                                v2.0 Release
                            </Badge>
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-zinc-900 mb-6 md:mb-8 leading-[1.1]">
                            Organize your work.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-zinc-400 to-zinc-200">Clear your mind.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-zinc-500 max-w-xl mx-auto mb-8 md:mb-10 leading-relaxed font-light px-4">
                            The workspace for high-performance teams.
                            Manage projects, write documentation, and track goals in one unified system.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4">
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto rounded-full h-12 md:h-14 px-8 text-base md:text-lg bg-black text-white hover:bg-zinc-800 shadow-2xl hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-1">
                                    Start Building Free
                                </Button>
                            </Link>
                            <Link href="#features" className="w-full sm:w-auto">
                                <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-full h-12 md:h-14 px-8 text-sm md:text-base text-zinc-600 hover:bg-zinc-100">
                                    See how it works <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </section>

                {/* --- Parallax Showcase Window --- */}
                <section className="container mx-auto px-4 -mt-4 md:-mt-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 50, rotateX: 10 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="perspective-1000"
                    >
                        <MacWindow className="max-w-6xl mx-auto min-h-[400px] md:min-h-[600px] bg-white">
                            <div className="grid grid-cols-12 h-full">
                                {/* Sidebar */}
                                <div className="col-span-3 border-r border-zinc-100 bg-[#FAFAFA] p-6 flex flex-col gap-8 hidden md:flex">
                                    <div>
                                        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 pl-2">My Workspace</h3>
                                        <div className="space-y-1">
                                            {['Inbox', 'Today', 'Upcoming', 'Filters'].map(i => (
                                                <div key={i} className="px-3 py-1.5 rounded-md text-sm text-zinc-600 hover:bg-zinc-200/50 cursor-pointer font-medium transition-colors">
                                                    {i}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 pl-2">Projects</h3>
                                        <div className="space-y-1">
                                            {['Q4 Marketing', 'IOS Redesign', 'Hiring'].map((i, idx) => (
                                                <div key={i} className={`px-3 py-1.5 rounded-md text-sm cursor-pointer font-medium transition-colors flex items-center gap-2 ${idx === 0 ? 'bg-white shadow-sm ring-1 ring-black/5 text-black' : 'text-zinc-600 hover:bg-zinc-200/50'}`}>
                                                    <div className={`h-2 w-2 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-zinc-300'}`} />
                                                    {i}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="col-span-12 md:col-span-9 p-6 md:p-12 relative overflow-hidden bg-white">
                                    <div className="max-w-3xl mx-auto">
                                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
                                            <span>Projects</span>
                                            <span>/</span>
                                            <span>Q4 Marketing</span>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-6 md:mb-8">Launch Campaign</h2>

                                        <div className="space-y-3 md:space-y-4">
                                            {['Finalize ad creative', 'Review analytics setup', 'Coordinate with influencers', 'Draft blog post announcements'].map((task, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:shadow-sm bg-white transition-all cursor-pointer"
                                                >
                                                    <div className="h-5 w-5 rounded-full border-2 border-zinc-200 group-hover:border-blue-500 flex items-center justify-center transition-colors flex-shrink-0">
                                                        <CheckCircle2 className="h-3 w-3 text-white group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                                    </div>
                                                    <span className="text-zinc-700 font-medium text-sm md:text-base">{task}</span>
                                                    <div className="ml-auto w-8 h-8 rounded-full border border-dashed border-zinc-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                                                        <div className="h-4 w-4 rounded-full bg-zinc-200" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </MacWindow>
                    </motion.div>
                </section>

                {/* --- Bento Grid Features --- */}
                <section id="features" className="container mx-auto px-6 py-24 md:py-32">
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-center text-xs font-bold text-zinc-400 uppercase tracking-widest mb-16"
                    >
                        Powerstation
                    </motion.p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-6xl mx-auto">
                        {/* Card 1: Powerstation */}
                        <motion.div
                            style={{ y: yFeatures }}
                            className="col-span-1 min-h-[400px] md:min-h-[500px] rounded-3xl bg-[#F4F5F7] relative overflow-hidden group border border-black/[0.02]"
                        >
                            <div className="absolute inset-x-8 md:inset-x-10 top-8 md:top-10 z-10">
                                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 ring-1 ring-black/5">
                                    <Layout className="h-5 w-5 text-zinc-900" />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-3 text-zinc-900">Multiple Views.</h3>
                                <p className="text-zinc-500 max-w-md text-sm md:text-lg">Kanban, List, Calendar. Your data adapts to how you work best.</p>
                            </div>

                            <div className="absolute inset-0 pt-48 md:pt-56 px-6 md:px-10 pb-0">
                                <div className="bg-white rounded-t-2xl shadow-xl border border-black/5 h-full p-6 space-y-4">
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-2 w-2 rounded-full bg-red-400" />
                                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                                        <div className="h-2 w-2 rounded-full bg-green-400" />
                                    </div>
                                    <div className="space-y-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-10 md:h-12 w-full bg-zinc-50 rounded-lg border border-zinc-100" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 2: Collaboration (Now White) */}
                        <div className="col-span-1 min-h-[400px] md:min-h-[500px] rounded-3xl bg-[#F4F5F7] text-zinc-900 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group border border-black/[0.02]">
                            <div className="relative z-10">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm ring-1 ring-black/5">
                                    <div className="flex -space-x-2">
                                        <div className="h-4 w-4 rounded-full bg-blue-400 ring-2 ring-white" />
                                        <div className="h-4 w-4 rounded-full bg-green-400 ring-2 ring-white" />
                                    </div>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-3">Built for Teams.</h3>
                                <p className="text-zinc-500 text-sm md:text-lg">Real-time collaboration. See who's viewing and typing.</p>
                            </div>

                            <div className="relative mt-8 h-48 md:h-64 w-full">
                                {/* Chat/Collab Mockup - Light Theme */}
                                <div className="absolute left-4 right-4 top-0 bottom-0 bg-white rounded-t-2xl border border-black/5 shadow-xl p-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex-shrink-0" />
                                        <div className="bg-zinc-100 rounded-2xl rounded-tl-none p-3 text-xs md:text-sm text-zinc-600">
                                            Can we update the Q4 goals?
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 flex-row-reverse">
                                        <div className="h-8 w-8 rounded-full bg-green-100 border border-green-200 flex-shrink-0" />
                                        <div className="bg-black rounded-2xl rounded-tr-none p-3 text-xs md:text-sm text-white">
                                            On it! Just pushed the changes.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Footer CTA --- */}
                <section className="py-32 text-center bg-white relative overflow-hidden border-t border-zinc-100">
                    <div className="container mx-auto px-6 relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-8 text-zinc-900">
                            Ready to focus?
                        </h2>
                        <p className="text-xl text-zinc-500 mb-12 max-w-xl mx-auto">
                            Join thousands of teams building their future with TaskNotes.
                        </p>
                        <Link href="/login">
                            <Button size="lg" className="h-14 px-10 rounded-full text-lg bg-black text-white hover:bg-zinc-800 transition-all shadow-xl hover:scale-105">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-zinc-100 py-12 px-6">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-zinc-400 font-medium">
                    <p>&copy; 2024 TaskNotes Inc. Designed by Sadhur.</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <Link href="https://github.com" className="hover:text-black transition-colors">Github</Link>
                        <Link href="https://linkedin.com" className="hover:text-black transition-colors">LinkedIn</Link>
                        <Link href="#" className="hover:text-black transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-black transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}