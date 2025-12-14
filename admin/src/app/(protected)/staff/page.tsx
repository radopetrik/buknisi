import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StaffPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Management</CardTitle>
        <CardDescription>Manage roles, onboarding, and permissions.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Staff tools and access controls will be available in this space.
      </CardContent>
    </Card>
  );
}
