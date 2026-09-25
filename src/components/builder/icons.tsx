import { Bot, Clapperboard, Gem, Megaphone, Monitor, PenTool, Search, ShoppingBag, Smartphone, type LucideIcon } from "lucide-react";
import type { CatalogIcon } from "@/config/catalog";

export const SERVICE_ICONS: Record<CatalogIcon, LucideIcon> = {
  gem: Gem,
  monitor: Monitor,
  "shopping-bag": ShoppingBag,
  "pen-tool": PenTool,
  smartphone: Smartphone,
  bot: Bot,
  search: Search,
  megaphone: Megaphone,
  clapperboard: Clapperboard,
};
