
'use client';

import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Camera, RefreshCw, Sparkles, AlertTriangle, UploadCloud } from 'lucide-react';
import { generateOutfitImages } from '@/ai/flows/generate-outfit-image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export function AiStylist() {
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('none');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
            variant: 'destructive',
            title: 'File Too Large',
            description: 'Please upload an image smaller than 4MB.',
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      setPhotoDataUri(dataUri);
    };
    reader.readAsDataURL(file);
  };
  
  const handleGenerate = useCallback(async () => {
    if (!photoDataUri) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    try {
      const result = await generateOutfitImages({
        photoDataUri,
        height,
        bodyType: bodyType === 'none' ? '' : bodyType,
      });
      if (result.images.length < 3) {
        setError("The AI was unable to generate all outfits. This can happen if the photo is unclear or triggers a safety filter. Please try again with a different photo.");
        setGeneratedImages(result.images);
      } else {
        setGeneratedImages(result.images);
      }
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      let errorMessage = "The AI failed to generate outfits. Please try again.";
      if (err.message?.includes('429')) {
        errorMessage = "The service is busy. Please wait a moment and try again.";
      } else if (err.message?.includes('key')) {
        errorMessage = "The AI service is not configured correctly. Please check the API key.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [photoDataUri, height, bodyType]);

  const handleNewPhoto = () => {
    setPhotoDataUri(null);
    setGeneratedImages([]);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  // Effect to automatically start generation after a photo is uploaded
  useEffect(() => {
    if (photoDataUri && generatedImages.length === 0 && !isLoading && !error) {
      handleGenerate();
    }
  }, [photoDataUri, generatedImages.length, isLoading, error, handleGenerate]);
  
  return (
     <div className="max-w-7xl mx-auto mb-20">
        {photoDataUri ? (
            <div className="flex flex-col items-center gap-8">
                <div className="w-full max-w-sm space-y-4">
                    <h3 className="text-xl font-bold font-headline text-center">Your Photo</h3>
                    <Card className="overflow-hidden">
                        <div className="relative aspect-[4/5] w-full">
                            <Image src={photoDataUri} alt="Your uploaded photo" fill className="object-cover" sizes="(max-width: 640px) 100vw, 448px" />
                        </div>
                    </Card>
                    <div className="flex gap-2">
                        <Button onClick={handleNewPhoto} variant="outline" size="sm" className="w-full">
                            <Camera className="mr-2 h-4 w-4" /> Upload New
                        </Button>
                        <Button onClick={handleGenerate} disabled={isLoading} size="sm" className="w-full">
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? 'Generating...' : 'Regenerate'}
                        </Button>
                    </div>
                </div>
                
                <Separator className="my-4" />

                <div className="w-full">
                    <h3 className="text-xl font-bold font-headline text-center mb-6">AI-Styled Outfits</h3>
                    {error ? (
                        <div className="max-w-2xl mx-auto">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Generation Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {isLoading || (photoDataUri && generatedImages.length === 0) ? (
                                <>
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <Card key={index} className="overflow-hidden">
                                            <div className="relative aspect-[4/5] w-full bg-muted animate-pulse flex items-center justify-center">
                                                <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                        </Card>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {generatedImages.map((src, index) => (
                                        <Card key={index} className="overflow-hidden group">
                                            <div className="relative aspect-[4/5] w-full bg-muted">
                                                <Image
                                                    src={src}
                                                    alt={`Generated Outfit ${index + 1}`}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    sizes="(max-width: 639px) 100vw, (max-width: 768px) 50vw, 33vw"
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="max-w-md mx-auto">
                <Card>
                    <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                            <div 
                                className="relative w-full aspect-[4/3] rounded-md border-2 border-dashed border-muted flex items-center justify-center text-center p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <UploadCloud className="h-10 w-10" />
                                    <h3 className="text-lg font-bold font-headline text-foreground">Upload a Photo</h3>
                                    <p className="text-sm">Click here or drag and drop a file.</p>
                                    <p className="text-xs">PNG, JPG, or WEBP up to 4MB.</p>
                                </div>
                                <Input 
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <Label htmlFor="height" className="text-sm">Height (Optional)</Label>
                                    <Input id="height" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 5'10&quot;" />
                                </div>
                                <div>
                                    <Label htmlFor="bodyType" className="text-sm">Body Type (Optional)</Label>
                                    <Select value={bodyType} onValueChange={setBodyType}>
                                        <SelectTrigger id="bodyType">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="Slim">Slim</SelectItem>
                                            <SelectItem value="Fit">Fit</SelectItem>
                                            <SelectItem value="Healthy">Healthy</SelectItem>
                                            <SelectItem value="Fat">Fat</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
  );
}
