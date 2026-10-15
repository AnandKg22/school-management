import { NextResponse } from "next/server";

export function successResponse<T>(data: T, message?: string, status: number = 200, pagination?: any) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      pagination,
    },
    { status }
  );
}

export function errorResponse(message: string, code: string = "BAD_REQUEST", status: number = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      correlationId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    },
    { status }
  );
}
