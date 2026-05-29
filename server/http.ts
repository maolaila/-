import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthFailure, ForbiddenFailure } from "@/server/auth";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.errors[0]?.message ?? "请求参数错误" }, { status: 400 });
  }
  if (error instanceof AuthFailure) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ForbiddenFailure) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }
  return NextResponse.json({ error: "请求失败" }, { status: 500 });
}

function safeErrorMessage(error: Error) {
  if (process.env.NODE_ENV !== "production" || /[\u4e00-\u9fff]/.test(error.message)) {
    return error.message;
  }
  return "请求失败";
}
