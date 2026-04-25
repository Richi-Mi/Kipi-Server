import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthBranding } from "@/components/auth/AuthBranding";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Sub-component: Password Input with show/hide toggle
// ─────────────────────────────────────────────────────────
type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
};

const PasswordInput = ({ value, onChange, placeholder, disabled, id }: PasswordInputProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder || "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
        disabled={disabled}
        className="pr-10 h-11"
        required
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Sub-component: LoginForm
// ─────────────────────────────────────────────────────────
type LoginFormProps = {
  onForgot: () => void;
  onRegister: () => void;
};

const LoginForm = ({ onForgot, onRegister }: LoginFormProps) => {
  const { login, authLoading, supabaseMode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await login(email, password);
    if (result.success) {
      toast.success("\u00a1Bienvenida de vuelta!");
      navigate(result.isNewUser ? "/pairing" : "/dashboard");
    } else {
      setError(result.error);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h2 className="font-display font-bold text-foreground text-2xl sm:text-3xl leading-tight">
          Bienvenida de vuelta
        </h2>
        <p className="text-muted-foreground text-sm mt-1.5">
          Accede a tu panel de protección familiar.
        </p>
      </div>

      {/* Demo hint */}
      {!supabaseMode ? (
        <div className="p-3.5 rounded-xl bg-primary-subtle border border-primary/15 mb-6">
          <p className="text-xs text-primary/80 leading-relaxed">
            <span className="font-semibold text-primary">Demo:</span> Usa{" "}
            <code className="bg-primary/10 px-1 py-0.5 rounded text-[11px] font-mono">
              ana@familia.com
            </code>{" "}
            y contraseña{" "}
            <code className="bg-primary/10 px-1 py-0.5 rounded text-[11px] font-mono">
              demo123
            </code>{" "}
            para ingresar al dashboard.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Correo electrónico
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="nombre@ejemplo.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="h-11"
            required
            disabled={authLoading}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-primary hover:text-primary-light transition-colors duration-150 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={authLoading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/8 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 font-semibold"
          disabled={authLoading || !email || !password}
        >
          {authLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿Nuevo en Kipi Safe?{" "}
        <button
          type="button"
          onClick={onRegister}
          className="text-primary font-semibold hover:text-primary-light transition-colors duration-150"
        >
          Crea tu cuenta gratis
        </button>
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Sub-component: RegisterForm
// ─────────────────────────────────────────────────────────
type RegisterFormProps = { onLogin: () => void };

const RegisterForm = ({ onLogin }: RegisterFormProps) => {
  const { register, authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!agreed) {
      setError("Debes aceptar los términos para continuar.");
      return;
    }

    const result = await register(email, password, name);
    if (result.success) {
      toast.success("\u00a1Cuenta creada exitosamente!");
      navigate("/pairing");
    } else {
      setError(result.error);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display font-bold text-foreground text-2xl sm:text-3xl leading-tight">
          Crea tu cuenta
        </h2>
        <p className="text-muted-foreground text-sm mt-1.5">
          Protege a tu familia en menos de 2 minutos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reg-name">Nombre completo</Label>
          <Input
            id="reg-name"
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            className="h-11"
            required
            disabled={authLoading}
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Correo electrónico</Label>
          <Input
            id="reg-email"
            type="email"
            placeholder="nombre@ejemplo.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="h-11"
            required
            disabled={authLoading}
            autoComplete="email"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reg-pass">Contraseña</Label>
            <PasswordInput
              id="reg-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mín. 8 caracteres"
              disabled={authLoading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm">Confirmar</Label>
            <PasswordInput
              id="reg-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repetir"
              disabled={authLoading}
            />
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5 pt-1">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked: boolean) => setAgreed(!!checked)}
            className="mt-0.5"
          />
          <Label
            htmlFor="terms"
            className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
          >
            Acepto{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setTermsOpen(true);
              }}
              className="text-primary underline underline-offset-2"
            >
              términos y condiciones
            </button>
          </Label>
        </div>

        <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Términos y condiciones</DialogTitle>
            </DialogHeader>

            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-4 text-sm leading-relaxed text-foreground">
                <div>
                  <h2 className="text-base font-bold">
                    TÉRMINOS Y CONDICIONES DE USO - KIPI SAFE
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold">Última actualización:</span>{" "}
                    25 de abril de 2026
                  </p>
                </div>

                <p className="text-muted-foreground">
                  Este contrato describe los términos y condiciones generales
                  aplicables al uso de los servicios ofrecidos por{" "}
                  <span className="font-semibold text-foreground">Kipi Safe</span>{" "}
                  ("nosotros", "nuestro" o "la Aplicación"). Al acceder o
                  utilizar nuestra plataforma de defensa tecnológica, usted
                  acepta cumplir con estos términos.
                </p>

                <div className="space-y-2">
                  <h3 className="font-semibold">1. NATURALEZA DEL SERVICIO</h3>
                  <p className="text-muted-foreground">
                    Kipi Safe es una solución de defensa tecnológica basada en
                    Inteligencia Artificial en el borde (Edge IA). Su objetivo
                    es:
                  </p>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>
                      Detectar tácticas de manipulación y violencia en tiempo
                      real como acompañante digital.
                    </li>
                    <li>
                      Proteger al menor sin vulnerar su privacidad de forma
                      invasiva.
                    </li>
                    <li>
                      Informar a los tutores vinculados sobre situaciones de
                      riesgo o emergencias detectadas.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">2. REGISTRO Y USO DE CUENTA</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>
                      <span className="font-semibold text-foreground">Capacidad:</span>{" "}
                      El registro debe ser realizado por un adulto (padre,
                      madre o tutor legal) con capacidad legal para contratar.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">Veracidad:</span>{" "}
                      El usuario se obliga a proporcionar información personal
                      verdadera y precisa, incluyendo nombres, correos
                      electrónicos y números telefónicos.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">Seguridad:</span>{" "}
                      El usuario es responsable de mantener la confidencialidad
                      de su contraseña y de las actividades realizadas en su
                      cuenta.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">
                    3. USO DE TECNOLOGÍA IA Y PROCESAMIENTO
                  </h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>
                      <span className="font-semibold text-foreground">Funcionamiento:</span>{" "}
                      Los Servicios utilizan productos de IA que incluyen
                      análisis predictivo y procesamiento de lenguaje natural
                      para identificar riesgos.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">Proveedores:</span>{" "}
                      Para la ejecución de estas funciones, se podrán utilizar
                      proveedores terceros como Google Cloud AI.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">Limitaciones:</span>{" "}
                      El usuario reconoce que, aunque la IA está diseñada para
                      la detección de violencia, ninguna tecnología es
                      infalible. Kipi Safe actúa como una herramienta de apoyo
                      y no sustituye la supervisión humana.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">4. PRIVACIDAD Y DATOS</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>
                      <span className="font-semibold text-foreground">Recolección:</span>{" "}
                      Recopilamos datos de ubicación (GPS), información del
                      dispositivo y registros de uso para el funcionamiento de
                      las alertas de emergencia.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">Privacidad:</span>{" "}
                      El procesamiento de estos datos se rige estrictamente por
                      nuestra Política de Privacidad.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">Consentimiento:</span>{" "}
                      Al utilizar la aplicación, usted otorga su consentimiento
                      para el monitoreo de seguridad descrito en la descripción
                      técnica del proyecto.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">5. PAGOS Y SUSCRIPCIONES</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>
                      <span className="font-semibold text-foreground">Procesamiento:</span>{" "}
                      Todos los pagos se gestionan de forma segura a través de{" "}
                      <span className="font-semibold text-foreground">Stripe</span>.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">Datos Financieros:</span>{" "}
                      Kipi Safe no almacena directamente números de tarjetas de
                      crédito o códigos de seguridad; esta información es
                      manejada exclusivamente por el proveedor de pagos bajo
                      sus propios términos.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">6. LIMITACIÓN DE RESPONSABILIDAD</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>
                      Kipi Safe no garantiza que el servicio sea ininterrumpido
                      o esté libre de errores debido a factores externos como
                      la conectividad a Internet o fallos en el dispositivo del
                      usuario.
                    </li>
                    <li>
                      No nos hacemos responsables por daños derivados de la
                      falta de respuesta de los tutores ante las alertas
                      enviadas por la aplicación.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">7. PROPIEDAD INTELECTUAL</h3>
                  <p className="text-muted-foreground">
                    Los algoritmos de Edge IA, el software, los logotipos y
                    contenidos de Kipi Safe son propiedad exclusiva de la
                    empresa y están protegidos por leyes de propiedad
                    intelectual internacionales.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">8. MODIFICACIONES</h3>
                  <p className="text-muted-foreground">
                    Nos reservamos el derecho de actualizar estos términos en
                    cualquier momento para cumplir con cambios legales o mejoras
                    en el servicio. Las actualizaciones serán notificadas a
                    través de la aplicación o por correo electrónico.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">9. CONTACTO</h3>
                  <p className="text-muted-foreground">
                    Para cualquier duda o reclamación sobre estos términos,
                    puede contactarnos en:
                  </p>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>
                      <span className="font-semibold text-foreground">Correo electrónico:</span>{" "}
                      kipisafe@gmail.com
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">Dirección:</span>{" "}
                      Venustiano Carranza, Vicente Valencia, México, 56000.
                    </li>
                  </ul>
                </div>

                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Al hacer clic en "Aceptar"</span>{" "}
                  o utilizar la aplicación, usted confirma que ha leído,
                  entendido y aceptado estos Términos y Condiciones.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/8 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 font-semibold"
          disabled={authLoading || !name || !email || !password || !confirm}
        >
          {authLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Crear Cuenta Gratis"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
          onClick={onLogin}
          className="text-primary font-semibold hover:text-primary-light transition-colors duration-150"
        >
          Iniciar sesión
        </button>
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Sub-component: ForgotForm
// ─────────────────────────────────────────────────────────
type ForgotFormProps = { onBack: () => void };

const ForgotForm = ({ onBack }: ForgotFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock: supabase.auth.resetPasswordForEmail(email)
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
    toast.success("Correo enviado", {
      description: `Revisa tu bandeja: ${email}`,
    });
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-safe-subtle border border-safe-border flex items-center justify-center mx-auto mb-5">
          <MailCheck className="w-8 h-8 text-safe" />
        </div>
        <h3 className="font-display font-bold text-foreground text-xl mb-2">
          \u00a1Correo enviado!
        </h3>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Hemos enviado instrucciones a{" "}
          <strong className="text-foreground">{email}</strong> para restablecer
          tu contraseña. Revisa tu bandeja de entrada.
        </p>
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-11"
        >
          Volver al inicio de sesión
        </Button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-7"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="mb-6">
        <h2 className="font-display font-bold text-foreground text-2xl sm:text-3xl leading-tight">
          ¿Olvidaste tu contraseña?
        </h2>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
          Ingresa tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Correo electrónico</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="nombre@ejemplo.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="h-11"
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold"
          disabled={loading || !email}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Enviar enlace de recuperación"
          )}
        </Button>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const [view, setView] = useState<"login" | "register" | "forgot">("login");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Left: Branding panel */}
      <AuthBranding />

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 self-start sm:self-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-primary">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-foreground text-lg leading-none">
                Kipi Safe
              </span>
            </div>
          </div>
        </div>

        {/* Mode tabs (Login / Register) — only when not on forgot view */}
        {view !== "forgot" && (
          <div className="w-full max-w-[440px] mb-6">
            <div className="flex bg-muted rounded-xl p-1">
              {([
                { id: "login", label: "Iniciar Sesión" },
                { id: "register", label: "Crear Cuenta" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
                    view === tab.id
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form container */}
        <div className="w-full max-w-[440px]">
          {view === "login" && (
            <LoginForm
              onForgot={() => setView("forgot")}
              onRegister={() => setView("register")}
            />
          )}
          {view === "register" && (
            <RegisterForm onLogin={() => setView("login")} />
          )}
          {view === "forgot" && (
            <ForgotForm onBack={() => setView("login")} />
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground mt-10 text-center">
          Protección de datos conforme a{" "}
          <span className="font-medium text-foreground">GDPR y LFPDPPP</span>
        </p>
      </div>
    </div>
  );
}
