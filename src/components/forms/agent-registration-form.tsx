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
import { AgentRegistrationRequestSchema, type AgentRegistrationRequestPayload } from "@/lib/schemas";
import type { AgentRegistrationResponse, Protocol } from "@/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const protocolOptions: { value: Protocol; label: string }[] = [
  { value: "a2a", label: "A2A (Agent2Agent)" },
  { value: "mcp", label: "MCP (Model Context Protocol)" },
  { value: "acp", label: "ACP (Agent Communication Protocol)" },
];

export function AgentRegistrationForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<AgentRegistrationResponse | null>(null);

  const form = useForm<AgentRegistrationRequestPayload>({
    resolver: zodResolver(AgentRegistrationRequestSchema),
    defaultValues: {
      protocol: "a2a",
      agentID: "mySampleAgent",
      agentCapability: "dataProcessing",
      provider: "MyCompany",
      version: "1.0.0",
      extension: "",
      certificate: {
        subject: "CN=myagent.mycompany.com,O=MyCompany,C=US",
        issuer: "CN=Local Mock CA", 
        pem: "", // User or AI will provide CSR
      },
      protocolExtensions: {},
      actualEndpoint: "https://api.mycompany.com/agents/mySampleAgent",
    },
  });

  async function onSubmit(data: AgentRegistrationRequestPayload) {
    setIsLoading(true);
    setRegistrationResult(null);

    // TODO: In a future step, if fields are empty, call a Genkit flow to populate them.
    // For now, the backend will validate if essential fields are present.

    try {
      const response = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      // Optionally reset form or update with AI generated values if that was part of the flow
      // form.reset(); 
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
          Fill in the details below. Fields are optional; AI can assist with defaults in a future update.
          The certificate PEM should be a Certificate Signing Request (CSR).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="protocol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication Protocol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "a2a"}>
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
              <FormField
                control={form.control}
                name="agentID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent ID</FormLabel>
                    <FormControl><Input placeholder="e.g., textProcessor" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agentCapability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Capability</FormLabel>
                    <FormControl><Input placeholder="e.g., DocumentTranslation" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl><Input placeholder="e.g., AcmeCorp" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version (Semantic)</FormLabel>
                    <FormControl><Input placeholder="e.g., 1.0.0" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="actualEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Network Endpoint URL</FormLabel>
                    <FormControl><Input placeholder="https://api.example.com/agent" {...field} value={field.value || ""} /></FormControl>
                    <FormDescription>The resolvable URL where the agent can be reached.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="extension"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Extension</FormLabel>
                  <FormControl><Input placeholder="e.g., hipaa, secure (optional)" {...field} value={field.value || ""} /></FormControl>
                  <FormDescription>Optional metadata for deployment or provider specifics.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificate.subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate Subject (for CSR)</FormLabel>
                  <FormControl><Input placeholder="e.g., CN=myagent.example.com,O=MyOrg" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificate.pem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate Signing Request (CSR PEM)</FormLabel>
                  <FormControl><Textarea placeholder="-----BEGIN CERTIFICATE REQUEST-----..." {...field} value={field.value || ""} rows={7} /></FormControl>
                  <FormDescription>Paste the full PEM-encoded CSR here.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="protocolExtensions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protocol Extensions (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='e.g., {"description": "My cool agent", "mcpToolId": "tool-123"}' 
                      value={field.value ? (typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)) : ''}
                      onChange={(e) => {
                        try {
                          // Attempt to parse if it's a string, otherwise pass as is (e.g. if it's already an object from AI)
                          const val = e.target.value;
                          if (val === "") {
                            field.onChange(null); // Allow clearing to empty object or null
                          } else {
                            field.onChange(JSON.parse(val));
                          }
                        } catch (error) {
                           // Keep string in field if not valid JSON, let Zod validation handle final check
                           field.onChange(e.target.value);
                        }
                      }}
                      rows={5}
                    />
                  </FormControl>
                  <FormDescription>Protocol-specific data in JSON format.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Agent
            </Button>
          </form>
        </Form>
        {registrationResult && (
          <Card className="mt-6 bg-secondary">
            <CardHeader>
              <CardTitle>Registration Processed</CardTitle>
            </CardHeader>
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