"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Loader2, ZoomIn, ZoomOut, Check, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";

interface AvatarCropModalProps {
   imageSrc: string;
   open: boolean;
   onClose: () => void;
   onConfirm: (croppedBlob: Blob) => Promise<void>;
}

async function getCroppedImg(imageSrc: string, croppedAreaPixels: Area): Promise<Blob> {
   const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageSrc;
   });

   const canvas = document.createElement("canvas");
   const SIZE = 400;
   canvas.width = SIZE;
   canvas.height = SIZE;

   const ctx = canvas.getContext("2d")!;
   ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      SIZE,
      SIZE,
   );

   return new Promise((resolve, reject) => {
      canvas.toBlob(
         (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("No se pudo generar la imagen recortada."));
         },
         "image/webp",
         0.92,
      );
   });
}

export function AvatarCropModal({ imageSrc, open, onClose, onConfirm }: AvatarCropModalProps) {
   const [crop, setCrop] = useState({ x: 0, y: 0 });
   const [zoom, setZoom] = useState(1);
   const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
   const [isConfirming, setIsConfirming] = useState(false);

   const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
   }, []);

   const handleConfirm = async () => {
      if (!croppedAreaPixels) return;
      setIsConfirming(true);
      try {
         const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
         await onConfirm(blob);
      } finally {
         setIsConfirming(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
         <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2">
               <DialogTitle>Ajustar foto de perfil</DialogTitle>
               <DialogDescription>
                  Arrastra y usa el zoom para encuadrar tu foto.
               </DialogDescription>
            </DialogHeader>

            {/* Área de crop */}
            <div className="relative w-full h-80 bg-black">
               <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
               />
            </div>

            {/* Controles de zoom */}
            <div className="px-6 py-4 space-y-4">
               <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Slider
                     min={1}
                     max={3}
                     step={0.05}
                     value={[zoom]}
                     onValueChange={([v]) => setZoom(v)}
                     className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
               </div>

               <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={onClose} disabled={isConfirming}>
                     <X className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                  <Button onClick={handleConfirm} disabled={isConfirming}>
                     {isConfirming
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Check className="mr-2 h-4 w-4" />
                     }
                     Aplicar
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
