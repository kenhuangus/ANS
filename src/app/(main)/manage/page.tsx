
import { getDisplayableAgents } from '@/lib/db';
import { AgentManagementClientView } from '@/components/views/agent-management-client-view';
import type { AgentRecord } from '@/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ManageAgentsPage() {
  const initialAgents: AgentRecord[] = await getDisplayableAgents(10);

  return (
    <div className="space-y-8">
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Agent Management</CardTitle>
          <CardDescription>
            Oversee and manage the lifecycle of your registered agents. Renew or revoke their registration directly from the table below.
          </CardDescription>
        </CardHeader>
      </Card>
      <AgentManagementClientView initialAgents={initialAgents} />
    </div>
  );
}
