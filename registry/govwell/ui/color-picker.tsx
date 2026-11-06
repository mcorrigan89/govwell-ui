'use client';

import * as React from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// A colour, picked in a square popover: a saturation field and hue bar
// (react-colorful, squared off), a hex box like <Input>, and a row of preset
// swatches — by default the GovWell brand colours. The trigger is a text box
// showing the swatch and its hex; `showValue={false}` makes it a swatch-only
// square. Values are "#rrggbb", lowercase; onValueChange fires as the colour
// moves, onValueCommit once when the popover closes on a changed colour.

const GOVWELL_COLORS = [
  { name: 'Slate', value: '#202020' },
  { name: 'Concrete', value: '#7c7c7c' },
  { name: 'Cement', value: '#b1b1b1' },
  { name: 'Ash', value: '#d9d9d9' },
  { name: 'Base grey', value: '#ececec' },
  { name: 'Hope', value: '#feaf0e' },
  { name: 'Sky', value: '#41aaeb' },
  { name: 'Field', value: '#39c25e' },
];

/** "#abc", "abc", "#AABBCC" → "#aabbcc"; null when it isn't a hex colour. */
function normalizeHexColor(value: string): string | null {
  const hex = value.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(hex)) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  return `#${full.toLowerCase()}`;
}

type ColorPreset = string | { name: string; value: string };

function ColorPicker({
  value,
  onValueChange,
  onValueCommit,
  presets = GOVWELL_COLORS,
  showValue = true,
  size = 'default',
  disabled,
  className,
  'aria-label': ariaLabel = 'Colour',
  ...props
}: Omit<React.ComponentProps<'button'>, 'value' | 'defaultValue' | 'onChange'> & {
  /** "#rgb" or "#rrggbb" */
  value: string;
  onValueChange: (hex: string) => void;
  /** once, when the popover closes on a colour different from the one it opened on */
  onValueCommit?: (hex: string) => void;
  /** swatches under the picker; pass [] for none */
  presets?: ColorPreset[];
  /** show the hex beside the swatch (default); false is a swatch-only square */
  showValue?: boolean;
  size?: 'sm' | 'default';
}) {
  const [open, setOpen] = React.useState(false);
  const hex = normalizeHexColor(value) ?? '#000000';
  const atOpen = React.useRef(hex);
  const change = (next: string) => {
    const normalized = normalizeHexColor(next);
    if (normalized && normalized !== hex) onValueChange(normalized);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) atOpen.current = hex;
        else if (hex !== atOpen.current) onValueCommit?.(hex);
        setOpen(next);
      }}
    >
      <PopoverTrigger
        data-slot="color-picker"
        disabled={disabled}
        aria-label={showValue ? `${ariaLabel}: ${hex}` : ariaLabel}
        className={cn(
          'inline-flex shrink-0 items-center gap-3 rounded-none border border-input bg-background text-foreground transition-colors outline-none hover:border-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error data-popup-open:border-foreground',
          size === 'sm' ? 'h-10' : 'h-12',
          showValue ? (size === 'sm' ? 'px-2.5 text-sm' : 'px-3 text-base') : size === 'sm' ? 'w-10 justify-center' : 'w-12 justify-center',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          data-slot="color-picker-swatch"
          className={cn('block shrink-0 border border-border', size === 'sm' ? 'size-5' : 'size-6')}
          style={{ backgroundColor: hex }}
        />
        {showValue && <span className="font-light tabular-nums">{hex}</span>}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 gap-3 p-3 [&_.react-colorful]:h-44 [&_.react-colorful]:w-full [&_.react-colorful__hue]:h-4 [&_.react-colorful__hue]:rounded-none [&_.react-colorful__last-control]:rounded-none [&_.react-colorful__pointer]:size-5 [&_.react-colorful__pointer]:rounded-none [&_.react-colorful__pointer]:border-2 [&_.react-colorful__saturation]:rounded-none [&_.react-colorful__saturation]:border-b-0"
      >
        <HexColorPicker color={hex} onChange={change} aria-label={`${ariaLabel} spectrum`} />
        <HexColorInput
          prefixed
          color={hex}
          aria-label={`${ariaLabel} hex`}
          // only six digits are taken as you type, so "#f00" doesn't jump to
          // "#ff0000" before you finish; three are fine on blur
          onChange={(next) => {
            if (/^#?[0-9a-f]{6}$/i.test(next)) change(next);
          }}
          onBlur={(e) => change(e.currentTarget.value)}
          className="h-10 w-full rounded-none border border-input bg-background px-3 text-sm font-light text-foreground tabular-nums transition-colors outline-none hover:border-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
        />
        {presets.length > 0 && (
          <div role="group" aria-label="Preset colours" className="grid grid-cols-8 gap-1.5">
            {presets.map((preset) => {
              const { name, value: presetValue } = typeof preset === 'string' ? { name: preset, value: preset } : preset;
              const presetHex = normalizeHexColor(presetValue) ?? presetValue;
              return (
                <button
                  key={presetHex}
                  type="button"
                  data-slot="color-picker-preset"
                  aria-label={name}
                  title={name}
                  aria-pressed={presetHex === hex}
                  onClick={() => change(presetHex)}
                  className="aspect-square w-full rounded-none border border-border outline-none hover:outline-1 hover:outline-offset-1 hover:outline-solid hover:outline-input focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring aria-pressed:outline-2 aria-pressed:outline-offset-1 aria-pressed:outline-solid aria-pressed:outline-foreground"
                  style={{ backgroundColor: presetHex }}
                />
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { ColorPicker, GOVWELL_COLORS, normalizeHexColor };
export type { ColorPreset };
