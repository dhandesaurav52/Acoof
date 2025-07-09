
'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { OutfitCard } from "@/components/OutfitCard";
import { looks, lookCategories } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, AlertCircle, Upload, Camera, X } from 'lucide-react';
import Image from 'next/image';
import { generateOutfitImage } from '@/ai/flows/generate-outfit-image';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function AiStylist() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setUserImage(dataUri);
      }
      closeCamera();
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  const handleSubmit = async () => {
    if (!userImage) {
        toast({
            variant: 'destructive',
            title: 'No Selfie Provided',
            description: 'Please upload or take a selfie to generate your new looks.',
        });
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrls(null);

    try {
      const result = await generateOutfitImage({ userImageDataUri: userImage });
      setGeneratedImageUrls(result.imageUrls);
    } catch (err: any) {
      console.error(err);
      let friendlyError = err.message || 'An unknown error occurred while generating the images.';
      if (friendlyError.includes('API key not valid')) {
        friendlyError = 'The provided API key is not valid. Please check your .env file.';
      } else if (friendlyError.includes('feature is not configured')) {
        friendlyError = 'The AI feature is not configured on the server. The GOOGLE_API_KEY may be missing.';
      }
      setError(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-16">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <Wand2 className="h-8 w-8 text-primary" />
            AI Stylist
        </CardTitle>
        <CardDescription>
            Use your photo to generate three different stylish outfits, powered by AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* LEFT SIDE - INPUT & ACTION */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-base font-semibold">1. Your Photo</Label>
                    <p className="text-sm text-muted-foreground">Provide a clear, full-body photo for the best results.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-32 h-40 rounded-lg border-2 border-dashed flex-shrink-0 flex items-center justify-center bg-muted/50 overflow-hidden">
                        {userImage ? (
                            <>
                                <Image src={userImage} alt="User selfie" fill className="object-cover" />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-7 w-7 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                                    onClick={() => setUserImage(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <Camera className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                         <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Upload Photo
                        </Button>
                        <Dialog open={isCameraOpen} onOpenChange={(isOpen) => {
                            if (isOpen) { openCamera(); } else { closeCamera(); }
                            setIsCameraOpen(isOpen);
                        }}>
                            <DialogTrigger asChild>
                                <Button type="button"><Camera className="mr-2 h-4 w-4" /> Take Selfie</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Webcam</DialogTitle>
                                    <DialogDescription>Position yourself and capture your photo.</DialogDescription>
                                </DialogHeader>
                                <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                                    {hasCameraPermission === false && (
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            <Alert variant="destructive">
                                                <AlertTitle>Camera Access Denied</AlertTitle>
                                                <AlertDescription>
                                                    Please enable camera permissions to use this feature.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}
                                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                </div>
                                <DialogFooter>
                                    <Button onClick={capturePhoto} disabled={!hasCameraPermission}>Take Photo</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
                <canvas ref={canvasRef} className="hidden" />

                <div className="space-y-2">
                     <Label className="text-base font-semibold">2. Generate Outfits</Label>
                     <Button onClick={handleSubmit} className="w-full" disabled={isLoading || !userImage}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : "Generate My 3 Looks"}
                    </Button>
                </div>
            </div>

            {/* RIGHT SIDE - OUTPUT */}
            <div className="space-y-2">
                <Label className="text-base font-semibold">3. Your New Styles</Label>
                <div className="relative aspect-[16/10] border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 p-2">
                     {isLoading && (
                        <div className="space-y-2 flex flex-col items-center text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Generating your masterpieces...</p>
                            <p className="text-xs text-muted-foreground">This can take up to 30 seconds.</p>
                        </div>
                    )}
                    {!isLoading && !generatedImageUrls && !error && (
                        <p className="text-muted-foreground text-center p-4">Your three generated outfits will appear here.</p>
                    )}
                    {generatedImageUrls && (
                        <div className="grid grid-cols-3 gap-2 w-full h-full">
                            {generatedImageUrls.map((url, index) => (
                                <div key={index} className="relative w-full h-full rounded-md overflow-hidden bg-black">
                                    <Image
                                        src={url}
                                        alt={`AI generated outfit ${index + 1}`}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 15vw"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    {error && (
                        <div className="text-destructive text-center p-4 flex flex-col items-center gap-2">
                            <AlertCircle className="h-8 w-8" />
                            <p className="font-semibold">Generation Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function LookbookPage() {
  const looksByCategory = lookCategories.map(category => ({
    category,
    looks: looks.filter(look => look.category === category)
  })).filter(group => group.looks.length > 0);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">The Lookbook</h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Use our AI Stylist to visualize your perfect outfit, or get inspired by our curated looks below.
        </p>
      </div>
      
      <AiStylist />

      <div className="space-y-16">
        <section>
          <div className="space-y-12">
            {looksByCategory.map(({ category, looks }) => (
              <div key={category}>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline mb-8 text-center">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {looks.map((look) => (
                    <OutfitCard key={look.id} look={look} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
