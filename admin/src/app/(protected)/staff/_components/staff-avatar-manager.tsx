"use client";

import { useState, useRef, useTransition } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateStaffPhoto } from "../actions";
import { type Staff } from "../types";

interface StaffAvatarManagerProps {
  staff: Staff;
}

export function StaffAvatarManager({ staff }: StaffAvatarManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("Súbor je príliš veľký (max 5MB)");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${staff.id}-${Date.now()}.${fileExt}`;
      const filePath = `${staff.company_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("staff_photos")
        .upload(filePath, file, {
            upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("staff_photos")
        .getPublicUrl(filePath);

      startTransition(async () => {
        const result = await updateStaffPhoto(staff.id, publicUrl);
        if (!result.success) {
          alert(result.message);
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
    } catch (error) {
      console.error(error);
      alert("Nepodarilo sa nahrať obrázok");
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Naozaj chcete odstrániť fotku?")) return;

    startTransition(async () => {
      const result = await updateStaffPhoto(staff.id, null);
      if (!result.success) {
        alert(result.message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
       <div className="flex items-start gap-6">
          <Avatar className="w-32 h-32 border-2 border-border">
            <AvatarImage src={staff.photo || ""} className="object-cover" />
            <AvatarFallback className="text-4xl bg-muted">{getInitials(staff.full_name)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-3 pt-2">
            <h3 className="font-medium text-lg">Profilová fotka</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Nahrajte fotku zamestnanca. Odporúčaná veľkosť je 400x400px. Maximálna veľkosť súboru je 5MB.
            </p>

            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                disabled={isUploading || isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Nahrať fotku
              </Button>
              
              {staff.photo && (
                <Button
                  variant="destructive"
                  size="icon"
                  disabled={isUploading || isPending}
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
            />
          </div>
       </div>

       {staff.photo && (
         <div className="bg-muted/30 p-4 rounded-lg border text-sm">
           <div className="font-medium mb-1">Náhľad</div>
           <p className="text-muted-foreground mb-4">Takto sa bude zamestnanec zobrazovať v rezervačnom systéme.</p>
           
           <div className="flex items-center gap-3 p-3 bg-card border rounded-md max-w-sm">
              <Avatar className="h-10 w-10">
                <AvatarImage src={staff.photo} className="object-cover" />
                <AvatarFallback>{getInitials(staff.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                 <div className="font-medium text-sm">{staff.full_name}</div>
                 <div className="text-xs text-muted-foreground">{staff.position || staff.role}</div>
              </div>
           </div>
         </div>
       )}
    </div>
  );
}
