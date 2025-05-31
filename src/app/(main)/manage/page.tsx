
import { AgentRenewalForm } from '@/components/forms/agent-renewal-form';
import { AgentRevocationForm } from '@/components/forms/agent-revoke-form';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDisplayableAgents } from '@/lib/db';
import type { AgentRecord } from '@/types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link'; // For potential future "Manage" links
import { Badge } from '@/components/ui/badge';

export default async function ManageAgentsPage() {
  const displayableAgents: AgentRecord[] = await getDisplayableAgents(10);

  return (
    <div className="space-y-12">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Agent Management</CardTitle>
          <CardDescription>
            Oversee and manage the lifecycle of your registered agents. Renew their registration, revoke them, or view an overview of currently active agents.
          </CardDescription>
        </CardHeader>
      </Card>

      <section id="agents-overview">
        <h2 className="text-2xl font-semibold mb-2 text-primary">Active Agents Overview</h2>
        <p className="mb-6 text-muted-foreground">
          A snapshot of recently registered or active agents in the directory.
        </p>
        <Card className="shadow-md">
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] w-full">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-[300px]">ANSName</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="w-[350px]">Actual Endpoint</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayableAgents.length > 0 ? (
                    displayableAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-mono text-xs break-all">{agent.ansName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            agent.protocol === 'a2a' ? 'default' :
                            agent.protocol === 'mcp' ? 'secondary' :
                            'outline' // for acp or others
                          }>{agent.protocol.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{agent.provider}</TableCell>
                        <TableCell>{agent.version}</TableCell>
                        <TableCell className="font-mono text-xs break-all">{agent.actualEndpoint}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No active agents found in the directory.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
           {displayableAgents.length > 0 && (
            <CardFooter className="text-xs text-muted-foreground pt-4 justify-end">
                Showing up to 10 most recently active agents.
            </CardFooter>
           )}
        </Card>
      </section>

      <Separator className="my-12" />
      
      <section id="renew-agent">
        <h2 className="text-2xl font-semibold mb-2 text-primary">Renew Agent</h2>
        <p className="mb-6 text-muted-foreground">
          Extend the registration validity of an existing agent by providing a new Certificate Signing Request (CSR).
        </p>
        <div className="flex justify-center">
         <AgentRenewalForm />
        </div>
      </section>

      <Separator className="my-12" />

      <section id="revoke-agent">
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Revoke Agent</h2>
         <p className="mb-6 text-muted-foreground">
          Permanently remove an agent's registration from the directory. This action cannot be undone.
        </p>
        <div className="flex justify-center">
          <AgentRevocationForm />
        </div>
      </section>
    </div>
  );
}
