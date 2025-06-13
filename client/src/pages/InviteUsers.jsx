import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, Users, Shield, Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteUsersModal } from "@/components/InviteUsersModal";

export function InviteUsers() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Get organization license info
  const { data: licenseInfo } = useQuery({
    queryKey: ["/api/organization/license"],
  });

  // Get organization users
  const { data: users = [] } = useQuery({
    queryKey: ["/api/organization/users-detailed"],
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invite Users</h1>
          <p className="text-lg text-gray-600 mt-2">
            Add new team members to your organization
          </p>
        </div>
        <Button
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* License Information Card */}
      {licenseInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>License Information</span>
            </CardTitle>
            <CardDescription>
              Current license usage and available slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {licenseInfo.totalLicenses}
                </div>
                <div className="text-sm text-gray-600">Total Licenses</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {licenseInfo.usedLicenses}
                </div>
                <div className="text-sm text-gray-600">Used Licenses</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {licenseInfo.availableSlots}
                </div>
                <div className="text-sm text-gray-600">Available Slots</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Users Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span>Current Team Members</span>
          </CardTitle>
          <CardDescription>
            Overview of existing users in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length > 0 ? (
              users.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Mail className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {user.role}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No team members found. Start by inviting your first user.
              </div>
            )}
            {users.length > 5 && (
              <div className="text-center text-sm text-gray-500">
                And {users.length - 5} more team members...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            How to invite users to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Click "Add User"</h4>
                <p className="text-sm text-gray-600">
                  Use the blue "Add User" button to open the invitation modal
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Enter Email Addresses</h4>
                <p className="text-sm text-gray-600">
                  Add email addresses for each person you want to invite
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Assign Roles</h4>
                <p className="text-sm text-gray-600">
                  Choose appropriate roles - Member is required, additional roles are optional
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Send Invitations</h4>
                <p className="text-sm text-gray-600">
                  Invited users will receive email instructions to join your organization
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Users Modal */}
      <InviteUsersModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}