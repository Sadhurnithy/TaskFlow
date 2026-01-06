"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Command, Shield, AlertCircle } from 'lucide-react'

// Mac Traffic Light Component
const TrafficLights = () => (
    <div className="flex gap-2 group">
        <div className="h-3 w-3 rounded-full bg-[#FF5F57] border border-[#E0443E] shadow-sm" />
        <div className="h-3 w-3 rounded-full bg-[#FEBC2E] border border-[#D89E24] shadow-sm" />
        <div className="h-3 w-3 rounded-full bg-[#28C840] border border-[#1AAB29] shadow-sm" />
    </div>
)

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await signIn('email', {
                email,
                callbackUrl: '/dashboard',
                redirect: false,
            })

            if (result?.error) {
                toast.error("Invalid email or login failed.")
            } else {
                toast.success("Check your email for the magic link.")
            }
        } catch (err) {
            toast.error("Something went wrong.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl: '/dashboard' })
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Back Button */}
            <div>
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-black transition-colors mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to home
                </Link>
            </div>

            {/* Mac Login Window */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 w-full max-w-md mx-auto">

                {/* Window Header */}
                <div className="h-12 border-b border-black/5 flex items-center px-4 md:px-5 justify-between bg-white/50">
                    <TrafficLights />
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Shield className="h-3 w-3" /> <span className="hidden xs:inline">Secure Login</span>
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Window Content */}
                <div className="p-6 md:p-10">

                    <div className="text-center mb-8 md:mb-10">
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-black text-white rounded-xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-black/20">
                            <Command className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Welcome back</h1>
                        <p className="text-zinc-500 mt-2 text-xs md:text-sm">Enter your credentials to access your workspace.</p>
                    </div>

                    {error === 'SessionExpired' && (
                        <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Your session has expired. Please log in again.
                        </div>
                    )}

                    <div className="space-y-6">
                        <Button
                            onClick={handleGoogleLogin}
                            variant="outline"
                            className="w-full h-11 rounded-lg border-zinc-200 bg-white hover:bg-zinc-50 font-medium text-zinc-700 shadow-sm text-sm"
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-zinc-400">Or continue with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 rounded-lg border-zinc-200 bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                            <Button
                                disabled={loading}
                                type="submit"
                                className="w-full h-11 rounded-lg bg-black text-white hover:bg-zinc-800 shadow-lg font-medium tracking-wide transition-transform active:scale-[0.98]"
                            >
                                {loading ? "Sending link..." : "Sign in with Email"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="text-center">
                <p className="text-xs text-zinc-400">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
        </div>
    )
}
