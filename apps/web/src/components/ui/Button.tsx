import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function Button({ children, type = "button", className = "", ...props }: ButtonProps) {
  const classes = ["ch-button", className].filter(Boolean).join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
