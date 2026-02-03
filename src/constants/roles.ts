/**
 * Roles constants
 * KHÔNG hard-code role strings trong components
 */

export const ROLES = {
    ADMIN: "ADMIN",
    DOCTOR: "DOCTOR",
    PHARMACIST: "PHARMACIST",
    RECEPTIONIST: "RECEPTIONIST",
    PATIENT: "PATIENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role labels (for display)
export const ROLE_LABELS: Record<Role, string> = {
    [ROLES.ADMIN]: "Admin (QTV)",
    [ROLES.DOCTOR]: "Bác sĩ",
    [ROLES.PHARMACIST]: "Dược sĩ",
    [ROLES.RECEPTIONIST]: "Lễ tân",
    [ROLES.PATIENT]: "Bệnh nhân",
};

// Role colors (for badges)
export const ROLE_COLORS: Record<Role, { bg: string; text: string; dot: string }> = {
    [ROLES.ADMIN]: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-700 dark:text-gray-300",
        dot: "bg-gray-500",
    },
    [ROLES.DOCTOR]: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        dot: "bg-blue-500",
    },
    [ROLES.PHARMACIST]: {
        bg: "bg-teal-50 dark:bg-teal-900/20",
        text: "text-teal-700 dark:text-teal-300",
        dot: "bg-teal-500",
    },
    [ROLES.RECEPTIONIST]: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        text: "text-purple-700 dark:text-purple-300",
        dot: "bg-purple-500",
    },
    [ROLES.PATIENT]: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        dot: "bg-green-500",
    },
};
