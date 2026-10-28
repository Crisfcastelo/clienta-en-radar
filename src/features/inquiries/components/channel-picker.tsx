import { CHANNEL_LABELS } from "../domain/labels";
import { INQUIRY_CHANNELS } from "../domain/types";
import { ChannelIcon } from "./channel-tag";

interface Props {
  defaultValue?: string | null;
  error?: string;
  errorId?: string;
}

/**
 * Canal como cuatro mosaicos de un toque. Por debajo son radios nativos:
 * funcionan con flechas del teclado y con lectores de pantalla.
 */
export function ChannelPicker({ defaultValue, error, errorId }: Props) {
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 font-semibold">
        Canal <span className="font-normal text-chocolate-suave">(opcional)</span>
      </legend>
      <div className="grid grid-cols-4 gap-2">
        {INQUIRY_CHANNELS.map((channel) => (
          <label key={channel} className="relative cursor-pointer">
            <input
              type="radio"
              name="channel"
              value={channel}
              defaultChecked={defaultValue === channel}
              className="peer sr-only"
            />
            <span
              className={
                "flex aspect-square max-h-24 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-borde bg-superficie px-1 text-[0.8rem] text-chocolate-suave shadow-(--shadow-suave) " +
                "peer-checked:border-bosque peer-checked:bg-bosque peer-checked:font-semibold peer-checked:text-white " +
                "peer-checked:[&_svg]:text-white " +
                "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bosque"
              }
            >
              <ChannelIcon channel={channel} className="size-7" />
              {CHANNEL_LABELS[channel]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
