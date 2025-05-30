import { AgentRenewalForm } from '@/components/forms/agent-renewal-form';
import { AgentRevocationForm } from '@/components/forms/agent-revoke-form';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManageAgentsPage() {
  return (
    <div className="space-y-12">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Agent Management</CardTitle>
          <CardDescription>
            Manage the lifecycle of your registered agents. Renew their registration or revoke them if necessary.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <section id="renew-agent">
        <h2 className="text-2xl font-semibold mb-2 text-primary">Renew Agent</h2>
        <p className="mb-6 text-muted-foreground">
          Extend the registration validity of an existing agent by providing a new Certificate Signing Request (CSR).
        </p>
        <div className="flex justify-center">
         <AgentRenewalForm />
        </div>
      </section>

      <Separator className="my-12" />

      <section id="revoke-agent">
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Revoke Agent</h2>
         <p className="mb-6 text-muted-foreground">
          Permanently remove an agent's registration from the directory. This action cannot be undone.
        </p>
        <div className="flex justify-center">
          <AgentRevocationForm />
        </div>
      </section>
    </div>
  );
}
