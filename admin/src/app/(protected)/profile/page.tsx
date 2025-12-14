import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal and security information.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Profile details, security options, and preferences will be managed here.
      </CardContent>
    </Card>
  );
}
