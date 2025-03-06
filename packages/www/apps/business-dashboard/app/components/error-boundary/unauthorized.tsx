import { Button } from "@www/ui/button";
import { Link } from "react-router";

export function RootUnauthorizedPage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl">Oops!</h1>
      <h1 className="mt-4 text-lg">{message}</h1>
      <div className="text-muted-foreground mt-10">
        You can select a different account or a different team.
      </div>
      <Link to="/select-team">
        <Button variant="secondary" className="mt-10">
          Choose another team
        </Button>
      </Link>
    </div>
  );
}
