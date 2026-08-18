import React from 'react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Connect() {
  const mcpUrl = new URL("/api/mcp", window.location.origin).toString();

  const handleCopy = () => {
    navigator.clipboard.writeText(mcpUrl);
    toast({
      title: "Copied",
      description: "MCP URL copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">Connect an AI Assistant</h1>
          <p className="text-lg text-muted-foreground">
            You can connect your favorite AI assistants (like Claude, ChatGPT, or Cursor) to this app so they can help you securely access your data and take actions on your behalf.
          </p>
        </div>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Your MCP Server URL</CardTitle>
            <CardDescription>Use this URL to connect your assistant to our app.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-background rounded-md border break-all">
                {mcpUrl}
              </code>
              <Button variant="default" onClick={handleCopy} className="shrink-0 gap-2">
                <Copy className="w-4 h-4" /> Copy
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              After connecting, your assistant will ask you to sign in to authorize its access.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="claude" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="claude">Claude</TabsTrigger>
            <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
            <TabsTrigger value="cursor">Cursor</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value="claude" className="space-y-4">
            <h3 className="text-xl font-semibold">Connecting to Claude for Desktop</h3>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Open your Claude desktop app and click your profile menu.</li>
              <li>Go to <strong>Settings</strong> &gt; <strong>Connectors</strong>.</li>
              <li>Click <strong>Add custom connector</strong>.</li>
              <li>Give it a name.</li>
              <li>Paste the MCP URL from above into the URL field.</li>
              <li>Click <strong>Add</strong>.</li>
              <li>When you first use the tools, Claude will prompt you to sign in and approve access.</li>
              <li><em>Note: Remember to refresh the connector in Claude if we ship updates!</em></li>
            </ol>
          </TabsContent>

          <TabsContent value="chatgpt" className="space-y-4">
            <h3 className="text-xl font-semibold">Connecting to ChatGPT</h3>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Open ChatGPT and go to <strong>Apps</strong>.</li>
              <li>Enable Developer mode (please note ChatGPT's warnings about developer features).</li>
              <li>Click <strong>Create app</strong> and give it a name.</li>
              <li>Paste the MCP URL into the configuration.</li>
              <li>Click <strong>Create</strong>.</li>
              <li>Enable the app from your chat composer before prompting it.</li>
              <li>You'll be prompted to sign in and approve access.</li>
              <li><em>Note: Remember to refresh the connector in ChatGPT if we ship updates!</em></li>
            </ol>
          </TabsContent>

          <TabsContent value="cursor" className="space-y-4">
            <h3 className="text-xl font-semibold">Connecting to Cursor</h3>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Open Cursor and go to <strong>Settings</strong> &gt; <strong>Tools & Integrations</strong>.</li>
              <li>Click <strong>New MCP Server</strong> (this will open your <code>mcp.json</code>).</li>
              <li>Add a new entry pointing the <code>url</code> to the MCP URL above.</li>
              <li>Save the file and toggle the server <strong>on</strong> in Settings.</li>
              <li>Cursor will prompt you to sign in when it tries to use the tools.</li>
              <li><em>Note: Remember to refresh the connector if we ship updates!</em></li>
            </ol>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <h3 className="text-xl font-semibold">Custom AI Clients</h3>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Copy the MCP URL from above.</li>
              <li>Add it to your client as a <strong>streamable HTTP MCP server</strong> (SSE).</li>
              <li>Provide a name for the server.</li>
              <li>Reload your client. When tools are invoked, follow the prompt to sign in and authorize access.</li>
            </ol>
          </TabsContent>
        </Tabs>
      </main>
      <PublicFooter />
    </div>
  );
}