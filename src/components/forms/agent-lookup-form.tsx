
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
import { AgentCapabilityRequestBaseSchema, type AgentCapabilityRequestPayload } from "@/lib/schemas"; // Changed import
import type { AgentCapabilityResponse, Protocol } from "@/types";
import { useState } from "react";
import { AgentCard } from "@/components/agent-card";
import { Loader2, Sparkles } from "lucide-react";
import { aiFillLookupDetailsAction } from "@/app/actions/ai/ans-details-actions";

const protocolOptions: { value: Protocol; label: string }[] = [
  { value: "a2a", label: "A2A (Agent2Agent)" },
  { value: "mcp", label: "MCP (Model Context Protocol)" },
  { value: "acp", label: "ACP (Agent Communication Protocol)" },
];

export function AgentLookupForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<AgentCapabilityResponse[]>([]);

  const form = useForm<AgentCapabilityRequestPayload>({
    resolver: zodResolver(AgentCapabilityRequestBaseSchema), // Ensured correct schema is used
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

  async function handleAiFill() {
    setIsAiLoading(true);
    const currentValues = form.getValues();
    const result = await aiFillLookupDetailsAction(currentValues);
    
    if ('error' in result) {
      toast({
        title: "AI Fill Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      form.reset(result);
      toast({
        title: "AI Assistance",
        description: "Lookup fields populated by AI. Please review and submit.",
      });
    }
    setIsAiLoading(false);
  }

  async function onSubmit(data: AgentCapabilityRequestPayload) {
    setIsLoading(true);
    setLookupResults([]);

    // Check if any lookup parameter is provided.
    const hasAnsName = data.ansName && data.ansName.trim() !== "";
    const hasAnyAttribute = data.protocol || data.agentID || data.agentCapability || data.provider || data.version || (data.extension && data.extension.trim() !== "");

    if (!hasAnsName && !hasAnyAttribute) {
      toast({
        title: "Missing Lookup Parameters",
        description: "Please provide an ANSName or at least one attribute for lookup. You can also use 'AI Fill' for assistance.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('requestType', data.requestType || 'resolve');

      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'requestType' && value !== undefined && value !== null && String(value).trim() !== "") {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`/api/agents/lookup?${queryParams.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Lookup failed");
      }
      
      const resultsArray = Array.isArray(result) ? result : (result ? [result] : []);
      setLookupResults(resultsArray); 

      if (resultsArray.length === 0) {
         toast({
          title: "Lookup Complete",
          description: "No agents found matching your criteria.",
        });
      } else {
        toast({
          title: "Lookup Successful",
          description: `${resultsArray.length} agent(s) found.`,
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
            Search by ANSName or attributes. Use &quot;AI Fill Details&quot; for help.
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

              <FormField control={form.control} name="ansName" render={({ field }) => ( <FormItem> <FormLabel>Full ANSName (Primary Search)</FormLabel> <FormControl><Input placeholder="e.g., a2a://translator.text.AcmeCorp.v1.0" {...field} value={field.value || ""} disabled={isAiLoading} /></FormControl> <FormDescription>If provided, other fields may be less critical. AI can construct this.</FormDescription> <FormMessage /> </FormItem> )}/>
              <p className="text-sm text-muted-foreground pt-2">Or search by attributes (AI can also fill these):</p>
              
              <FormField control={form.control} name="protocol" render={({ field }) => ( <FormItem> <FormLabel>Protocol</FormLabel> <Select onValueChange={field.onChange} value={field.value || ""} disabled={isAiLoading}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select protocol (optional)" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="">Any Protocol</SelectItem> {protocolOptions.map(opt => ( <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="agentID" render={({ field }) => ( <FormItem> <FormLabel>Agent ID</FormLabel> <FormControl><Input placeholder="e.g., translator" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="agentCapability" render={({ field }) => ( <FormItem> <FormLabel>Capability</FormLabel> <FormControl><Input placeholder="e.g., text" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="provider" render={({ field }) => ( <FormItem> <FormLabel>Provider</FormLabel> <FormControl><Input placeholder="e.g., AcmeCorp" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="version" render={({ field }) => ( <FormItem> <FormLabel>Version</FormLabel> <FormControl><Input placeholder="e.g., 1.0 or 1.x or *" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )} />
              </div>
              <FormField control={form.control} name="extension" render={({ field }) => ( <FormItem> <FormLabel>Extension</FormLabel> <FormControl><Input placeholder="e.g., hipaa" {...field} value={field.value || ""} disabled={isAiLoading}/></FormControl> <FormMessage /> </FormItem> )} />
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isAiLoading}>
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
