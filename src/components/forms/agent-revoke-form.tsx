
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
import { useState, useEffect } from "react";
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

interface AgentRevocationFormProps {
  // This component is no longer used in the main management flow, 
  // but keeping its structure for potential future re-use or direct access.
  // selectedAnsName prop is effectively deprecated by the table-based action.
  selectedAnsName?: string | null;
}

const REVOCATION_FORM_DEFAULT_ANSNAME = "mcp://sentimentAnalyzer.text.ExampleCorp.v1.2.0"; 

export function AgentRevocationForm({ selectedAnsName }: AgentRevocationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [revocationResult, setRevocationResult] = useState<AgentRevocationResponse | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const form = useForm<AgentRevocationRequestPayload>({
    resolver: zodResolver(AgentRevocationRequestSchema),
    defaultValues: {
      ansName: selectedAnsName || REVOCATION_FORM_DEFAULT_ANSNAME,
    },
  });

  useEffect(() => {
    const newAnsName = selectedAnsName || REVOCATION_FORM_DEFAULT_ANSNAME;
    form.setValue('ansName', newAnsName, { shouldValidate: true, shouldDirty: true });
    if (form.getValues().ansName !== newAnsName || selectedAnsName) {
        setRevocationResult(null); 
    }
  }, [selectedAnsName, form]);

  async function handleRevokeConfirm() {
    setShowConfirmDialog(false);
    const ansNameToRevoke = form.getValues().ansName; 
    
    if (!ansNameToRevoke) {
      toast({
        title: "ANSName Required",
        description: "Cannot revoke agent without an ANSName.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRevocationResult(null);
    try {
      const response = await fetch('/api/agents/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ansName: ansNameToRevoke }),
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
    const currentAnsName = form.getValues().ansName;
    if (!currentAnsName || currentAnsName.trim() === "") {
      toast({
        title: "ANSName Required",
        description: "Please ensure the ANSName is filled to revoke an agent.",
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
          Revoke Agent (Legacy Form)
        </CardTitle>
        <CardDescription>
          This form is for direct revocation. Simpler revocation is available in the table. This action is irreversible.
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
                  <FormControl>
                    <Input 
                      placeholder="Enter ANSName manually" 
                      {...field} 
                      value={field.value || ""} 
                      className={"border-destructive focus:ring-destructive"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogTrigger asChild>
                <Button type="submit" variant="destructive" className="w-full" disabled={isLoading || !form.getValues().ansName}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Revoke Registration
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently revoke the agent registration for:
                    <br />
                    <span className="font-semibold break-all"> {form.getValues().ansName || "this agent"}</span>.
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
