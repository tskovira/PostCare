import { createClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "./supabase-config";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) { const { data } = await supabase.auth.getSession(); const headers = new Headers(init.headers); if (data.session?.access_token) headers.set("authorization", `Bearer ${data.session.access_token}`); return fetch(input, { ...init, headers }); }
export async function openAuthenticatedFile(url: string) { const response = await authFetch(url); if (!response.ok) throw new Error("Unable to open this file."); const blobUrl = URL.createObjectURL(await response.blob()); window.open(blobUrl, "_blank", "noopener,noreferrer"); window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000); }
