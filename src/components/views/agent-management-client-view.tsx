
"use client";

import type { AgentRecord } from '@/types';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AgentRenewalForm } from '@/components/forms/agent-renewal-form';
import { AgentRevocationForm } from '@/components/forms/agent-revoke-form';
import { cn } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';

interface AgentManagementClientViewProps {
  initialAgents: AgentRecord[];
}

export function AgentManagementClientView({ initialAgents }: AgentManagementClientViewProps) {
  const [displayableAgents, setDisplayableAgents] = useState<AgentRecord[]>(initialAgents);
  const [selectedAgentAnsName, setSelectedAgentAnsName] = useState<string | null>(null);

  // In a real app, you might refetch or update agents after operations
  // For now, this client view only deals with the initial list.

  return (
    <div className="space-y-12">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Agent Management</CardTitle>
          <CardDescription>
            Oversee and manage the lifecycle of your registered agents. Select an agent from the table below to renew or revoke its registration.
          </CardDescription>
        </CardHeader>
      </Card>

      <section id="agents-overview">
        <h2 className="text-2xl font-semibold mb-2 text-primary">Active Agents Overview</h2>
        <p className="mb-6 text-muted-foreground">
          A snapshot of recently registered or active agents in the directory. Click on an agent to manage it.
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
                      <TableRow
                        key={agent.id}
                        onClick={() => setSelectedAgentAnsName(agent.ansName)}
                        className={cn(
                          "cursor-pointer",
                          // Styling for selected state handled by global CSS tr[data-state='selected']
                        )}
                        data-state={selectedAgentAnsName === agent.ansName ? 'selected' : 'none'}
                      >
                        <TableCell className="font-mono text-xs break-all">{agent.ansName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            agent.protocol === 'a2a' ? 'default' :
                            agent.protocol === 'mcp' ? 'secondary' :
                            'outline'
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
                Showing up to {displayableAgents.length} most recently active agents. Click a row to select.
            </CardFooter>
           )}
        </Card>
      </section>

      <Separator className="my-12" />
      
      <section id="renew-agent">
        <h2 className="text-2xl font-semibold mb-2 text-primary">Renew Agent</h2>
        <p className="mb-6 text-muted-foreground">
          Extend the registration validity of an existing agent by providing a new Certificate Signing Request (CSR).
          {selectedAgentAnsName ? <span className="block font-semibold text-sm text-primary">Renewing: {selectedAgentAnsName}</span> : <span className="block text-sm text-muted-foreground">Select an agent from the table above.</span>}
        </p>
        <fieldset disabled={!selectedAgentAnsName} className="space-y-2">
           <legend className="sr-only">Renew Agent Form</legend>
           {!selectedAgentAnsName && 
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg text-muted-foreground min-h-[100px] bg-card">
                <ShieldAlert className="h-8 w-8 mb-2 text-muted-foreground/70"/>
                <p>Please select an agent from the table above to enable renewal.</p>
            </div>
            }
          <div className={cn("flex justify-center", !selectedAgentAnsName && "opacity-50 pointer-events-none")}>
            <AgentRenewalForm selectedAnsName={selectedAgentAnsName} />
          </div>
        </fieldset>
      </section>

      <Separator className="my-12" />

      <section id="revoke-agent">
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Revoke Agent</h2>
         <p className="mb-6 text-muted-foreground">
          Permanently remove an agent's registration from the directory. This action cannot be undone.
          {selectedAgentAnsName ? <span className="block font-semibold text-sm text-destructive">Revoking: {selectedAgentAnsName}</span> : <span className="block text-sm text-muted-foreground">Select an agent from the table above.</span>}
        </p>
        <fieldset disabled={!selectedAgentAnsName} className="space-y-2">
            <legend className="sr-only">Revoke Agent Form</legend>
            {!selectedAgentAnsName && 
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg text-muted-foreground min-h-[100px] bg-card">
                <ShieldAlert className="h-8 w-8 mb-2 text-muted-foreground/70"/>
                <p>Please select an agent from the table above to enable revocation.</p>
            </div>
            }
           <div className={cn("flex justify-center", !selectedAgentAnsName && "opacity-50 pointer-events-none")}>
            <AgentRevocationForm selectedAnsName={selectedAgentAnsName} />
           </div>
        </fieldset>
      </section>
    </div>
  );
}
