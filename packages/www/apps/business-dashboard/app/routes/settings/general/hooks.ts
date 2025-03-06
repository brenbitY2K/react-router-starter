import { useEffect, useState } from "react";
import { useFetcherWithReset } from "~/hooks/action.js";
import { type getTeamLogoSignature } from "~/routes/api/cloudinary/actions/get-team-logo-signature.server.js";
import { uploadImageToCloudinaryWithPresignedUrl } from "~/utils/images.js";
import { toast } from "sonner";
import { type UploadApiResponse } from "cloudinary";
import { type updateTeamLogo } from "./actions/update-team-logo.js";

type APIParams = Pick<
  Awaited<ReturnType<typeof getTeamLogoSignature>>,
  "timestamp" | "signature"
>;

export function usePresignedTeamLogoUploadFetcher({
  teamId,
  imageUrl,
  successCb,
}: {
  teamId: string;
  imageUrl: string | undefined;
  successCb: (data: UploadApiResponse) => void;
}) {
  const [isActionDataFresh, setIsActionDataFresh] = useState(false);

  const fetcher = useFetcherWithReset<typeof getTeamLogoSignature>();

  useEffect(() => {
    if (fetcher.state === "submitting") setIsActionDataFresh(true);
  }, [fetcher.state]);

  useEffect(() => {
    async function uploadImage(imageUrl: string, apiParams: APIParams) {
      const formData = new FormData();
      formData.append("file", imageUrl);
      formData.append("public_id", teamId);
      formData.append("folder", "customer_team_logos");
      formData.append("transformation", "f_webp");

      const uploadData = await uploadImageToCloudinaryWithPresignedUrl(
        formData,
        { timestamp: apiParams.timestamp, signature: apiParams.signature },
      );

      if (uploadData?.secure_url) {
        successCb(uploadData);
      } else {
        toast.error("There was an error uploading your team logo.");
      }
    }

    if (isActionDataFresh) {
      if (fetcher.data && "timestamp" in fetcher.data && imageUrl) {
        uploadImage(imageUrl, fetcher.data);
        setIsActionDataFresh(false);
      }
    }
  }, [teamId, isActionDataFresh, fetcher, imageUrl, successCb]);

  return fetcher;
}

export function useUpdateTeamLogoFetcher() {
  const [isActionDataFresh, setIsActionDataFresh] = useState(false);

  const fetcher = useFetcherWithReset<typeof updateTeamLogo>();

  useEffect(() => {
    if (fetcher.state === "submitting") setIsActionDataFresh(true);
  }, [fetcher.state]);

  useEffect(() => {
    if (isActionDataFresh && fetcher.data && "success" in fetcher.data) {
      setIsActionDataFresh(false);
      toast.success("Your team logo has been updated");
    }
  }, [fetcher.data, isActionDataFresh]);

  return fetcher;
}
