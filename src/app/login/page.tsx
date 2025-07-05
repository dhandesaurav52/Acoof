
"use client";

import Link from "next/link"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/Logo"
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AuthBackground } from "@/components/AuthBackground";

const ADMIN_EMAIL = "admin@example.com";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await loginWithEmail(email, password);
      if (userCredential?.user) {
        if (userCredential.user.email === ADMIN_EMAIL) {
            router.push('/dashboard/admin');
        } else {
            router.push('/dashboard/user');
        }
      }
    } catch (error: any) {
        let errorMessage = 'An unknown error occurred.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: errorMessage,
        });
    }
  };

  const handleGoogleLogin = async () => {
    try {
        const userCredential = await loginWithGoogle();
        if (userCredential?.user) {
            if (userCredential.user.email === ADMIN_EMAIL) {
                router.push('/dashboard/admin');
            } else {
                router.push('/dashboard/user');
            }
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: "Google Login Failed",
            description: error.message,
        });
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-auth-background py-12 overflow-hidden">
      <AuthBackground />
      <Card className="relative z-10 mx-auto max-w-sm w-full bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
            <Logo className="w-32 h-32 mx-auto" />
            <CardTitle className="text-2xl font-headline">Login</CardTitle>
            <CardDescription>
                Enter your email below to login to your account
            </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full" type="button" onClick={handleGoogleLogin}>
              Login with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
