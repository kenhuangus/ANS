
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AgentCapabilityRequestBaseSchema, type AgentCapabilityRequestPayload } from "@/lib/schemas";
import type { AgentCapabilityResponse } from "@/types";
import { useState } from "react";
import { AgentCard } from "@/components/agent-card";
import { Loader2 } from "lucide-react";
// AI Fill action and related imports are removed as the form is simplified.

export function AgentLookupForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<AgentCapabilityResponse[]>([]);

  const form = useForm<AgentCapabilityRequestPayload>({
    resolver: zodResolver(AgentCapabilityRequestBaseSchema),
    defaultValues: {
      searchQuery: "", 
    },
  });

  async function onSubmit(data: AgentCapabilityRequestPayload) {
    setIsLoading(true);
    setLookupResults([]);

    try {
      const queryParams = new URLSearchParams();
      if (data.searchQuery && data.searchQuery.trim() !== "") {
        queryParams.append('q', data.searchQuery.trim());
      }
      // If searchQuery is empty, the API will list all agents by default based on backend logic.
      
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
            Enter a name, ID, capability, or part of an ANSName to search.
            Leave blank to list all registered agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="searchQuery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Term</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., translator, AcmeCorp, or a2a://..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Performs a pattern match across agent details.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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

    