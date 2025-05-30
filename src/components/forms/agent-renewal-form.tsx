
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
import { AgentRenewalRequestBaseSchema, type AgentRenewalRequestPayload } from "@/lib/schemas"; // Changed import
import type { AgentRenewalResponse } from "@/types";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { aiFillRenewalDetailsAction } from "@/app/actions/ai/ans-details-actions";

export function AgentRenewalForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [renewalResult, setRenewalResult] = useState<AgentRenewalResponse | null>(null);

  const form = useForm<AgentRenewalRequestPayload>({
    resolver: zodResolver(AgentRenewalRequestBaseSchema), // Ensured correct schema is used
    defaultValues: { 
      ansName: "a2a://myAgent.service.MyOrg.v1.0", // More specific placeholder
      certificate: {
        subject: "CN=myAgent.service.MyOrg.com,O=MyOrg,C=US", 
        issuer: "CN=Local Mock CA,O=Mock CA Org,C=US", // Placeholder
        pem: "", 
      },
      protocolExtensions: {},
      actualEndpoint: "https://api.myorg.com/myagent/v1/renew", // More specific placeholder
    },
  });

  async function handleAiFill() {
    setIsAiLoading(true);
    const currentValues = form.getValues();
    // For AI fill, ansName is usually important to guide CSR generation.
    // The Genkit flow prompt is designed to attempt generation if missing,
    // but having it is better.
    // if (!currentValues.ansName || currentValues.ansName.trim() === "") {
    //   toast({
    //     title: "ANSName Recommended for AI Fill",
    //     description: "Please enter the ANSName of the agent to renew for best AI assistance with CSR details.",
    //     variant: "default", // Not an error, just a recommendation
    //   });
    //   // We can still proceed, AI will try its best.
    // }

    const result = await aiFillRenewalDetailsAction(currentValues);
    
    if ('error' in result) {
      toast({
        title: "AI Fill Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      const processedResult = {
        ...result,
        // Ensure protocolExtensions is an object. AI might return a string.
        protocolExtensions: result.protocolExtensions && typeof result.protocolExtensions === 'object' 
          ? result.protocolExtensions 
          : (typeof result.protocolExtensions === 'string' ? JSON.parse(result.protocolExtensions) : {}),
      };
      form.reset(processedResult);
      toast({
        title: "AI Assistance",
        description: "Renewal details (like CSR) populated by AI. Please review and submit.",
      });
    }
    setIsAiLoading(false);
  }

  async function onSubmit(data: AgentRenewalRequestPayload) {
    setIsLoading(true);
    setRenewalResult(null);
    
    // For actual submission, ansName and new CSR details are essential.
    // The schema makes them optional for AI fill, but the API endpoint will likely require them.
    if (!data.ansName || !data.certificate?.pem || !data.certificate?.subject) {
       toast({
        title: "Missing Information for Submission",
        description: "ANSName and a new CSR (Subject and PEM) are essential for renewal. Use 'AI Fill' or complete them manually before submitting.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

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
          Provide agent&apos;s ANSName and new CSR. Use &quot;AI Fill CSR & Other Details&quot; for CSR generation.
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
                  <FormControl><Input placeholder="e.g., a2a://oldagent.service.MyOrg.v1.0" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleAiFill} disabled={isAiLoading} className="mb-2">
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                AI Fill CSR & Other Details
              </Button>
            </div>
            <FormField control={form.control} name="certificate.subject" render={({ field }) => ( <FormItem> <FormLabel>Certificate Subject (for new CSR)</FormLabel> <FormControl><Input placeholder="Should match existing or be new subject" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="certificate.pem" render={({ field }) => ( <FormItem> <FormLabel>New Certificate Signing Request (CSR PEM)</FormLabel> <FormControl><Textarea placeholder="-----BEGIN CERTIFICATE REQUEST-----..." {...field} value={field.value || ""} rows={7} disabled={isAiLoading}/></FormControl> <FormDescription>Paste CSR or let AI generate a mock one.</FormDescription> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="certificate.issuer" render={({ field }) => ( <FormItem> <FormLabel>Certificate Issuer (Informational)</FormLabel> <FormControl><Input placeholder="e.g., CN=Local Mock CA" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )}/>
            
            <FormField control={form.control} name="actualEndpoint" render={({ field }) => ( <FormItem> <FormLabel>New/Updated Actual Network Endpoint URL (Optional)</FormLabel> <FormControl><Input placeholder="https://api.example.com/agent/v2" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormDescription>Leave blank if unchanged, or AI can suggest.</FormDescription> <FormMessage /> </FormItem> )}/>
            <FormField
              control={form.control}
              name="protocolExtensions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Updated Protocol Extensions (JSON, Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='e.g., {"description": "Updated agent features"}'
                      value={field.value ? (typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)) : ''}
                      onChange={(e) => {
                        try {
                          const val = e.target.value;
                          if (val.trim() === "") { field.onChange({}); }
                          else { field.onChange(JSON.parse(val)); }
                        } catch (error) { field.onChange(e.target.value); }
                      }}
                      rows={3}
                      disabled={isAiLoading}
                    />
                  </FormControl>
                  <FormDescription>Update protocol-specific data. AI can suggest.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading || isAiLoading}>
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
