
'use server';

import { findAgentByAnsName, renewAgent as dbRenewAgent, revokeAgent as dbRevokeAgent, getDisplayableAgents as dbGetDisplayableAgents } from '@/lib/db';
import type { AgentRecord } from '@/types';

const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

export async function directRenewAgentAction(ansName: string): Promise<{ success: boolean; message: string; updatedAgent?: AgentRecord }> {
  try {
    const agent = await findAgentByAnsName(ansName);
    if (!agent) {
      return { success: false, message: `Agent ${ansName} not found or already revoked.` };
    }

    const updatedAgent = await dbRenewAgent(
      ansName,
      null, // No new certificate PEM for direct table renewal
      undefined, // No change to protocol extensions
      undefined, // No change to actual endpoint
      THIRTY_DAYS_IN_SECONDS // New TTL for 30 days
    );

    if (updatedAgent) {
      return { success: true, message: `Agent ${ansName} renewed successfully for 30 days.`, updatedAgent };
    } else {
      return { success: false, message: `Failed to renew agent ${ansName}.` };
    }
  } catch (error) {
    console.error(`Error in directRenewAgentAction for ${ansName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during renewal.";
    return { success: false, message: errorMessage };
  }
}

export async function directRevokeAgentAction(ansName: string): Promise<{ success: boolean; message: string; revokedAnsName?: string }> {
  try {
    const agent = await findAgentByAnsName(ansName);
    if (!agent) {
      return { success: false, message: `Agent ${ansName} not found or already revoked (cannot revoke again).` };
    }

    const success = await dbRevokeAgent(ansName);
    if (success) {
      return { success: true, message: `Agent ${ansName} revoked successfully.`, revokedAnsName: ansName };
    } else {
      // This case might be redundant if findAgentByAnsName already checks for active agents
      return { success: false, message: `Failed to revoke agent ${ansName}. It might have been already revoked or not found.` };
    }
  } catch (error) {
    console.error(`Error in directRevokeAgentAction for ${ansName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during revocation.";
    return { success: false, message: errorMessage };
  }
}

export async function fetchDisplayableAgentsAction(): Promise<AgentRecord[]> {
    try {
        const agents = await dbGetDisplayableAgents(10); // Fetch top 10 agents
        return agents;
    } catch (error) {
        console.error("Error in fetchDisplayableAgentsAction:", error);
        return []; // Return empty array on error
    }
}
