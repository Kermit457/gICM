"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useApiError, fetchWithError } from "@/hooks/use-api-error";
import { toast } from "sonner";

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaitlistModal({ open, onOpenChange }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const { isLoading, executeAsync } = useApiError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    await executeAsync(
      () => fetchWithError("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
      {
        context: "Waitlist",
        successMessage: "Successfully joined! Check your email for confirmation.",
        onSuccess: () => {
          setSuccess(true);

          // Close modal after 2.5 seconds
          setTimeout(() => {
            onOpenChange(false);
            setSuccess(false);
            setEmail("");
          }, 2500);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-lime-50 to-emerald-50 dark:from-zinc-900 dark:to-zinc-800 border-lime-300/40 dark:border-lime-300/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-black dark:text-white">
            Join the Waitlist
          </DialogTitle>
          <DialogDescription className="text-black/60 dark:text-white/60">
            Get early access to gICM. We'll notify you when alpha keys are available.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-lime-600 dark:text-lime-400" />
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">You're on the list!</h3>
            <p className="text-black/60 dark:text-white/60 text-sm">
              Check your email for confirmation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black dark:text-white font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white dark:bg-zinc-800 border-black/20 dark:border-white/20 focus:border-lime-500 dark:focus:border-lime-400"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-black/50 dark:text-white/50">
                We respect your privacy. No spam, ever.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Waitlist"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              >
                Maybe Later
              </Button>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/10">
              <p className="text-xs text-black/60 dark:text-white/60 text-center">
                By joining, you agree to our{" "}
                <a href="/privacy" className="text-lime-600 dark:text-lime-400 hover:underline">
                  Privacy Policy
                </a>
                {" "}and{" "}
                <a href="/terms" className="text-lime-600 dark:text-lime-400 hover:underline">
                  Terms of Service
                </a>
                .
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
