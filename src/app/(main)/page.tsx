import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, Edit, ShieldCheck, FileJson, KeyRound } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-card rounded-lg shadow-lg">
        <ShieldCheck className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">
          Welcome to AgentVerse Directory
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
          A universal directory for secure AI agent discovery and interoperability,
          implementing the Agent Name Service (ANS) protocol.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <Button asChild size="lg">
            <Link href="/register">Register Agent</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/lookup">Lookup Agent</Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={<UserPlus className="h-10 w-10 text-accent" />}
          title="Agent Registration"
          description="Securely register your AI agents, their capabilities, and associated PKI certificates in the ANS directory."
          link="/register"
          linkText="Register Now"
        />
        <FeatureCard
          icon={<Search className="h-10 w-10 text-accent" />}
          title="ANS Lookup & Discovery"
          description="Discover other agents using their unique ANSName or by querying based on their capabilities."
          link="/lookup"
          linkText="Start Discovery"
        />
        <FeatureCard
          icon={<Edit className="h-10 w-10 text-accent" />}
          title="ANS Management"
          description="Renew agent registrations and manage the lifecycle of your agents, including revocation when necessary."
          link="/manage"
          linkText="Manage Agents"
        />
        <FeatureCard
          icon={<KeyRound className="h-10 w-10 text-accent" />}
          title="PKI Infrastructure"
          description="Leverages a Public Key Infrastructure with a local CA for issuing and managing agent certificates, ensuring trust."
          isInformational
        />
        <FeatureCard
          icon={<ShieldCheck className="h-10 w-10 text-accent" />}
          title="Digital Signing"
          description="Employs digital signatures to verify the authenticity and integrity of agent information and registry responses."
          isInformational
        />
        <FeatureCard
          icon={<FileJson className="h-10 w-10 text-accent" />}
          title="JSON Schema Validation"
          description="Ensures all registry interactions conform to predefined JSON schemas, maintaining data integrity and consistency."
          isInformational
        />
      </section>

      <section className="text-center py-10">
        <h2 className="text-3xl font-semibold text-primary mb-4">Building a Secure & Interoperable Agent Ecosystem</h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          ANS aims to provide a foundational layer of trust and discovery, enabling AI agents built on diverse protocols (A2A, MCP, ACP) to find, verify, and securely interact with each other.
        </p>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
  isInformational?: boolean;
}

function FeatureCard({ icon, title, description, link, linkText, isInformational }: FeatureCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="items-center text-center">
        {icon}
        <CardTitle className="mt-4 text-2xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <CardDescription>{description}</CardDescription>
        {!isInformational && link && linkText && (
          <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href={link}>{linkText}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
