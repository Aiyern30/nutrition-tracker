"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Target,
  Bell,
  Globe,
  Moon,
  Shield,
  HelpCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfilePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Profile & Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-12 w-12" />
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-2xl font-bold">Welcome, User</h2>
                  <div className="flex items-center gap-2">
                    <Badge>Free Plan</Badge>
                    <Badge variant="secondary">7 day streak</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Member since January 2025
                  </p>
                </div>
                <Button variant="outline" className="bg-transparent">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Goals */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Personal Goals</CardTitle>
              </div>
              <CardDescription>
                Set your nutrition and health objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current-weight">Current Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="current-weight"
                      type="number"
                      placeholder="70"
                      className="flex-1"
                    />
                    <Select defaultValue="kg">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-weight">Target Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="target-weight"
                      type="number"
                      placeholder="65"
                      className="flex-1"
                    />
                    <Select defaultValue="kg">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calorie-goal">Daily Calorie Goal</Label>
                  <Input id="calorie-goal" type="number" placeholder="2000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity-level">Activity Level</Label>
                  <Select defaultValue="moderate">
                    <SelectTrigger id="activity-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Lightly Active</SelectItem>
                      <SelectItem value="moderate">
                        Moderately Active
                      </SelectItem>
                      <SelectItem value="very">Very Active</SelectItem>
                      <SelectItem value="extra">Extra Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-type">Primary Goal</Label>
                <Select defaultValue="maintain">
                  <SelectTrigger id="goal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loss">Weight Loss</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="gain">Muscle Gain</SelectItem>
                    <SelectItem value="health">General Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Update Goals</Button>
            </CardContent>
          </Card>

          {/* Dietary Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
              <CardDescription>
                Customize your meal recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Diet Type</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Balanced",
                    "Vegetarian",
                    "Vegan",
                    "Keto",
                    "Paleo",
                    "Mediterranean",
                    "Low Carb",
                  ].map((diet) => (
                    <Badge
                      key={diet}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    >
                      {diet}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies & Restrictions</Label>
                <Input id="allergies" placeholder="e.g., nuts, dairy, gluten" />
                <p className="text-xs text-muted-foreground">
                  Separate multiple items with commas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dislikes">Foods to Avoid</Label>
                <Input id="dislikes" placeholder="e.g., mushrooms, olives" />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Meal Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to log your meals
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly nutrition report
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Get personalized suggestions from AI
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle>App Settings</CardTitle>
              <CardDescription>Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <Label>Dark Mode</Label>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <Label>Language</Label>
                </div>
                <Select defaultValue="en">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Units</Label>
                <Select defaultValue="metric">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Legal & Support */}
          <Card>
            <CardHeader>
              <CardTitle>About & Legal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="border-accent/50 bg-accent/5">
                <AlertCircle className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm">
                  <strong>Important Disclaimer:</strong> This app provides
                  nutritional information and dietary guidance for educational
                  purposes only. It is not a substitute for professional medical
                  advice, diagnosis, or treatment. Always consult with a
                  qualified healthcare provider before making any dietary
                  changes, especially if you have medical conditions or
                  concerns.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <Shield className="mr-2 h-4 w-4" />
                Privacy Policy
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <FileText className="mr-2 h-4 w-4" />
                Terms of Service
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Button>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
