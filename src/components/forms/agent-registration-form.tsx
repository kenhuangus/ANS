
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AgentRegistrationRequestBaseSchema, type AgentRegistrationRequestPayload } from "@/lib/schemas";
import type { AgentRegistrationResponse, Protocol } from "@/types";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { aiFillRegistrationDetailsAction } from "@/app/actions/ai/ans-details-actions";

const protocolOptions: { value: Protocol; label: string }[] = [
  { value: "a2a", label: "A2A (Agent2Agent)" },
  { value: "mcp", label: "MCP (Model Context Protocol)" },
  { value: "acp", label: "ACP (Agent Communication Protocol)" },
];

// Define comprehensive, valid sample values for all fields
const completeSampleValues: AgentRegistrationRequestPayload = {
    protocol: "a2a",
    agentID: "sampleFormAgent",
    agentCapability: "formSubmissionDemo",
    provider: "FormDefaultProvider",
    version: "1.0.0",
    extension: "sample-ext", 
    certificate: {
        subject: "CN=sample.form.agent.example.com,O=FormDefaultProvider,C=US",
        issuer: "CN=SampleLocalFormCA,O=SampleOrg,C=US",
        pem: `-----BEGIN CERTIFICATE REQUEST-----\nMIICWjCCAbsCAQAwWzELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0FyaXpvbmExDjAM\nBgNVBAcMBVRlbXBlMRQwEgYDVQQKDAtTYW1wbGUgQ29ycDEUMBIGA1UEAwwLZXhh\nbXBsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC4pY7/9gH7\nZfV7p8z9X9hM3w/tF6Z+s5F2e3k4v0KM3vN7v9gB5sP/G3z8K5vP4g7j8N4c5v/s\n2v7X6xR8vN2d4K8P9o/A6k5O8fP8Y6q/C4n2k7U5e8V2A3w9mB6y9r/J5kP/t3n\n5Gq7z8V6l8r/O9X7s8P/w4U3K9N/o7R2m+E9v9Q7x/F3m+Y9vC8p7K/P7j6D+M8\nN/R9qAgMBAAGgADANBgkqhkiG9w0BAQsFAAOCAQEABV35L/2D/4t/qV7P+Z/0\nE/jM9v+P3H/0F9hO7n9tF6Z/s5F2e3k4v0KM3vN7v9gB5sP/G3z8K5vP4g7j8N\n4c5v/s2v7X6xR8vN2d4K8P9o/A6k5O8fP8Y6q/C4n2k7U5e8V2A3w9mB6y9r/J\n5kP/t3n5Gq7z8V6l8r/O9X7s8P/w4U3K9N/o7R2m+E9v9Q7x/F3m+Y9vC8p7K\n-----END CERTIFICATE REQUEST-----`,
    },
    protocolExtensions: {
      description: "A sample A2A agent designed for direct inter-agent communication and task execution, pre-filled for demonstration.",
      a2aVersion: "1.1",
      supportedMessagePatterns: ["request-response", "publish-subscribe"],
      securityPolicy: "TLS-mutual-auth",
      dataFormats: ["application/json", "application/xml"]
    },
    actualEndpoint: "https://api.formdefaultprovider.com/agents/sampleFormAgent/v1",
};

