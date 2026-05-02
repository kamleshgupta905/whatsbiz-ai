import { useListBroadcasts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Plus, Clock, Users, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Broadcasts() {
  const { data, isLoading } = useListBroadcasts({ query: { queryKey: ["broadcasts"] } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Broadcasts</h1>
          <p className="text-muted-foreground">Send bulk WhatsApp messages to your customers.</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> New Broadcast</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data?.total || 0}</div>
              <p className="text-sm text-muted-foreground">Total Broadcasts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {data?.broadcasts?.reduce((acc, b) => acc + b.deliveredCount, 0) || 0}
              </div>
              <p className="text-sm text-muted-foreground">Messages Delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {data?.broadcasts?.reduce((acc, b) => acc + b.readCount, 0) || 0}
              </div>
              <p className="text-sm text-muted-foreground">Messages Read</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : data?.broadcasts?.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg bg-muted/20">
              <Megaphone className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No broadcasts yet</h3>
              <p className="text-muted-foreground mb-4">Create your first broadcast to reach your customers instantly.</p>
              <Button variant="outline">Create Broadcast</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.broadcasts?.map((b) => (
                <div key={b.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{b.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-xl">{b.message}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(b.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.recipientCount} Recipients</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={b.status === 'sent' ? 'default' : 'secondary'}>{b.status.toUpperCase()}</Badge>
                    <div className="text-sm font-medium">
                      {b.deliveredCount} delivered • {b.readCount} read
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
