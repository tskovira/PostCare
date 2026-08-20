import { and, eq, isNull } from "drizzle-orm";
import {
  supabasePublishableKey,
  supabaseUrl,
} from "../app/lib/supabase-config";
import { getDb } from ".";
import {
  auditEvents,
  authIdentities,
  documents,
  healthRecords,
  healthRecordVersions,
  shareGrants,
  users,
} from "./schema";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
};

async function backfillOwnership(userId: string, email: string) {
  const db = await getDb();
  await Promise.all([
    db
      .update(healthRecords)
      .set({ ownerUserId: userId })
      .where(
        and(
          eq(healthRecords.ownerEmail, email),
          isNull(healthRecords.ownerUserId),
        ),
      ),
    db
      .update(healthRecordVersions)
      .set({ ownerUserId: userId })
      .where(
        and(
          eq(healthRecordVersions.ownerEmail, email),
          isNull(healthRecordVersions.ownerUserId),
        ),
      ),
    db
      .update(documents)
      .set({ ownerUserId: userId })
      .where(
        and(eq(documents.ownerEmail, email), isNull(documents.ownerUserId)),
      ),
    db
      .update(auditEvents)
      .set({ ownerUserId: userId })
      .where(
        and(eq(auditEvents.ownerEmail, email), isNull(auditEvents.ownerUserId)),
      ),
    db
      .update(shareGrants)
      .set({ ownerUserId: userId })
      .where(
        and(eq(shareGrants.ownerEmail, email), isNull(shareGrants.ownerUserId)),
      ),
  ]);
}

export async function getCurrentUser(
  request: Request,
): Promise<CurrentUser | null> {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabasePublishableKey, authorization },
  });
  if (!response.ok) return null;
  const identity = (await response.json()) as {
    id?: string;
    email?: string;
    user_metadata?: { full_name?: string; name?: string };
  };
  if (!identity.id || !identity.email) return null;
  const email = identity.email.trim().toLowerCase();
  const db = await getDb();
  const [linked] = await db
    .select({
      id: users.id,
      email: users.primaryEmail,
      displayName: users.displayName,
    })
    .from(authIdentities)
    .innerJoin(users, eq(authIdentities.userId, users.id))
    .where(
      and(
        eq(authIdentities.provider, "supabase"),
        eq(authIdentities.providerSubject, identity.id),
      ),
    )
    .limit(1);
  if (linked) {
    await backfillOwnership(linked.id, email);
    return { ...linked, displayName: linked.displayName ?? null };
  }

  let [account] = await db
    .select()
    .from(users)
    .where(eq(users.primaryEmail, email))
    .limit(1);
  if (!account) {
    await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        primaryEmail: email,
        displayName:
          identity.user_metadata?.full_name ??
          identity.user_metadata?.name ??
          null,
      })
      .onConflictDoNothing();
    [account] = await db
      .select()
      .from(users)
      .where(eq(users.primaryEmail, email))
      .limit(1);
  }
  if (!account) throw new Error("Unable to create your PostCare account.");
  await db
    .insert(authIdentities)
    .values({
      id: crypto.randomUUID(),
      userId: account.id,
      provider: "supabase",
      providerSubject: identity.id,
      emailAtLink: email,
    })
    .onConflictDoNothing();
  await backfillOwnership(account.id, email);
  return {
    id: account.id,
    email: account.primaryEmail,
    displayName: account.displayName ?? null,
  };
}
