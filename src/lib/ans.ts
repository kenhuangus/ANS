import type { AgentRecord, Protocol } from '@/types';

export interface ParsedANSName {
  protocol: Protocol;
  agentId: string;
  capability: string;
  provider: string;
  version: string; // Full version string e.g., v2.1
  extension: string | null;
}

export function parseANSName(ansName: string): ParsedANSName | null {
  // ANSName = Protocol "://" AgentID "." agentCapability "." Provider ".v" Version "." Extension
  // Example: "a2a://textProcessor.DocumentTranslation.AcmeCorp.v2.1.hipaa"
  // Example no ext: "a2a://textProcessor.DocumentTranslation.AcmeCorp.v2.1"
  const regex = /^(a2a|mcp|acp):\/\/([^.]+)\.([^.]+)\.([^.]+)\.v([^.]+)(?:\.([^.]+))?$/;
  const match = ansName.match(regex);

  if (!match) {
    return null;
  }

  return {
    protocol: match[1] as Protocol,
    agentId: match[2],
    capability: match[3],
    provider: match[4],
    version: match[5], // e.g., "2.1"
    extension: match[6] || null,
  };
}

export function constructANSName(data: {
  protocol: Protocol;
  agentID: string;
  agentCapability: string;
  provider: string;
  version: string; // Should be just "X.Y" or "X.Y.Z" without 'v'
  extension?: string | null;
}): string {
  let name = `${data.protocol}://${data.agentID}.${data.agentCapability}.${data.provider}.v${data.version}`;
  if (data.extension) {
    name += `.${data.extension}`;
  }
  return name;
}


// Simplified Semantic Versioning check
// Checks if agentVersion satisfies requestedVersionRange
// For simplicity, this example handles exact matches or very basic range like "2" or "2.1" meaning "2.x" or "2.1.x"
// A full semver library would be needed for ranges like "^2.1.0", "~2.1.0", ">=2.1.0 <3.0.0"
// This is a placeholder for the paper's `SemVer.satisfies(AgentVersion, RequestedVersionRange)`
export function isVersionCompatible(agentVersionStr: string, requestedVersionRangeStr: string): boolean {
  if (requestedVersionRangeStr === "*" || requestedVersionRangeStr === "") {
    return true;
  }

  // Normalize agentVersion (e.g., from "v2.1.0" to "2.1.0")
  const normalize = (v: string) => v.startsWith('v') ? v.substring(1) : v;
  
  const agentVersion = normalize(agentVersionStr); // e.g., "2.1.0"
  const requestedVersionRange = normalize(requestedVersionRangeStr); // e.g., "2.1" or "2.1.0"

  // Exact match
  if (agentVersion === requestedVersionRange) {
    return true;
  }

  // Simple prefix match for ranges like "2.1" meaning "2.1.x"
  // Agent: 2.1.0, Requested: 2.1 -> true
  // Agent: 2.1.5, Requested: 2.1 -> true
  // Agent: 2.2.0, Requested: 2.1 -> false
  if (agentVersion.startsWith(requestedVersionRange + '.')) {
    return true;
  }
  
  // Handle pre-releases - this simplified version considers pre-releases lower
  // 2.0.0-rc1 vs 2.0.0 -> rc1 is lower
  const agentParts = agentVersion.split('-');
  const requestedParts = requestedVersionRange.split('-');

  if (agentParts[0] === requestedParts[0]) {
    if (agentParts.length === 1 && requestedParts.length > 1) return true; // agent is stable, requested is pre-release (allow if base matches)
    if (agentParts.length > 1 && requestedParts.length === 1) return false; // agent is pre-release, requested is stable
    // if both pre-release, could compare, but keeping simple for now
  }


  // Fallback for more complex ranges (not implemented here)
  // For now, strict prefix or exact match.
  // A real implementation would use a semver library.
  // console.warn(`Complex version range "${requestedVersionRange}" not fully supported by simplified checker.`);
  return false; 
}


export function versionNegotiation(matches: AgentRecord[], requestedVersionRange: string): AgentRecord | null {
  // Sort matches by version (highest to lowest Semantic Version)
  // This is a simplified sort. Full semver sort is complex.
  const sortedMatches = [...matches].sort((a, b) => {
    const normalize = (v: string) => (v.startsWith('v') ? v.substring(1) : v).split('.').map(Number);
    const vA = normalize(a.version);
    const vB = normalize(b.version);
    for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
      const partA = vA[i] || 0;
      const partB = vB[i] || 0;
      if (partA > partB) return -1;
      if (partA < partB) return 1;
    }
    // Handle pre-releases: stable > rc > beta > alpha
    if (a.version.includes('-') && !b.version.includes('-')) return 1; // b is stable, a is pre
    if (!a.version.includes('-') && b.version.includes('-')) return -1; // a is stable, b is pre
    // Basic string compare for pre-release tags if both have them
    if (a.version.includes('-') && b.version.includes('-')) {
        return b.version.localeCompare(a.version);
    }
    return 0;
  });

  for (const match of sortedMatches) {
    if (isVersionCompatible(match.version, requestedVersionRange)) {
      return match;
    }
  }
  return null; // Incompatible Version
}
