import type { Route } from "./+types/billing-success-route";
import { Button } from "@www/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@www/ui/dialog";

export default function SubscriptionSuccessPage({
  params,
}: Route.ComponentProps) {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const plan = searchParams.get("planType");
  const billingInterval = searchParams.get("billingInterval");

  const planName =
    plan === "contractor"
      ? "Contractor"
      : plan === "acquisition"
        ? "Acquisition"
        : plan === "rezoning"
          ? "Rezoning"
          : "";

  function handleDialogOpenChange(value: boolean) {
    if (!value) navigate(`/${params.teamSlug}/settings/billing`);
  }

  return (
    <Dialog open={true} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Subscription Successful!
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <p className="text-center">
            Thank you for subscribing to our {planName} plan on a{" "}
            {billingInterval}ly basis.
          </p>
          <p className="text-center">
            If the dashboard still says you don't have access, please give the
            system a few moments or try refreshing.
          </p>
          <p className="text-center">
            We're excited to have you on board and can't wait for you to start
            exploring Acme.
          </p>
          <div className="flex justify-center pt-4">
            <Link to={`/${params.teamSlug}/`}>
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
