import { useState } from "react";
import { REACTION_EMOJI, REACTION_LABEL } from "../../lib/utils";
import type { ReactionType } from "../../types";

const REACTIONS: ReactionType[] = [
  "LIKE",
  "LOVE",
  "HAHA",
  "WOW",
  "SAD",
  "ANGRY",
];

interface Props {
  onSelect: (type: ReactionType) => void;
}

export const ReactionPicker = ({ onSelect }: Props) => {
  const [hovered, setHovered] = useState<ReactionType | null>(null);

  return (
    <div className="flex items-end gap-1 bg-popover border rounded-full shadow-xl px-3 py-2">
      {REACTIONS.map((type) => (
        <div
          key={type}
          className="relative flex flex-col items-center"
          onMouseEnter={() => setHovered(type)}
          onMouseLeave={() => setHovered(null)}
        >
          <div
            className={cn(
              "absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none",
              "bg-popover border text-foreground text-[10px] font-medium",
              "px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-md",
              "transition-all duration-150",
              hovered === type
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-1",
            )}
          >
            {REACTION_LABEL[type]}
          </div>

          <button
            onClick={() => onSelect(type)}
            className={cn(
              "text-2xl leading-none p-0.5 transition-transform duration-150 origin-bottom",
              hovered === type ? "scale-150 -translate-y-1" : "scale-100",
            )}
          >
            {REACTION_EMOJI[type]}
          </button>
        </div>
      ))}
    </div>
  );
};

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
