import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

export function ManualAlertForm({
  open,
  onOpenChange,
  minorId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minorId: string | number | null | undefined;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ description: "", app: "", level: 1 });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/alerts/manual"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minor_id: minorId,
          description: formData.description,
          app_source: formData.app,
          risk_level: formData.level,
        }),
      });
      if (!res.ok) throw new Error("Error HTTP");
      toast.success("Alerta manual creada con éxito");
      onOpenChange(false);
      setFormData({ description: "", app: "", level: 1 });
      onSuccess?.();
    } catch {
      toast.error("Error al crear alerta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Alerta Manual</DialogTitle>
          <DialogDescription>
            Registra una alerta detectada fuera del sistema para dar seguimiento parental.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Ej. Tiempo prolongado en la noche"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="app">Aplicación / Contexto</Label>
            <Input
              id="app"
              placeholder="Ej. WhatsApp o General"
              value={formData.app}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, app: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level" className="block">
              Nivel de Riesgo (1-3)
            </Label>
            <Input
              id="level"
              type="number"
              min={1}
              max={3}
              value={formData.level}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, level: Number.parseInt(e.target.value, 10) || 1 })
              }
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Alerta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ManualAlertForm;

