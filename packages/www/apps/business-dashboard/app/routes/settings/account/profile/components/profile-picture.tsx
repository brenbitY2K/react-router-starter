import { type ChangeEvent, forwardRef, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@www/ui/avatar";
import { Button } from "@www/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@www/ui/dialog";
import { Slider } from "@www/ui/slider";
import { CloudinaryIntent } from "~/routes/api/cloudinary/intents.js";
import AvatarEditor from "react-avatar-editor";
import {
  type loader,
  SettingsAccountProfileRouteIntent,
} from "../profile-route.js";
import { useLoaderData } from "react-router";
import {
  usePresignedProfilePictureUploadFetcher,
  useUpdateProfilePictureFetcher,
} from "../hooks.js";
import { type UploadApiResponse } from "cloudinary";
import { toast } from "sonner";
import {
  generateImageFallbackText,
  MAX_PROFILE_PICTURE_FILE_SIZE,
  MAX_PROFILE_PICTURE_FILE_SIZE_ERROR_MESSAGE,
} from "~/utils/images.js";

export function ProfilePicture() {
  const loaderData = useLoaderData<typeof loader>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    loaderData.imageUrl ?? undefined,
  );

  const [openCropperDialog, setOpenCropperDialog] = useState<boolean>(false);

  const cropperRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const signedUrlFetcher = usePresignedProfilePictureUploadFetcher({
    userId: loaderData.userId,
    successCb: handlePresignedUrlSuccessResponse,
    imageUrl,
  });
  const updateProfilePictureFetcher = useUpdateProfilePictureFetcher();

  function handlePresignedUrlSuccessResponse(uploadData: UploadApiResponse) {
    const formData = new FormData();
    formData.set(
      "intent",
      SettingsAccountProfileRouteIntent.UPDATE_PROFILE_PICTURE,
    );
    formData.set("imageUrl", uploadData.secure_url);
    updateProfilePictureFetcher.submit(formData, { method: "POST" });
    setImageUrl(uploadData.secure_url);
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const file = files ? files[0] : null;

    if (file) {
      if (file && file.size > MAX_PROFILE_PICTURE_FILE_SIZE) {
        toast.error(MAX_PROFILE_PICTURE_FILE_SIZE_ERROR_MESSAGE);
        return;
      }
      setSelectedFile(file);
      setOpenCropperDialog(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCrop = () => {
    if (cropperRef.current) {
      /* @ts-expect-error -- Not ready for esm yet so can't get type */
      const canvas = cropperRef.current.getImageScaledToCanvas();
      const croppedImage = canvas.toDataURL();

      const formData = new FormData();
      formData.set("intent", CloudinaryIntent.GET_PROFILE_PICTURE_SIGNATURE);
      signedUrlFetcher.submit(formData, {
        action: "/cloudinary",
        method: "POST",
      });

      setImageUrl(croppedImage);
    }
  };

  return (
    <div className="space-y-2 p-6">
      <h2 className="text-xs font-semibold">Profile picture</h2>
      <Avatar
        className="hover:ring-primary mx-auto size-36 cursor-pointer hover:ring"
        onClick={handleAvatarClick}
      >
        <AvatarImage src={imageUrl} />
        <AvatarFallback>
          {generateImageFallbackText(loaderData.name)}
        </AvatarFallback>
      </Avatar>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        ref={fileInputRef}
        className="hidden"
      />
      <ProfilePictureCropperDialog
        file={selectedFile}
        open={openCropperDialog}
        onOpenChange={setOpenCropperDialog}
        ref={cropperRef}
        onCrop={handleCrop}
      />
    </div>
  );
}

const ProfilePictureCropperDialog = forwardRef(
  (
    {
      file,
      open,
      onOpenChange,
      onCrop,
    }: {
      file: File | null;
      open: boolean;
      onOpenChange: (value: boolean) => void;
      onCrop: () => void;
    },
    ref,
  ) => {
    const [scale, setScale] = useState(1.2);
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crop your profile picture</DialogTitle>
          </DialogHeader>
          <div className="my-8 flex w-full flex-col items-center justify-center space-y-8">
            {/* @ts-expect-error -- Not ready for esm yet */}
            <AvatarEditor
              ref={ref}
              image={file}
              width={200}
              height={200}
              border={50}
              borderRadius={125}
              color={[0, 0, 0, 0.4]}
              scale={scale}
              className="border-border border-foreground rounded-md border-2"
            />
            <Slider
              defaultValue={[scale]}
              onValueChange={(value) => setScale(value[0])}
              max={2}
              min={0.5}
              step={0.1}
              className="w-[300px]"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button fullWidth onClick={onCrop}>
                Crop picture
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
