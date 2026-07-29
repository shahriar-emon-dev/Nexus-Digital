import { AvatarGroup } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type Teammate = { name: string; src?: string; status?: "online" | "away" };

/**
 * Who else is in the workspace. The overlapping avatars are decorative — the
 * names are also exposed as text in the tooltip, so presence is never conveyed
 * by a row of unlabelled faces alone.
 */
export function TeamPresence({ people }: { people: Teammate[] }) {
  if (!people.length) return null;
  const names = people.map((p) => p.name).join(", ");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className="hidden cursor-default items-center rounded-full sm:flex"
            aria-label={`${people.length} teammates online: ${names}`}
            tabIndex={0}
          >
            <AvatarGroup people={people} size="sm" max={3} />
          </div>
        }
      />
      <TooltipContent side="bottom">
        <span className="font-semibold">Online now</span>
        <br />
        {names}
      </TooltipContent>
    </Tooltip>
  );
}
