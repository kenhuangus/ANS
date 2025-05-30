"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AgentRenewalRequestSchema, type AgentRenewalRequestPayload } from "@/lib/schemas";
import type { AgentRenewalResponse } from "@/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function AgentRenewalForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [renewalResult, setRenewalResult] = useState<AgentRenewalResponse | null>(null);

  const form = useForm<AgentRenewalRequestPayload>({
    resolver: zodResolver(AgentRenewalRequestSchema),
    defaultValues: {
      ansName: "a2a://myExistingAgent.service.MyOrg.v1.0",
      certificate: {
        subject: "CN=myexistingagent.myorg.com,O=MyOrg,C=US", 
        issuer: "CN=Local Mock CA",
        pem: "", // User or AI will provide new CSR
      },
      protocolExtensions: {},
      actualEndpoint: "https://api.myorg.com/agents/myExistingAgent/v2",
    },
  });

  async function onSubmit(data: AgentRenewalRequestPayload) {
    setIsLoading(true);
    setRenewalResult(null);
    // TODO: In a future step, if fields are empty, call a Genkit flow to populate them.
    // For now, the backend will validate if essential fields are present.
    try {
      const response = await fetch('/api/agents/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Renewal failed");
      }
      
      setRenewalResult(result as AgentRenewalResponse);
      toast({
        title: "Renewal Attempted",
        description: result.message || `Agent ${result.ansName} renewal processed.`,
      });
      // form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Renewal Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Renew Agent Registration</CardTitle>
        <CardDescription>
          Provide the ANSName of the agent and a new Certificate Signing Request (CSR). Fields are optional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="ansName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ANSName of Agent to Renew</FormLabel>
                  <FormControl><Input placeholder="e.g., a2a://oldagent.service.MyOrg.v1.0" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificate.subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate Subject (for new CSR)</FormLabel>
                  <FormControl><Input placeholder="Should match existing or be new subject" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificate.pem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Certificate Signing Request (CSR PEM)</FormLabel>
                  <FormControl><Textarea placeholder="-----BEGIN CERTIFICATE REQUEST-----..." {...field} value={field.value || ""} rows={7} /></FormControl>
                  <FormDescription>Paste the full PEM-encoded CSR for renewal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="actualEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New/Updated Actual Network Endpoint URL</FormLabel>
                    <FormControl><Input placeholder="https://api.example.com/agent/v2" {...field} value={field.value || ""} /></FormControl>
                    <FormDescription>Can be left blank if unchanged.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="protocolExtensions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Updated Protocol Extensions (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='e.g., {"description": "Updated agent description"}'
                      value={field.value ? (typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)) : ''}
                      onChange={(e) => {
                        try {
                          const val = e.target.value;
                          if (val === "") {
                            field.onChange(null); 
                          } else {
                            field.onChange(JSON.parse(val));
                          }
                        } catch (error) {
                           field.onChange(e.target.value);
                        }
                      }}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>Update protocol-specific data if needed. Can be left blank.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renew Registration
            </Button>
          </form>
        </Form>

        {renewalResult && (
          <Card className="mt-6 bg-secondary">
            <CardHeader><CardTitle>Renewal Processed</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>ANSName:</strong> {renewalResult.ansName}</p>
              <p><strong>Message:</strong> {renewalResult.message}</p>
              <p><strong>New Certificate (PEM):</strong></p>
              <Textarea readOnly value={renewalResult.agentCertificatePem} rows={7} className="font-mono text-xs bg-muted" />
              <p><strong>Renewal Timestamp:</strong> {new Date(renewalResult.renewalTimestamp).toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}