import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Construction, ArrowLeft } from "lucide-react";

export default function SettingsPlaceholder({ title, description, icon: Icon }) {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <Link href="/settings/user-management">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User Management
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Construction className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">Coming Soon</CardTitle>
          <CardDescription>
            This feature is currently under development and will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              {Icon && <Icon className="h-4 w-4" />}
              <span>{title}</span>
            </div>
            <p className="text-sm text-gray-500">
              We're working hard to bring you this feature. Stay tuned for updates!
            </p>
            <Link href="/settings/user-management">
              <Button className="w-full">
                Go to User Management
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}