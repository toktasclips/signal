"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginRatelimit, registerRatelimit, forgotPasswordRatelimit } from "@/lib/ratelimit";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth";
import type { ActionState } from "@/types";

async function getIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-vercel-forwarded-for") ??
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getIp();
  const { success } = await loginRatelimit.limit(ip);
  if (!success) {
    return { status: "error", error: "Too many attempts. Please try again later." };
  }

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      error:
        error.message === "Invalid login credentials"
          ? "Incorrect email or password"
          : "Something went wrong. Please try again.",
    };
  }

  redirect("/hot-list");
}

export async function register(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getIp();
  const { success } = await registerRatelimit.limit(ip);
  if (!success) {
    return { status: "error", error: "Too many attempts. Please try again later." };
  }

  const raw = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return {
      status: "error",
      error: "Unable to create account. Please try again.",
    };
  }

  return {
    status: "success",
    message:
      "Account created! Check your email to confirm before signing in.",
  };
}

export async function forgotPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getIp();
  const { success } = await forgotPasswordRatelimit.limit(ip);
  if (!success) {
    return { status: "error", error: "Too many attempts. Please try again later." };
  }

  const raw = {
    email: formData.get("email") as string,
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
    }
  );

  if (error) {
    return {
      status: "error",
      error: "Unable to send reset email. Please try again.",
    };
  }

  return {
    status: "success",
    message: "If an account exists, a reset link has been sent to your email.",
  };
}

export async function updatePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = updatePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", error: "Unauthorized" };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      error: "Unable to update password. Please try again.",
    };
  }

  redirect("/hot-list");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
