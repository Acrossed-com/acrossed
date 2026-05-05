import { SignUp } from "@clerk/nextjs";
export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <SignUp appearance={{ variables: { colorPrimary: "#8b5cf6", colorBackground: "#0a0b1a" } }} />
    </div>
  );
}
