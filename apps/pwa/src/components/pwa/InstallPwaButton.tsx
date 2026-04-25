import { useEffect, useMemo, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIos(): boolean {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

function isStandalone(): boolean {
  const nav: any = navigator;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    nav?.standalone === true
  );
}

export function InstallPwaButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setIosHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as any);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as any);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const showIos = useMemo(() => isIos() && !installed, [installed]);
  const canPrompt = !!deferredPrompt && !installed;
  const visible = canPrompt || showIos;

  const onClick = async () => {
    if (canPrompt && deferredPrompt) {
      await deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch {
        // ignore
      }
      return;
    }
    if (showIos) setIosHelpOpen(true);
  };

  if (!visible) return null;

  return (
    <>
      <Button
        type="button"
        variant={canPrompt ? "default" : "outline"}
        size="sm"
        onClick={onClick}
        className={className}
      >
        <Download className="w-4 h-4 mr-2" aria-hidden />
        Instalar app
      </Button>

      <Dialog open={iosHelpOpen} onOpenChange={setIosHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar Kipi Safe</DialogTitle>
            <DialogDescription>
              En iPhone/iPad (Safari) la instalación se hace desde el menú de compartir.
            </DialogDescription>
          </DialogHeader>

          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>
              Toca el botón de <span className="font-semibold">Compartir</span>{" "}
              <Share2 className="inline w-4 h-4 align-text-bottom" aria-hidden /> en Safari.
            </li>
            <li>
              Elige <span className="font-semibold">“Agregar a pantalla de inicio”</span>.
            </li>
            <li>
              Confirma con <span className="font-semibold">Agregar</span>.
            </li>
          </ol>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIosHelpOpen(false)}>
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InstallPwaButton;

