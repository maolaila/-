export type ActionState = {
  ok?: boolean;
  message?: string;
};

export const emptyActionState: ActionState = {};

export function errorState(error: unknown): ActionState {
  if (error instanceof Error) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: "操作失败，请稍后重试" };
}
