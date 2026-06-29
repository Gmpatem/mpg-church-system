"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  completePhonePasswordRecoveryAction,
  loginAction,
  requestPasswordRecoveryAction,
} from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/features/i18n";
import {
  DEFAULT_LOGIN_COUNTRY,
  LOGIN_COUNTRY_OPTIONS,
  identifierLooksLikeEmail,
  isLoginCountryCode,
  type LoginCountryCode,
} from "@/lib/auth/login-identifier";

export function LoginForm({ redirect = "", forgot = false }: { redirect?: string; forgot?: boolean }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [recoveryState, recoveryAction, recoveryPending] = useActionState(
    requestPasswordRecoveryAction,
    null
  );
  const [phoneRecoveryState, phoneRecoveryAction, phoneRecoveryPending] = useActionState(
    completePhonePasswordRecoveryAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(forgot);
  const [identifier, setIdentifier] = useState("");
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [country, setCountry] = useState<LoginCountryCode>(DEFAULT_LOGIN_COUNTRY);
  const [recoveryCountry, setRecoveryCountry] = useState<LoginCountryCode>(DEFAULT_LOGIN_COUNTRY);
  const { language } = useI18n();

  const isFr = language === "fr";
  const showLoginCountry = identifier.trim() !== "" && !identifierLooksLikeEmail(identifier);
  const showRecoveryCountry =
    recoveryIdentifier.trim() !== "" && !identifierLooksLikeEmail(recoveryIdentifier);
  const phoneRecoveryReady = recoveryState?.ok && recoveryState.method === "phone" && recoveryState.phone;

  useEffect(() => {
    setIsRecoveryMode(forgot);
  }, [forgot]);

  useEffect(() => {
    const savedCountry = window.localStorage.getItem("mpg-login-country");
    if (savedCountry && isLoginCountryCode(savedCountry)) {
      setCountry(savedCountry);
      setRecoveryCountry(savedCountry);
    }
  }, []);

  const countryOptions = useMemo(() => LOGIN_COUNTRY_OPTIONS, []);

  const updateCountry = (value: string, target: "login" | "recovery") => {
    if (!isLoginCountryCode(value)) return;
    window.localStorage.setItem("mpg-login-country", value);
    if (target === "login") {
      setCountry(value);
    } else {
      setRecoveryCountry(value);
    }
  };

  const labels = {
    identifier: isFr ? "Email ou numéro mobile" : "Email or mobile number",
    identifierPlaceholder: isFr ? "vous@exemple.com ou +237..." : "you@example.com or +237...",
    country: isFr ? "Pays" : "Country",
    password: isFr ? "Mot de passe" : "Password",
    passwordPlaceholder: isFr ? "Entrez votre mot de passe" : "Enter your password",
    signIn: isFr ? "Se connecter" : "Sign In",
    signingIn: isFr ? "Connexion..." : "Signing in...",
    forgotPassword: isFr ? "Mot de passe oublié ?" : "Forgot password?",
    recoveryTitle: isFr ? "Récupération du compte" : "Account recovery",
    recoveryCopy: isFr
      ? "Entrez votre email ou mobile pour recevoir les instructions."
      : "Enter your email or mobile number to receive recovery instructions.",
    sendRecovery: isFr ? "Envoyer les instructions" : "Send recovery instructions",
    sendingRecovery: isFr ? "Envoi..." : "Sending...",
    verificationCode: isFr ? "Code SMS" : "SMS code",
    newPassword: isFr ? "Nouveau mot de passe" : "New password",
    confirmNewPassword: isFr ? "Confirmer le mot de passe" : "Confirm password",
    updatePassword: isFr ? "Mettre à jour le mot de passe" : "Update password",
    updatingPassword: isFr ? "Mise à jour..." : "Updating...",
    backToSignIn: isFr ? "Retour à la connexion" : "Back to sign in",
  };

  if (isRecoveryMode) {
    return (
      <div className="grid gap-5 sm:gap-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700">
          <p className="font-medium text-slate-900">{labels.recoveryTitle}</p>
          <p className="mt-1 leading-6">{labels.recoveryCopy}</p>
        </div>

        {(recoveryState && !recoveryState.ok) && (
          <AuthAlert variant="error" message={recoveryState.error} />
        )}
        {(phoneRecoveryState && !phoneRecoveryState.ok) && (
          <AuthAlert variant="error" message={phoneRecoveryState.error} />
        )}
        {recoveryState?.ok && (
          <AuthAlert variant="success" message={recoveryState.message ?? ""} />
        )}

        <form action={recoveryAction} className="grid gap-5 sm:gap-6">
          <input type="hidden" name="recoveryCountry" value={recoveryCountry} />

          <div className="grid gap-2">
            <Label htmlFor="recoveryIdentifier" className="text-sm font-medium text-slate-700">
              {labels.identifier}
            </Label>
            <Input
              id="recoveryIdentifier"
              name="recoveryIdentifier"
              type="text"
              required
              value={recoveryIdentifier}
              onChange={(event) => setRecoveryIdentifier(event.target.value)}
              autoComplete="username"
              inputMode={showRecoveryCountry ? "tel" : "email"}
              placeholder={labels.identifierPlaceholder}
              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:border-cyan-500 focus:ring-cyan-500"
            />
          </div>

          {showRecoveryCountry && (
            <CountrySelect
              id="recoveryCountry"
              label={labels.country}
              value={recoveryCountry}
              options={countryOptions}
              onChange={(value) => updateCountry(value, "recovery")}
            />
          )}

          <button
            type="submit"
            disabled={recoveryPending}
            className="mobile-touch-feedback flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {recoveryPending ? (
              <span className="inline-flex items-center gap-2">
                <ButtonSpinner className="text-white" />
                {labels.sendingRecovery}
              </span>
            ) : (
              labels.sendRecovery
            )}
          </button>
        </form>

        {phoneRecoveryReady && (
          <form action={phoneRecoveryAction} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <input type="hidden" name="recoveryPhone" value={recoveryState.phone} />
            <input type="hidden" name="recoveryCountry" value={recoveryCountry} />

            <div className="grid gap-2">
              <Label htmlFor="recoveryOtp">{labels.verificationCode}</Label>
              <Input
                id="recoveryOtp"
                name="recoveryOtp"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base tracking-[0.25em]"
              />
            </div>

            <RecoveryPasswordField
              id="newPassword"
              name="newPassword"
              label={labels.newPassword}
              show={showNewPassword}
              onToggle={() => setShowNewPassword((value) => !value)}
            />

            <RecoveryPasswordField
              id="confirmNewPassword"
              name="confirmNewPassword"
              label={labels.confirmNewPassword}
              show={showConfirmNewPassword}
              onToggle={() => setShowConfirmNewPassword((value) => !value)}
            />

            <button
              type="submit"
              disabled={phoneRecoveryPending}
              className="mobile-touch-feedback flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phoneRecoveryPending ? (
                <span className="inline-flex items-center gap-2">
                  <ButtonSpinner className="text-white" />
                  {labels.updatingPassword}
                </span>
              ) : (
                labels.updatePassword
              )}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setIsRecoveryMode(false)}
          className="text-center text-sm font-medium text-cyan-700 transition hover:text-cyan-800"
        >
          {labels.backToSignIn}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5 sm:gap-6">
      <input type="hidden" name="redirect" value={redirect} />
      <input type="hidden" name="loginCountry" value={country} />

      {/* Error message */}
      {state && !state.ok && (
        <AuthAlert variant="error" message={state.error} />
      )}

      {/* Identifier field */}
      <div className="grid gap-2">
        <Label htmlFor="identifier" className="text-sm font-medium text-slate-700">
          {labels.identifier}
        </Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoComplete="username"
          inputMode={showLoginCountry ? "tel" : "email"}
          placeholder={labels.identifierPlaceholder}
          className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:border-cyan-500 focus:ring-cyan-500"
        />
      </div>

      {showLoginCountry && (
        <CountrySelect
          id="loginCountry"
          label={labels.country}
          value={country}
          options={countryOptions}
          onChange={(value) => updateCountry(value, "login")}
        />
      )}

      {/* Password field */}
      <div className="grid gap-2">
        <Label htmlFor="password" className="text-sm font-medium text-slate-700">
          {labels.password}
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder={labels.passwordPlaceholder}
            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pr-10 focus:border-cyan-500 focus:ring-cyan-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? (isFr ? "Masquer le mot de passe" : "Hide password") : (isFr ? "Afficher le mot de passe" : "Show password")}
            className="mobile-touch-feedback absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsRecoveryMode(true)}
        className="-mt-2 justify-self-end text-sm font-medium text-cyan-700 transition hover:text-cyan-800"
      >
        {labels.forgotPassword}
      </button>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending}
        className="mobile-touch-feedback flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <ButtonSpinner className="text-white" />
            {labels.signingIn}
          </span>
        ) : (
          labels.signIn
        )}
      </button>
    </form>
  );
}

function CountrySelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: LoginCountryCode;
  options: typeof LOGIN_COUNTRY_OPTIONS;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-cyan-500"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.callingCode} {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RecoveryPasswordField({
  id,
  name,
  label,
  show,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pr-10 focus:border-cyan-500 focus:ring-cyan-500"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="mobile-touch-feedback absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function AuthAlert({ variant, message }: { variant: "error" | "success"; message: string }) {
  const classes = variant === "error"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border px-4 py-3.5 text-sm ${classes}`}
    >
      <div className="flex items-start gap-2">
        <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={variant === "error" ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M5 13l4 4L19 7"} />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}
