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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AgentCapabilityRequestSchema, type AgentCapabilityRequestPayload } from "@/lib/schemas";
import type { AgentCapabilityResponse, Protocol } from "@/types";
import { useState } from "react";
import { AgentCard } from "@/components/agent-card";
import { Loader2 } from "lucide-react";

const protocolOptions: { value: Protocol; label: string }[] = [
  { value: "a2a", label: "A2A (Agent2Agent)" },
  { value: "mcp", label: "MCP (Model Context Protocol)" },
  { value: "acp", label: "ACP (Agent Communication Protocol)" },
];

export function AgentLookupForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<AgentCapabilityResponse[]>([]);

  const form = useForm<AgentCapabilityRequestPayload>({
    resolver: zodResolver(AgentCapabilityRequestSchema),
    defaultValues: {
      requestType: "resolve",
      ansName: "",
      protocol: undefined,
      agentID: "",
      agentCapability: "",
      provider: "",
      version: "",
      extension: "",
    },
  });

  async function onSubmit(data: AgentCapabilityRequestPayload) {
    setIsLoading(true);
    setLookupResults([]);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`/api/agents/lookup?${queryParams.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Lookup failed");
      }
      
      setLookupResults(Array.isArray(result) ? result : [result]); // API might return single or array
      if (Array.isArray(result) ? result.length === 0 : !result) {
         toast({
          title: "Lookup Complete",
          description: "No agents found matching your criteria.",
          variant: "default",
        });
      } else {
        toast({
          title: "Lookup Successful",
          description: `${Array.isArray(result) ? result.length : 1} agent(s) found.`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Lookup Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8 w-full">
      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl text-primary">Lookup Agent</CardTitle>
          <CardDescription>
            Search for agents by their full ANSName or by specific capabilities and attributes.
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
                    <FormLabel>Full ANSName (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., a2a://translator.text.AcmeCorp.v1.0" {...field} /></FormControl>
                    <FormDescription>If provided, other fields below will be ignored for direct lookup.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-sm text-muted-foreground pt-2">Or search by attributes:</p>
              
              <FormField
                control={form.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormField control={form.control} name="agentID" render={({ field }) => ( <FormItem> <FormLabel>Agent ID</FormLabel> <FormControl><Input placeholder="e.g., translator" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="agentCapability" render={({ field }) => ( <FormItem> <FormLabel>Capability</FormLabel> <FormControl><Input placeholder="e.g., text" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="provider" render={({ field }) => ( <FormItem> <FormLabel>Provider</FormLabel> <FormControl><Input placeholder="e.g., AcmeCorp" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="version" render={({ field }) => ( <FormItem> <FormLabel>Version</FormLabel> <FormControl><Input placeholder="e.g., 1.0 or 1.x or *" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </div>
              <FormField control={form.control} name="extension" render={({ field }) => ( <FormItem> <FormLabel>Extension (Optional)</FormLabel> <FormControl><Input placeholder="e.g., hipaa" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lookup Agent
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {lookupResults.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-primary">Lookup Results</h2>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {lookupResults.map((agent, index) => (
              <AgentCard key={agent.Endpoint + index} agent={agent} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
