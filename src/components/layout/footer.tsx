export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-8 mt-auto">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AgentVerse Directory. All rights reserved.</p>
        <p className="text-xs mt-1">
          A demonstration of Agent Name Service based on "ANS: A Universal Directory for Secure AI Agent Discovery and Interoperability".
        </p>
      </div>
    </footer>
  );
}
