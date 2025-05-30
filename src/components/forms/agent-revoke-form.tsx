"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AgentRevocationRequestSchema, type AgentRevocationRequestPayload } from "@/lib/schemas";
import type { AgentRevocationResponse } from "@/types";
import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AgentRevocationForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [revocationResult, setRevocationResult] = useState<AgentRevocationResponse | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const form = useForm<AgentRevocationRequestPayload>({
    resolver: zodResolver(AgentRevocationRequestSchema),
    defaultValues: {
      ansName: "a2a://agentToBeRevoked.service.MyOrg.v1.0",
    },
  });

  async function handleRevokeConfirm() {
    setShowConfirmDialog(false);
    const data = form.getValues(); 
    setIsLoading(true);
    setRevocationResult(null);
    // TODO: In a future step, if ansName is empty, call a Genkit flow to suggest one or pick from a list.
    // For now, the backend will validate if ansName is present.
    try {
      const response = await fetch('/api/agents/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Revocation failed");
      }
      
      setRevocationResult(result as AgentRevocationResponse);
      toast({
        title: "Revocation Attempted",
        description: result.message || `Agent ${result.ansName} revocation processed.`,
      });
      // form.reset();
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Revocation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  function onSubmitWithConfirm(_data: AgentRevocationRequestPayload) {
    // Client-side check before showing dialog
    const currentAnsName = form.getValues().ansName;
    if (!currentAnsName || currentAnsName.trim() === "") {
      toast({
        title: "ANSName Required",
        description: "Please enter the ANSName of the agent to revoke.",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  }


  return (
    <Card className="w-full max-w-xl shadow-xl border-destructive">
      <CardHeader>
        <CardTitle className="text-2xl text-destructive flex items-center">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Revoke Agent Registration
        </CardTitle>
        <CardDescription>
          Enter the ANSName of the agent to revoke. This action is irreversible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitWithConfirm)} className="space-y-6">
            <FormField
              control={form.control}
              name="ansName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ANSName of Agent to Revoke</FormLabel>
                  <FormControl><Input placeholder="e.g., a2a://rogueagent.service.MyOrg.v1.0" {...field} value={field.value || ""} className="border-destructive focus:ring-destructive" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogTrigger asChild>
                <Button type="submit" variant="destructive" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Revoke Registration
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently revoke the agent registration for
                    <span className="font-semibold break-all"> {form.getValues().ansName || "this agent"}</span>.
                    The agent will no longer be discoverable or resolvable.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevokeConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Yes, Revoke Agent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        </Form>

        {revocationResult && (
          <Card className="mt-6 bg-muted">
            <CardHeader><CardTitle className="text-destructive">Revocation Processed</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>ANSName:</strong> {revocationResult.ansName}</p>
              <p><strong>Message:</strong> {revocationResult.message}</p>
              <p><strong>Revocation Timestamp:</strong> {new Date(revocationResult.revocationTimestamp).toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}