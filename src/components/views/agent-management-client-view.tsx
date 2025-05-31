
"use client";

import type { AgentRecord } from '@/types';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, ShieldAlert, Info } from 'lucide-react';
import { directRenewAgentAction, directRevokeAgentAction, fetchDisplayableAgentsAction } from '@/app/actions/db/agent-actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, formatDistanceToNowStrict, addSeconds } from 'date-fns';
import { cn } from '@/lib/utils';

interface AgentManagementClientViewProps {
  initialAgents: AgentRecord[];
}

export function AgentManagementClientView({ initialAgents }: AgentManagementClientViewProps) {
  const [agents, setAgents] = useState<AgentRecord[]>(initialAgents);
  const [isLoading, setIsLoading] = useState(false); 
  const [actionStates, setActionStates] = useState<Record<string, { renewing?: boolean; revoking?: boolean }>>({});
  const { toast } = useToast();

  const refreshAgents = async () => {
    setIsLoading(true);
    try {
      const updatedAgents = await fetchDisplayableAgentsAction();
      setAgents(updatedAgents);
    } catch (error) {
      toast({ title: "Error", description: "Failed to refresh agent list.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setAgents(initialAgents);
  }, [initialAgents]);


  const handleRenew = async (ansName: string) => {
    setActionStates(prev => ({ ...prev, [ansName]: { ...prev[ansName], renewing: true } }));
    const result = await directRenewAgentAction(ansName);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      await refreshAgents();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setActionStates(prev => ({ ...prev, [ansName]: { ...prev[ansName], renewing: false } }));
  };

  const handleRevoke = async (ansName: string) => {
    setActionStates(prev => ({ ...prev, [ansName]: { ...prev[ansName], revoking: true } }));
    const result = await directRevokeAgentAction(ansName);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      await refreshAgents(); 
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
     setActionStates(prev => ({ ...prev, [ansName]: { ...prev[ansName], revoking: false } }));
  };
  
  const formatRenewalTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return format(new Date(timestamp), 'MMM d, yyyy HH:mm');
  };

  const formatExpiry = (registrationTimestamp: string, ttl: number, renewalTimestamp: string | null) => {
    const referenceDate = renewalTimestamp ? new Date(renewalTimestamp) : new Date(registrationTimestamp);
    const expiryDate = addSeconds(referenceDate, ttl);
    const now = new Date();

    if (expiryDate < now) {
      return <span className="text-destructive">Expired</span>;
    }
    return `In ${formatDistanceToNowStrict(expiryDate)}`;
  };


  return (
    <section id="agents-overview">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-primary">Agent Records Overview</h2>
        <Button onClick={refreshAgents} variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh List
        </Button>
      </div>
      <p className="mb-6 text-muted-foreground">
        A snapshot of recently registered or updated agent records. Renew or revoke them directly.
      </p>
      <Card className="shadow-md">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[250px]">ANSName</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Renewed</TableHead>
                  <TableHead>Status / Expires In</TableHead>
                  <TableHead className="w-[200px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <TableRow 
                      key={agent.id}
                      className={cn(agent.isRevoked && 'italic text-muted-foreground line-through opacity-70')}
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
                      <TableCell className="text-xs">{formatRenewalTimestamp(agent.renewalTimestamp)}</TableCell>
                      <TableCell className={cn("text-xs", agent.isRevoked && "text-destructive")}>
                        {agent.isRevoked ? 'Revoked' : formatExpiry(agent.registrationTimestamp, agent.ttl, agent.renewalTimestamp)}
                      </TableCell>
                      <TableCell className="space-x-2 text-center">
                        {agent.isRevoked ? (
                           <Badge variant="destructive" className="text-xs items-center">
                             <ShieldAlert className="h-3 w-3 mr-1" /> Revoked
                           </Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRenew(agent.ansName)}
                              disabled={actionStates[agent.ansName]?.renewing || actionStates[agent.ansName]?.revoking}
                              className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 px-2"
                            >
                              {actionStates[agent.ansName]?.renewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4"/>}
                               <span className="ml-1">Renew (30d)</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionStates[agent.ansName]?.renewing || actionStates[agent.ansName]?.revoking}
                                  className="h-8 px-2"
                                >
                                  {actionStates[agent.ansName]?.revoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                   <span className="ml-1">Revoke</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently revoke agent: <br />
                                    <strong className="font-mono break-all">{agent.ansName}</strong>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRevoke(agent.ansName)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Yes, Revoke Agent
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      <div className="flex flex-col items-center justify-center">
                        <Info className="h-10 w-10 mb-2 text-muted-foreground/70"/>
                        <p className="text-lg">No agent records found.</p>
                        <p className="text-sm">Register new agents via the "Register Agent" page.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
         {agents.length > 0 && (
          <CardFooter className="text-xs text-muted-foreground pt-4 justify-end">
              Showing up to {agents.length} most recent agent records.
          </CardFooter>
         )}
      </Card>
    </section>
  );
}
