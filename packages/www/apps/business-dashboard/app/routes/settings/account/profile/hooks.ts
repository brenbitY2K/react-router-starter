import { useEffect, useState } from "react";
import { useFetcherWithReset } from "~/hooks/action.js";
import { type getProfilePictureSignature } from "../../../api/cloudinary/actions/get-profile-picture-signature.server.js";
import { type UploadApiResponse } from "cloudinary";
import { type updateProfilePicture } from "./actions/update-profile-picture.js";
import { toast } from "sonner";
import { uploadImageToCloudinaryWithPresignedUrl } from "~/utils/images.js";

type APIParams = Pick<
  Awaited<ReturnType<typeof getProfilePictureSignature>>,
  "timestamp" | "signature"
>;

export function usePresignedProfilePictureUploadFetcher({
  userId,
  imageUrl,
  successCb,
}: {
  userId: string;
  imageUrl: string | undefined;
  successCb: (uploadData: UploadApiResponse) => void;
}) {
  const [isActionDataFresh, setIsActionDataFresh] = useState(false);

  const fetcher = useFetcherWithReset<typeof getProfilePictureSignature>();

  useEffect(() => {
    if (fetcher.state === "submitting") setIsActionDataFresh(true);
  }, [fetcher.state]);

  useEffect(() => {
    async function uploadImage(imageUrl: string, apiParams: APIParams) {
      const formData = new FormData();
      formData.append("file", imageUrl);
      formData.append("public_id", userId);
      formData.append("folder", "profile_pictures");
      formData.append("transformation", "f_webp");

      const uploadData = await uploadImageToCloudinaryWithPresignedUrl(
        formData,
        { timestamp: apiParams.timestamp, signature: apiParams.signature },
      );

      if (uploadData?.secure_url) {
        successCb(uploadData);
      } else {
        toast.error("There was an error uploading your profile picture");
      }
    }

    if (isActionDataFresh) {
      if (fetcher.data && "timestamp" in fetcher.data && imageUrl) {
        uploadImage(imageUrl, fetcher.data);
        setIsActionDataFresh(false);
      }
    }
  }, [userId, isActionDataFresh, fetcher, imageUrl, successCb]);

  return fetcher;
}

export function useUpdateProfilePictureFetcher() {
  const [isActionDataFresh, setIsActionDataFresh] = useState(false);

  const fetcher = useFetcherWithReset<typeof updateProfilePicture>();

  useEffect(() => {
    if (fetcher.state === "submitting") setIsActionDataFresh(true);
  }, [fetcher.state]);

  useEffect(() => {
    if (isActionDataFresh && fetcher.data && "success" in fetcher.data) {
      setIsActionDataFresh(false);
      toast.success("Your profile picture has been updated");
    }
  }, [fetcher.data, isActionDataFresh]);

  return fetcher;
}
