
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
import { AgentRenewalRequestBaseSchema, type AgentRenewalRequestPayload } from "@/lib/schemas";
import type { AgentRenewalResponse } from "@/types";
import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { aiFillRenewalDetailsAction } from "@/app/actions/ai/ans-details-actions";

interface AgentRenewalFormProps {
  // This component is no longer used in the main management flow, 
  // but keeping its structure for potential future re-use or direct access.
  // selectedAnsName prop is effectively deprecated by the table-based action.
  selectedAnsName?: string | null; 
}

const RENEWAL_FORM_DEFAULT_ANSNAME = "a2a://translator.text.ExampleOrg.v1.0.0.general"; 

export function AgentRenewalForm({ selectedAnsName }: AgentRenewalFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [renewalResult, setRenewalResult] = useState<AgentRenewalResponse | null>(null);

  const form = useForm<AgentRenewalRequestPayload>({
    resolver: zodResolver(AgentRenewalRequestBaseSchema),
    defaultValues: { 
      ansName: selectedAnsName || RENEWAL_FORM_DEFAULT_ANSNAME,
      certificate: {
        subject: "", 
        issuer: "", 
        pem: "", 
      },
      protocolExtensions: {}, 
      actualEndpoint: "", 
    },
  });

  // Effect to update form if selectedAnsName prop changes (e.g. if used outside table context)
  useEffect(() => {
    const newAnsName = selectedAnsName || RENEWAL_FORM_DEFAULT_ANSNAME;
    form.setValue('ansName', newAnsName, { shouldValidate: true, shouldDirty: true });
    
    // Reset other fields if the ANSName changes significantly from the default or a previous selection
    if (form.getValues().ansName !== newAnsName || selectedAnsName) {
        form.setValue('certificate.subject', '');
        form.setValue('certificate.pem', '');
        form.setValue('certificate.issuer', ''); 
        form.setValue('actualEndpoint', ''); 
        form.setValue('protocolExtensions', {}); 
        setRenewalResult(null); 
    }
  }, [selectedAnsName, form]);

  async function handleAiFill() {
    setIsAiLoading(true);
    const currentValues = form.getValues();
    const ansNameToFill = currentValues.ansName;

    if (!ansNameToFill) {
         toast({
            title: "ANSName Required for AI Fill",
            description: "ANSName field must be filled to use AI assistance for renewal details.",
            variant: "destructive",
        });
        setIsAiLoading(false);
        return;
    }

    const aiInput: Partial<AgentRenewalRequestPayload> = {
        ansName: ansNameToFill, 
        certificate: { subject: "", pem: "", issuer: ""}, 
        actualEndpoint: currentValues.actualEndpoint || "", 
        protocolExtensions: currentValues.protocolExtensions || {}
    };


    const result = await aiFillRenewalDetailsAction(aiInput);
    
    if ('error' in result) {
      toast({
        title: "AI Fill Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      const updatedValues = {
        ...form.getValues(), 
        ...result, 
        ansName: ansNameToFill, 
        protocolExtensions: result.protocolExtensions && typeof result.protocolExtensions === 'object' 
          ? result.protocolExtensions 
          : (typeof result.protocolExtensions === 'string' ? JSON.parse(result.protocolExtensions) : {}),
      };
      form.reset(updatedValues);
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
    
    const finalAnsName = data.ansName; 

    if (!finalAnsName || !data.certificate?.pem || !data.certificate?.subject) {
       toast({
        title: "Missing Information for Submission",
        description: "ANSName and a new CSR (Subject and PEM) are essential for renewal.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/agents/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ansName: finalAnsName }), 
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

  // This form might be conditionally rendered or not rendered at all if management page design changes
  return (
    <Card className="w-full max-w-xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Renew Agent Registration (Legacy Form)</CardTitle>
        <CardDescription>
          This form is for detailed renewal with a new CSR. Simpler renewal is available in the table.
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
                  <FormControl>
                    <Input 
                      placeholder="Enter ANSName manually" 
                      {...field} 
                      value={field.value || ""} 
                      disabled={isAiLoading} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleAiFill} disabled={isAiLoading || !form.getValues().ansName}>
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                AI Fill CSR & Other Details
              </Button>
            </div>
            <FormField control={form.control} name="certificate.subject" render={({ field }) => ( <FormItem> <FormLabel>Certificate Subject (for new CSR)</FormLabel> <FormControl><Input placeholder="e.g., CN=agent.example.com,O=Org" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="certificate.pem" render={({ field }) => ( <FormItem> <FormLabel>New Certificate Signing Request (CSR PEM)</FormLabel> <FormControl><Textarea placeholder="-----BEGIN CERTIFICATE REQUEST-----..." {...field} value={field.value || ""} rows={7} disabled={isAiLoading}/></FormControl> <FormDescription>Paste CSR or let AI generate a mock one.</FormDescription> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="certificate.issuer" render={({ field }) => ( <FormItem> <FormLabel>Certificate Issuer (Informational)</FormLabel> <FormControl><Input placeholder="e.g., CN=Local Mock CA (optional)" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )}/>
            
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
                          if (val.trim() === "" || val.trim() === "{}") { field.onChange({}); } 
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
              Renew Registration (with CSR)
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
