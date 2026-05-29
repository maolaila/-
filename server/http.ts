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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "请求失败" }, { status: 500 });
}
