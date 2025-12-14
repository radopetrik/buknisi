import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Configure preferences, notifications, and integrations.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Settings controls will appear here to fine-tune the workspace.
      </CardContent>
    </Card>
  );
}
