'use client' // Error components must be Client Components
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 px-4">
        <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Something went wrong!</h1>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
                We're sorry, but an unexpected error occurred. Please try again, or contact support if the problem persists.
            </p>
            <div className="mt-8 flex justify-center gap-4">
                <Button
                    onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                    }
                >
                    Try Again
                </Button>
                <Button variant="outline" asChild>
                    <a href="/">Go to Homepage</a>
                </Button>
            </div>
             <div className="mt-8 text-xs text-muted-foreground bg-secondary p-4 rounded-md max-w-xl mx-auto">
                <p className="font-semibold">Error Details:</p>
                <p className="font-mono break-words">{error.message}</p>
            </div>
        </div>
    </div>
  )
}
