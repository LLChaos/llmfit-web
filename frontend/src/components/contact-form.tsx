"use client";

import { useState, type FormEvent } from "react";
import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const { t } = useTranslation();

  function validate(data: ContactFormData): FormErrors {
    const errors: FormErrors = {};
    if (!data.name.trim()) {
      errors.name = t("form.name_required");
    }
    if (!data.email.trim()) {
      errors.email = t("form.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = t("form.email_invalid");
    }
    if (!data.subject.trim()) {
      errors.subject = t("form.subject_required");
    }
    if (!data.message.trim()) {
      errors.message = t("form.message_required");
    } else if (data.message.trim().length < 10) {
      errors.message = t("form.message_min_length");
    }
    return errors;
  }

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const handleChange = (
    field: keyof ContactFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: keyof ContactFormData) => {
    setTouched((prev) => new Set(prev).add(field));
    const fieldErrors = validate(formData);
    if (fieldErrors[field]) {
      setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(new Set(["name", "email", "subject", "message"]));

    const fieldErrors = validate(formData);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setStatus("submitting");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTouched(new Set());
      } else {
        throw new Error("Server returned error");
      }
    } catch {
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTouched(new Set());
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-6 text-center">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
        <h3 className="font-semibold text-lg">{t("form.success")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          <a
            href="mailto:contact@example.com"
            className="text-primary hover:underline"
          >
            contact@example.com
          </a>
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {t("form.submit")}
        </button>
      </div>
    );
  }

  const fields: {
    key: keyof ContactFormData;
    labelKey: TranslationKey;
    type: string;
    rows?: number;
  }[] = [
    { key: "name", labelKey: "form.name" as TranslationKey, type: "text" },
    { key: "email", labelKey: "form.email" as TranslationKey, type: "email" },
    { key: "subject", labelKey: "form.subject" as TranslationKey, type: "text" },
    { key: "message", labelKey: "form.message" as TranslationKey, type: "textarea", rows: 5 },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {fields.map((f) => {
        const hasError = touched.has(f.key) && errors[f.key];
        const inputClasses = cn(
          "w-full rounded-md border bg-background px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          "transition-colors",
          hasError
            ? "border-red-500 focus:ring-red-400"
            : "border-input"
        );

        return (
          <div key={f.key}>
            <label
              htmlFor={`contact-${f.key}`}
              className="block text-sm font-medium mb-1.5"
            >
              {t(f.labelKey)}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={`contact-${f.key}`}
                rows={f.rows}
                placeholder={t(f.labelKey)}
                value={formData[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                onBlur={() => handleBlur(f.key)}
                className={inputClasses}
                maxLength={2000}
              />
            ) : (
              <input
                id={`contact-${f.key}`}
                type={f.type}
                placeholder={t(f.labelKey)}
                value={formData[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                onBlur={() => handleBlur(f.key)}
                className={inputClasses}
                maxLength={200}
              />
            )}
            {hasError && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors[f.key]}
              </p>
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={status === "submitting"}
        className={cn(
          "inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5",
          "text-sm font-medium text-primary-foreground",
          "hover:bg-primary/90 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("form.sending")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t("form.submit")}
          </>
        )}
      </button>
    </form>
  );
}
