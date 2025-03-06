import { Button } from "@www/ui/button";
import { Link } from "react-router";

export function RootUnauthenticatedPage({ message }: { message: string }) {
  return (
    <div className="flex max-w-md flex-col items-center justify-center text-center">
      <h1 className="text-2xl">Oops!</h1>
      <h1 className="mt-4 text-lg">{message}</h1>
      <div className="text-muted-foreground mt-10">Let's fix that...</div>
      <Link to="/select-account">
        <Button variant="default" className="mt-4">
          Login
        </Button>
      </Link>
      <div className="text-muted-foreground mt-10 text-center">
        Still having trouble? Click the button below to log out of all accounts.
        Sometimes you just need a fresh start.
      </div>
      <Link to="/logout?mode=allAccounts">
        <Button variant="secondary" className="mt-4">
          Logout of all accounts
        </Button>
      </Link>
    </div>
  );
}
