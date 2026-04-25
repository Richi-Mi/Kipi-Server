import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

type Agreements = {
  location: boolean;
  socialMedia: boolean;
  screenTimeLimits: boolean;
};

export function ParentalAgreements({
  minorId,
  switchesDisabled = false,
}: {
  minorId: string | number | null | undefined;
  switchesDisabled?: boolean;
}) {
  const [agreements, setAgreements] = useState<Agreements>({
    location: true,
    socialMedia: false,
    screenTimeLimits: true,
  });
  const [loading, setLoading] = useState(false);
  const handleToggle = async (key: keyof Agreements) => {
    if (switchesDisabled) return;
    const newValue = !agreements[key];
    const newConfig = { ...agreements, [key]: newValue };
    setAgreements(newConfig);

    const levelsArr = [
      newConfig.location && 1,
      newConfig.socialMedia && 2,
      newConfig.screenTimeLimits && 3,
    ].filter(Boolean) as number[];

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/minors/agreement"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minor_id: minorId, shared_alert_levels: levelsArr }),
      });
      if (!res.ok) throw new Error("Error del servidor");
      toast.success("Acuerdos parentales guardados");
    } catch {
      toast.error("Fallo al actualizar acuerdos");
      setAgreements({ ...agreements, [key]: !newValue });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <h3 className="font-semibold mb-1">Acuerdos Parentales</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Configura los niveles y tipos de alerta compartidos en el dispositivo del menor.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="location-sharing" className="flex flex-col space-y-1">
            <span>Rastreo de Ubicación</span>
            <span className="font-normal text-xs text-muted-foreground">
              Compartir eventos de desviación geográfica.
            </span>
          </Label>
          <Switch
            id="location-sharing"
            checked={agreements.location}
            onCheckedChange={() => handleToggle("location")}
            disabled={loading || switchesDisabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="social-sharing" className="flex flex-col space-y-1">
            <span>Monitoreo de Redes Sociales</span>
            <span className="font-normal text-xs text-muted-foreground">
              Notificaciones en palabras clave bloqueadas.
            </span>
          </Label>
          <Switch
            id="social-sharing"
            checked={agreements.socialMedia}
            onCheckedChange={() => handleToggle("socialMedia")}
            disabled={loading || switchesDisabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="screen-limits" className="flex flex-col space-y-1">
            <span>Límites de Uso de Pantalla</span>
            <span className="font-normal text-xs text-muted-foreground">
              Bloqueo automático según horarios pactados.
            </span>
          </Label>
          <Switch
            id="screen-limits"
            checked={agreements.screenTimeLimits}
            onCheckedChange={() => handleToggle("screenTimeLimits")}
            disabled={loading || switchesDisabled}
          />
        </div>
      </div>
    </div>
  );
}

export default ParentalAgreements;