export function AgentRegistrationForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<AgentRegistrationResponse | null>(null);

  const form = useForm<AgentRegistrationRequestPayload>({
    resolver: zodResolver(AgentRegistrationRequestBaseSchema),
    defaultValues: completeSampleValues, 
  });

  async function handleAiFill() {
    setIsAiLoading(true);
    const currentValues = form.getValues();
    const result = await aiFillRegistrationDetailsAction(currentValues); 
    
    if ('error' in result) {
      toast({
        title: "AI Fill Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      const processedResult = {
        ...result,
        protocolExtensions: result.protocolExtensions && typeof result.protocolExtensions === 'object' 
          ? result.protocolExtensions 
          : (typeof result.protocolExtensions === 'string' ? JSON.parse(result.protocolExtensions) : {}),
      };
      form.reset(processedResult);
      toast({
        title: "AI Assistance",
        description: "Form details have been populated by AI. Please review and submit.",
      });
    }
    setIsAiLoading(false);
  }

  async function onSubmit(formDataFromHook: AgentRegistrationRequestPayload) {
    setIsLoading(true);
    setRegistrationResult(null);
    
    const payload: AgentRegistrationRequestPayload = {
      protocol: formDataFromHook.protocol || completeSampleValues.protocol,
      agentID: formDataFromHook.agentID?.trim() || completeSampleValues.agentID,
      agentCapability: formDataFromHook.agentCapability?.trim() || completeSampleValues.agentCapability,
      provider: formDataFromHook.provider?.trim() || completeSampleValues.provider,
      version: formDataFromHook.version?.trim() || completeSampleValues.version,
      extension: formDataFromHook.extension === "" ? null : (formDataFromHook.extension?.trim() ?? completeSampleValues.extension),
      certificate: {
        subject: formDataFromHook.certificate?.subject?.trim() || completeSampleValues.certificate.subject,
        issuer: formDataFromHook.certificate?.issuer?.trim() || completeSampleValues.certificate.issuer,
        pem: formDataFromHook.certificate?.pem?.trim() || completeSampleValues.certificate.pem,
      },
      protocolExtensions: (formDataFromHook.protocolExtensions && typeof formDataFromHook.protocolExtensions === 'object' && Object.keys(formDataFromHook.protocolExtensions).length > 0)
        ? formDataFromHook.protocolExtensions
        : completeSampleValues.protocolExtensions,
      actualEndpoint: formDataFromHook.actualEndpoint?.trim() || completeSampleValues.actualEndpoint,
    };
    
    try {
      const response = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }
      
      setRegistrationResult(result as AgentRegistrationResponse);
      toast({
        title: "Registration Attempted",
        description: result.message || `Agent ${result.ansName} registration processed.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl text-primary">Register New Agent</CardTitle>
        <CardDescription>
          Fill in the details below or use &quot;AI Fill Details&quot;.
          Certificate PEM should be a Certificate Signing Request (CSR).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleAiFill} disabled={isAiLoading} className="mb-4">
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                AI Fill Details
              </Button>
            </div>

            <FormField
              control={form.control}
              name="protocol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication Protocol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isAiLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a protocol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {protocolOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="agentID" render={({ field }) => ( <FormItem> <FormLabel>Agent ID</FormLabel> <FormControl><Input placeholder="e.g., textProcessor" {...field} value={field.value || ""} disabled={isAiLoading} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="agentCapability" render={({ field }) => ( <FormItem> <FormLabel>Agent Capability</FormLabel> <FormControl><Input placeholder="e.g., DocumentTranslation" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="provider" render={({ field }) => ( <FormItem> <FormLabel>Provider</FormLabel> <FormControl><Input placeholder="e.g., AcmeCorp" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="version" render={({ field }) => ( <FormItem> <FormLabel>Version (Semantic)</FormLabel> <FormControl><Input placeholder="e.g., 1.0.0" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
             <FormField control={form.control} name="actualEndpoint" render={({ field }) => ( <FormItem> <FormLabel>Actual Network Endpoint URL</FormLabel> <FormControl><Input placeholder="https://api.example.com/agent" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormDescription>The resolvable URL where the agent can be reached.</FormDescription> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="extension" render={({ field }) => ( <FormItem> <FormLabel>Extension</FormLabel> <FormControl><Input placeholder="e.g., hipaa, generic (optional)" {...field} value={field.value === null ? "" : field.value || ""} disabled={isAiLoading}/></FormControl> <FormDescription>Optional metadata. Will be null if left empty.</FormDescription> <FormMessage /> </FormItem> )}/>
            
            <FormField control={form.control} name="certificate.subject" render={({ field }) => ( <FormItem> <FormLabel>Certificate Subject (for CSR)</FormLabel> <FormControl><Input placeholder="e.g., CN=myagent.example.com,O=MyOrg" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="certificate.pem" render={({ field }) => ( <FormItem> <FormLabel>Certificate Signing Request (CSR PEM)</FormLabel> <FormControl><Textarea placeholder="-----BEGIN CERTIFICATE REQUEST-----..." {...field} value={field.value || ""} rows={7} disabled={isAiLoading}/></FormControl> <FormDescription>Paste CSR or let AI/sample provide one.</FormDescription> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="certificate.issuer" render={({ field }) => ( <FormItem> <FormLabel>Certificate Issuer (Informational)</FormLabel> <FormControl><Input placeholder="e.g., CN=Local Mock CA (optional)" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )}/>
            
            <FormField
              control={form.control}
              name="protocolExtensions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protocol Extensions (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='e.g., {"description": "My cool agent"}' 
                      value={field.value ? (typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)) : '{}'}
                      onChange={(e) => {
                        try {
                          const val = e.target.value;
                          if (val.trim() === "" || val.trim() === "{}") { 
                            field.onChange({}); 
                          } else {
                            field.onChange(JSON.parse(val));
                          }
                        } catch (error) {
                           field.onChange(e.target.value); 
                        }
                      }}
                      rows={5}
                      disabled={isAiLoading}
                    />
                  </FormControl>
                  <FormDescription>Protocol-specific data in JSON format. AI/sample can add a description.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isAiLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Agent
            </Button>
          </form>
        </Form>
        {registrationResult && (
          <Card className="mt-6 bg-secondary">
            <CardHeader> <CardTitle>Registration Processed</CardTitle> </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>ANSName:</strong> {registrationResult.ansName}</p>
              <p><strong>Message:</strong> {registrationResult.message}</p>
              <p><strong>Timestamp:</strong> {new Date(registrationResult.registrationTimestamp).toLocaleString()}</p>
              <p><strong>Agent Certificate (PEM):</strong></p>
              <Textarea readOnly value={registrationResult.agentCertificatePem} rows={7} className="font-mono text-xs bg-muted" />
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

    