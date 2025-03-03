import {
  OrganizationLogo,
  OrganizationLogoFallback,
  OrganizationLogoImage,
} from "@www/ui/organization-logo";
import { useLoaderData } from "react-router";
import {
  generateImageFallbackText,
  MAX_TEAM_LOGO_FILE_SIZE,
  MAX_TEAM_LOGO_FILE_SIZE_ERROR_MESSAGE,
} from "~/utils/images.js";
import { SettingsGeneralRouteIntent, type loader } from "../general-route.js";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import {
  usePresignedTeamLogoUploadFetcher,
  useUpdateTeamLogoFetcher,
} from "../hooks.js";
import { CloudinaryIntent } from "~/routes/api/cloudinary/intents.js";
import { type UploadApiResponse } from "cloudinary";

export function TeamLogoSection() {
  const loaderData = useLoaderData<typeof loader>();

  const [imageUrl, setImageUrl] = useState<string | undefined>(
    loaderData.teamImageUrl ?? undefined,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const presignedTeamLogoUploadFetcher = usePresignedTeamLogoUploadFetcher({
    imageUrl,
    teamId: loaderData.teamId,
    successCb: handlePresignedUrlSuccessResponse,
  });

  const updateTeamLogoFetcher = useUpdateTeamLogoFetcher();

  function handlePresignedUrlSuccessResponse(uploadData: UploadApiResponse) {
    const formData = new FormData();
    formData.set("intent", SettingsGeneralRouteIntent.UPDATE_LOGO);
    formData.set("imageUrl", uploadData.secure_url);
    updateTeamLogoFetcher.submit(formData, { method: "POST" });
    setImageUrl(uploadData.secure_url);
  }

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const file = files ? files[0] : null;

    if (file) {
      if (file && file.size > MAX_TEAM_LOGO_FILE_SIZE) {
        toast.error(MAX_TEAM_LOGO_FILE_SIZE_ERROR_MESSAGE);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          const formData = new FormData();
          formData.set(
            "intent",
            CloudinaryIntent.GET_SELLER_TEAM_LOGO_SIGNATURE,
          );
          formData.set("teamSlug", loaderData.teamSlug);
          presignedTeamLogoUploadFetcher.submit(formData, {
            action: "/cloudinary",
            method: "POST",
          });
          setImageUrl(e.target?.result);
        } else toast.error("We could not upload this image");
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Logo</h2>
      <OrganizationLogo
        className="hover:ring-primary size-16 cursor-pointer hover:ring"
        onClick={handleLogoClick}
      >
        <OrganizationLogoImage src={imageUrl} />
        <OrganizationLogoFallback>
          {generateImageFallbackText(loaderData.teamName)}
        </OrganizationLogoFallback>
      </OrganizationLogo>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        ref={fileInputRef}
        className="hidden"
      />
      <p className="text-muted-foreground text-sm">
        Pick a logo for your workspace. Recommended size is 256×256px.
      </p>
    </div>
  );
}
