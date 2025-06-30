
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

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin@12345";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, signupWithEmail } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Special handling for the admin user to auto-create the account on first login.
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        try {
          // On first login, this will create and sign in the admin user.
          await signupWithEmail(email, password, "Admin", "User");
          // A successful signup automatically signs the user in.
          router.push('/dashboard/admin');
          return; // Exit after successful signup and redirect.
        } catch (error: any) {
          // If the admin user already exists, this will fail.
          // We can safely ignore the "email-already-in-use" error and proceed to a normal login.
          if (error.code !== 'auth/email-already-in-use') {
            // For any other signup error, we should show it and stop.
            toast({
              variant: 'destructive',
              title: "Admin Account Creation Failed",
              description: error.message,
            });
            console.error('Admin signup failed:', error);
            return;
          }
          // If error is 'auth/email-already-in-use', we fall through to the login logic below.
        }
      }

      // Proceed with normal login for all other users, or for the admin on subsequent logins.
      const userCredential = await loginWithEmail(email, password);
      if (userCredential.user.email === ADMIN_EMAIL) {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/user');
      }
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else {
        errorMessage = error.message;
      }
      toast({
        variant: 'destructive',
        title: "Login Failed",
        description: errorMessage,
      });
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
        const userCredential = await loginWithGoogle();
        if (userCredential?.user.email === ADMIN_EMAIL) {
            router.push('/dashboard/admin');
        } else {
            router.push('/dashboard/user');
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: "Google Login Failed",
            description: error.message,
        });
        console.error('Google login failed:', error);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-12">
      <Card className="mx-auto max-w-sm w-full bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
            <Logo className="w-32 h-auto mx-auto" />
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
