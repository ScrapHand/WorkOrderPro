"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserService } from "@/services/user.service";
import { UploadService } from "@/services/upload.service";
import { toast } from "sonner";
import { User, UserRole } from "@/lib/auth/types";
import { Loader2, Upload } from "lucide-react";

interface UserProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
    const { data: user } = useAuth();
    const queryClient = useQueryClient();

    const [displayName, setDisplayName] = useState(user?.full_name || user?.username || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const updateProfile = useMutation({
        mutationFn: async (vars: { username?: string, avatarUrl?: string }) => {
            if (!user?.id) throw new Error("No user ID");
            return UserService.update(user.id, vars);
        },
        onSuccess: () => {
            toast.success("Profile updated successfully");
            queryClient.invalidateQueries({ queryKey: ["user"] });
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update profile");
        }
    });

    const handleSave = async () => {
        if (!user) return;

        let avatarUrl = user.avatarUrl;

        // 1. Upload Avatar if selected
        if (avatarFile) {
            setIsUploading(true);
            try {
                // Get Presigned URL
                // We use 'tenant' type context or a new 'user-avatar' context?
                // Let's reuse 'tenant' for now or 'assets' if simple. 
                // Wait, UploadService types: 'assets' | 'work-orders' | 'tenant' | 'inventory'.
                // 'tenant' is safest for general branding/user stuff.
                // entityId = user.id

                // Oops, the enum might not support 'user' yet on backend, but S3 path generation usually generic.
                // Let's try 'tenant' type, with user ID.
                const { url, key } = await UploadService.getPresignedUrl("tenant", user.id, avatarFile);

                await UploadService.uploadToS3(url, avatarFile);

                // Confirm
                const uploaded = await UploadService.confirmUpload({
                    fileKey: key, // The backend expects this to match what it signed
                    entityType: "tenant",
                    entityId: user.id,
                    fileName: avatarFile.name,
                    mimeType: avatarFile.type,
                    size: avatarFile.size
                });

                avatarUrl = uploaded.url;

            } catch (err) {
                console.error(err);
                toast.error("Failed to upload avatar");
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        // 2. Update User Profile
        updateProfile.mutate({
            username: displayName,
            avatarUrl: avatarUrl
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-muted bg-muted flex items-center justify-center">
                            {avatarFile ? (
                                <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="h-full w-full object-cover" />
                            ) : (user?.avatarUrl) ? (
                                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-4xl text-muted-foreground font-bold">
                                    {displayName?.charAt(0) || "U"}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="avatar-upload" className="cursor-pointer">
                                <span className="sr-only">Upload</span>
                                <div className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                    <Upload className="w-4 h-4" /> Change Photo
                                </div>
                            </Label>
                            <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && setAvatarFile(e.target.files[0])}
                            />
                        </div>
                    </div>

                    {/* Display Name */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Display Name
                        </Label>
                        <Input
                            id="name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    {/* Read Only Email */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-muted-foreground">
                            Email
                        </Label>
                        <div className="col-span-3 text-sm text-muted-foreground">
                            {user?.email}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isUploading || updateProfile.isPending}>
                        {isUploading ? "Uploading..." : updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
