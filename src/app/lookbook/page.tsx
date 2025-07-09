
'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { OutfitCard } from "@/components/OutfitCard";
import { looks, lookCategories } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, AlertCircle, Upload, Camera, X } from 'lucide-react';
import Image from 'next/image';
import { generateOutfitImage } from '@/ai/flows/generate-outfit-image';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function AiStylist() {
  const [prompt, setPrompt] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Refs for file input and webcam
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for camera controls
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
      setIsCameraOpen(false); // Close dialog if permission is denied
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const result = await generateOutfitImage({ prompt, userImageDataUri: userImage || undefined });
      setGeneratedImageUrl(result.imageUrl);
    } catch (err: any) {
      console.error(err);
      let friendlyError = err.message || 'An unknown error occurred while generating the image.';
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
            Describe an outfit and optionally provide your photo. Our AI will generate an image for you. Be descriptive!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="user-photo">Your Photo (Optional)</Label>
                    <Card className="aspect-square flex items-center justify-center p-4">
                        {userImage ? (
                            <div className="relative w-full h-full">
                                <Image src={userImage} alt="User" fill className="object-contain rounded-md" />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                    onClick={() => setUserImage(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center space-y-3">
                                <p className="text-sm text-muted-foreground">Add a photo to see the outfit on you.</p>
                                <div className="flex justify-center gap-4">
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" /> Upload
                                    </Button>
                                    <Dialog open={isCameraOpen} onOpenChange={(isOpen) => {
                                        if (isOpen) {
                                            openCamera();
                                        } else {
                                            closeCamera();
                                        }
                                        setIsCameraOpen(isOpen);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline"><Camera className="mr-2 h-4 w-4" /> Webcam</Button>
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
                        )}
                    </Card>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="prompt">Outfit Description</Label>
                    <Textarea
                        id="prompt"
                        placeholder="e.g., A model wearing a black leather jacket, white t-shirt, dark wash jeans, and brown chelsea boots, walking down a city street."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={5}
                        disabled={isLoading}
                        required
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !prompt.trim()}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : "Generate Outfit"}
                </Button>
            </div>
            <div className="relative aspect-square border border-dashed rounded-lg flex items-center justify-center bg-muted/50 p-4">
                {isLoading && (
                    <div className="space-y-2 flex flex-col items-center text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">Generating your masterpiece...</p>
                    </div>
                )}
                {!isLoading && !generatedImageUrl && !error && (
                    <p className="text-muted-foreground text-center p-4">Your generated image will appear here.</p>
                )}
                {generatedImageUrl && (
                    <Image
                        src={generatedImageUrl}
                        alt="AI generated outfit"
                        fill
                        className="object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                )}
                {error && (
                    <div className="text-destructive text-center p-4 flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8" />
                        <p className="font-semibold">Generation Failed</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </div>
        </form>
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
