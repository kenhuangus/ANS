
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentCapabilityResponse } from "@/types";
import { ShieldCheck, CalendarDays, Info, Globe, Tag } from "lucide-react";

interface AgentCardProps {
  agent: AgentCapabilityResponse;
}

export function AgentCard({ agent }: AgentCardProps) {
  let protocolExtensions;
  try {
    // Assuming actualEndpoint in agent is a JSON string containing more details including protocolExtensions
    // This is a bit of a hack based on current types, ideal type would have protocolExtensions directly
    // For now, we'll display what we have and assume if protocolExtensions were part of a signed payload,
    // they might be included in `agent.actualEndpoint` if it were a JSON string, or another field.
    // The provided types AgentCapabilityResponse don't have protocolExtensions.
    // We'll just display the main fields.
  } catch (e) {
    // console.warn("Could not parse protocol extensions from actualEndpoint");
  }

  return (
    <Card className="w-full shadow-lg break-inside-avoid-column">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-2xl text-primary flex items-center break-all">
            <ShieldCheck className="h-7 w-7 mr-2 text-green-600" /> 
            {agent.Endpoint}
          </CardTitle>
          <Badge variant="outline" className="text-sm">{/* Protocol could be extracted from ANSName if needed */}</Badge>
        </div>
        <CardDescription>Agent discovered via the Agent Name Service.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-semibold text-muted-foreground flex items-center"><Globe className="h-4 w-4 mr-2" /> Network Endpoint:</h4>
          <p className="text-sm font-mono bg-muted p-2 rounded-md break-all">{agent.actualEndpoint}</p>
        </div>
        <div>
          <h4 className="font-semibold text-muted-foreground flex items-center"><Tag className="h-4 w-4 mr-2" /> Time-to-Live (TTL):</h4>
          <p className="text-sm">{agent.ttl} seconds</p>
        </div>
        <div>
          <h4 className="font-semibold text-muted-foreground">Agent Certificate (PEM):</h4>
          <textarea
            readOnly
            value={agent.agentCertificatePem}
            rows={5}
            className="w-full mt-1 p-2 border rounded-md text-xs font-mono bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Agent Certificate PEM"
          />
        </div>
         <div>
          <h4 className="font-semibold text-muted-foreground">Registry Signature:</h4>
          <textarea
            readOnly
            value={agent.registrySignature}
            rows={3}
            className="w-full mt-1 p-2 border rounded-md text-xs font-mono bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Registry Signature"
          />
        </div>
        <div>
          <h4 className="font-semibold text-muted-foreground">Registry Certificate (PEM):</h4>
          <textarea
            readOnly
            value={agent.registryCertificatePem}
            rows={3}
            className="w-full mt-1 p-2 border rounded-md text-xs font-mono bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Registry Certificate PEM"
          />
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Last resolved: {new Date().toLocaleString()}</p>
      </CardFooter>
    </Card>
  );
}

