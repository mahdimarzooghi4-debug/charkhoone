import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ id, label, className = "", ...props }: TextFieldProps) {
  const inputId = id ?? `field-${label.replace(/\s+/g, "-")}`;
  const classes = ["ch-field__input", className].filter(Boolean).join(" ");

  return (
    <div className="ch-field" data-node-id="35:200">
      <label className="ch-field__label" htmlFor={inputId} data-node-id="35:201">
        {label}
      </label>
      <input id={inputId} className={classes} data-node-id="35:202" {...props} />
    </div>
  );
}
