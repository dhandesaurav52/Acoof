
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Wand2, Loader2, Sparkles, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAiSuggestions } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface Suggestion {
  description: string;
  imageUrl: string;
}

export function AiStylist() {
  const { products } = useProducts();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
            variant: "destructive",
            title: "Camera Not Supported",
            description: "Your browser does not support camera access.",
        });
        setHasCameraPermission(false);
        return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasCameraPermission(false);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please enable camera permissions in your browser settings to use this feature.",
      });
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUri = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUri);
            
            // Stop camera stream
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    getCameraPermission(); // Re-request camera to start stream again
  };

  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);

    const browsingHistory = products
      .slice(0, 3)
      .map((p) => `${p.name} (${p.category})`)
      .join(", ");

    const { suggestions: newSuggestions, error } = await getAiSuggestions(browsingHistory, capturedImage || undefined);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    } else {
      setSuggestions(newSuggestions);
    }
    setIsLoading(false);
  };

  const LoadingSkeletons = () => (
     <div className="space-y-4">
        <h3 className="text-xl font-semibold">Generating your looks...</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden bg-background">
                    <Skeleton className="aspect-[4/5] w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
  
  const CameraView = () => (
    <div className="space-y-4">
        <div className="relative aspect-video w-full max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex justify-center">
            <Button onClick={handleCapture}>
                <Camera className="mr-2 h-4 w-4" />
                Take Picture
            </Button>
        </div>
    </div>
  );

  const CapturedView = () => (
    <div className="space-y-4">
        <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden">
            {capturedImage && <Image src={capturedImage} alt="Captured user photo" layout="fill" objectFit="cover" />}
        </div>
        <div className="flex justify-center">
            <Button onClick={handleRetake} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake
            </Button>
        </div>
    </div>
  );


  return (
    <Card className="bg-secondary/50">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl">AI Personal Stylist</CardTitle>
                <CardDescription>Get outfit ideas, or use the Virtual Try-On to see them on you!</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-muted-foreground">
            Let our AI stylist create unique looks for you. We'll use a sample of your interests to generate personalized outfit recommendations. This may take up to 30 seconds.
          </p>
        </div>
        
        <Separator />

        {isClient && (
          <div className="space-y-4">
             <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold">Virtual Try-On (Beta)</h3>
                    <p className="text-muted-foreground">Take a photo and see the outfits on you!</p>
                </div>
            </div>
            
            {hasCameraPermission === null && (
                <div className="text-center">
                    <Button onClick={getCameraPermission}>Enable Camera for Try-On</Button>
                </div>
            )}

            {hasCameraPermission === false && hasCameraPermission !== null && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Camera access was denied or is unavailable. You can still generate outfits on a model. To use the try-on feature, please enable camera permissions in your browser settings.
                  </AlertDescription>
                </Alert>
            )}

            {hasCameraPermission && !capturedImage && <CameraView />}
            {hasCameraPermission && capturedImage && <CapturedView />}
          </div>
        )}

        <div className="flex justify-center">
          <Button 
            size="lg"
            onClick={handleGenerateSuggestions} 
            disabled={isLoading || (hasCameraPermission && !capturedImage)}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {capturedImage ? 'Get My AI Looks' : 'Get Style Advice'}
              </>
            )}
          </Button>
        </div>


        {isLoading && <LoadingSkeletons />}

        {!isLoading && suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">Your Personalized Lookbook:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="overflow-hidden bg-background group">
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      src={suggestion.imageUrl}
                      alt={`AI-generated look for: ${suggestion.description}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
