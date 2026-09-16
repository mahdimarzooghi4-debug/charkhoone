import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

type ButtonLinkVariant = "accent" | "surface" | "outline" | "primary";

type ButtonLinkProps = PropsWithChildren<
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    variant?: ButtonLinkVariant;
  }
>;

export function ButtonLink({ children, className = "", variant = "primary", ...props }: ButtonLinkProps) {
  const classes = ["ch-button-link", `ch-button-link--${variant}`, className].filter(Boolean).join(" ");

  return (
    <a className={classes} {...props}>
      {children}
    </a>
  );
}
