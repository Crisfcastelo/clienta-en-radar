import type { ReactNode } from "react";

interface Option {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  name: string;
  legend: string;
  options: Option[];
  defaultValue?: string | null;
  optional?: boolean;
  error?: string;
  errorId?: string;
}

/**
 * Grupo de opciones como "chips" grandes. Por debajo son radios nativos:
 * funcionan con teclado (flechas) y lectores de pantalla sin JavaScript extra.
 */
export function ChoiceChips({ name, legend, options, defaultValue, optional, error, errorId }: Props) {
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 font-semibold">
        {legend}
        {optional ? <span className="font-normal text-chocolate-suave"> (opcional)</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={defaultValue === option.value}
              className="peer sr-only"
            />
            <span
              className={
                "inline-flex min-h-12 items-center gap-2 rounded-full border border-borde-campo bg-superficie px-4 " +
                "peer-checked:border-2 peer-checked:border-bosque peer-checked:bg-salvia peer-checked:font-semibold " +
                "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bosque"
              }
            >
              {option.icon}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
