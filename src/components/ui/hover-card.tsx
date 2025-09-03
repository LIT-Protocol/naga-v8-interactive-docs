/**
 * HoverCard UI
 *
 * Lightweight wrapper around @radix-ui/react-hover-card to provide
 * a consistent import path and simple, typed exports.
 *
 * Usage:
 * import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
 */

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;
export const HoverCardContent = HoverCardPrimitive.Content;


