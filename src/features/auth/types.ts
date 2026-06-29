import type { ActionState } from "@/features/access/types";
export type AuthActionState = ActionState;

export type PasswordRecoveryActionState =
  | {
      ok: true;
      message?: string;
      method?: "email" | "phone";
      phone?: string;
      error?: undefined;
    }
  | {
      ok: false;
      error: string;
      message?: undefined;
      method?: undefined;
      phone?: undefined;
    };
