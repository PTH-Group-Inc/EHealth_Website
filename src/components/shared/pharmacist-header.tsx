"use client";

import { SettingsDropdown } from "./settings-dropdown";
import { NotificationBell } from "./NotificationBell";
import { LanguageSwitcher } from "./LanguageSwitcher";
import AIStatusBadge from '@/components/ai-copilot/AIStatusBadge';
import AISearchBar from '@/components/ai-copilot/AISearchBar';
import AIGamificationBadge from '@/components/ai-copilot/AIGamificationBadge';

export function PharmacistHeader() {
    return (
        <header className="h-16 border-b border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1e242b] flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3 flex-1">
                <AISearchBar />
            </div>
            <div className="flex items-center gap-2">
                <AIGamificationBadge />
                <AIStatusBadge />
                <LanguageSwitcher variant="compact" />
                <NotificationBell />
                <SettingsDropdown />
            </div>
        </header>
    );
}
