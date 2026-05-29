export type ActionState = {
  ok?: boolean;
  message?: string;
};

export const emptyActionState: ActionState = {};

export function errorState(error: unknown): ActionState {
  if (error instanceof Error) {
    return { ok: false, message: safeErrorMessage(error) };
  }
  return { ok: false, message: "操作失败，请稍后重试" };
}

function safeErrorMessage(error: Error) {
  if (process.env.NODE_ENV !== "production" || /[\u4e00-\u9fff]/.test(error.message)) {
    return error.message;
  }
  return "操作失败，请稍后重试";
}
