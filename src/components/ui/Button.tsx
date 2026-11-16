import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

// Ortak düğme stilleri: görünümü değiştirmek için yalnızca bu dosya düzenlenir.

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "rounded-full bg-violet text-white hover:bg-sky",
  secondary: "rounded-full bg-lilac text-ink hover:bg-violet/15",
  ghost: "text-violet hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-6 py-3 text-sm",
  sm: "px-4 py-2 text-sm",
};

// Hem düğme hem bağlantı için aynı sınıf dizesini üretir.
export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = "",
): string {
  const spacing = variant === "ghost" ? "" : sizes[size];
  return [base, variants[variant], spacing, extra].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...rest}
    />
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
