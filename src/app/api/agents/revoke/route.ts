import { NextResponse, type NextRequest } from 'next/server';
import { AgentRevocationRequestSchema } from '@/lib/schemas';
import { findAgentByAnsName, revokeAgent } from '@/lib/db';
import type { AgentRevocationRequestPayload } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = AgentRevocationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request payload", details: validation.error.format() }, { status: 400 });
    }

    const data: AgentRevocationRequestPayload = validation.data;

    const existingAgent = await findAgentByAnsName(data.ansName);
    if (!existingAgent) {
      // If agent is already revoked, findAgentByAnsName (which checks !isRevoked) would return null.
      // So we can check if it was ever registered or already revoked.
      // const potentiallyRevokedAgent = agentsDB.find(a => a.ansName === data.ansName); // Direct DB check
      // if (potentiallyRevokedAgent && potentiallyRevokedAgent.isRevoked) {
      //    return NextResponse.json({ error: `Agent "${data.ansName}" is already revoked.` }, { status: 409 });
      // }
      return NextResponse.json({ error: `Agent with ANSName "${data.ansName}" not found or already revoked.` }, { status: 404 });
    }
    if (existingAgent.isRevoked) {
         return NextResponse.json({ error: `Agent "${data.ansName}" is already revoked.` }, { status: 409 });
    }


    const success = await revokeAgent(data.ansName);

    if (!success) {
      // This case implies agent was found initially but couldn't be marked as revoked in mock DB,
      // or was not found by revokeAgent for some reason.
      return NextResponse.json({ error: `Failed to revoke agent "${data.ansName}". Agent might not exist or already revoked.` }, { status: 404 });
    }

    return NextResponse.json({
      ansName: data.ansName,
      message: "Agent revoked successfully.",
      revocationTimestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error("Revocation Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during revocation.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
