import { useState, useEffect } from "react";
import { useGetWhatsappStatus, useUpdateWhatsappSettings, useGetBusinessProfile, useUpdateBusinessProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Save, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const { data: waStatus, refetch: refetchWa } = useGetWhatsappStatus({ query: { queryKey: ["waStatus"] } });
  const { data: profile, refetch: refetchProfile } = useGetBusinessProfile({ query: { queryKey: ["profile"] } });
  
  const updateWa = useUpdateWhatsappSettings();
  const updateProfile = useUpdateBusinessProfile();

  const [waSettings, setWaSettings] = useState({
    isAIEnabled: true,
    awayMessage: ""
  });

  const [profileData, setProfileData] = useState({
    name: "",
    businessName: "",
    language: ""
  });

  useEffect(() => {
    if (waStatus) setWaSettings({ isAIEnabled: waStatus.isAIEnabled, awayMessage: waStatus.awayMessage || "" });
    if (profile) setProfileData({ name: profile.name, businessName: profile.businessName, language: profile.language });
  }, [waStatus, profile]);

  const handleSaveWa = () => {
    updateWa.mutate({ data: waSettings }, {
      onSuccess: () => {
        toast({ title: "WhatsApp Settings Saved" });
        refetchWa();
      }
    });
  };

  const handleSaveProfile = () => {
    updateProfile.mutate({ data: profileData }, {
      onSuccess: () => {
        toast({ title: "Business Profile Saved" });
        refetchProfile();
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> WhatsApp Configuration</CardTitle>
          <CardDescription>Manage how the AI interacts on your WhatsApp number.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div>
              <h4 className="font-semibold text-base">Global AI Autopilot</h4>
              <p className="text-sm text-muted-foreground">When disabled, AI will not reply to any incoming messages.</p>
            </div>
            <Switch 
              checked={waSettings.isAIEnabled} 
              onCheckedChange={(c) => setWaSettings({...waSettings, isAIEnabled: c})} 
            />
          </div>

          <div className="space-y-2">
            <Label>Away Message (Optional)</Label>
            <Textarea 
              placeholder="Sent when you are outside working hours..." 
              value={waSettings.awayMessage}
              onChange={(e) => setWaSettings({...waSettings, awayMessage: e.target.value})}
            />
            <p className="text-xs text-muted-foreground">Leave blank to let AI handle out-of-hours messages normally.</p>
          </div>

          <Button onClick={handleSaveWa} disabled={updateWa.isPending} className="gap-2">
            <Save className="w-4 h-4" /> Save WhatsApp Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Update your company details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input 
                value={profileData.name} 
                onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input 
                value={profileData.businessName} 
                onChange={(e) => setProfileData({...profileData, businessName: e.target.value})} 
              />
            </div>
          </div>
          
          <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} variant="outline" className="gap-2">
            <Save className="w-4 h-4" /> Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
