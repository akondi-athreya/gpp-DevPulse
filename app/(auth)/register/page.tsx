import RegisterForm from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-pink-500/5 blur-[120px] dark:bg-pink-500/10" />
      </div>

      <div className="z-10 w-full flex justify-center">
        <RegisterForm />
      </div>
    </main>
  );
}
