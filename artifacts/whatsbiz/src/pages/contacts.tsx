import { useListContacts } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Contacts() {
  const { data, isLoading } = useListContacts(undefined, { query: { queryKey: ["contacts"] } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts CRM</h1>
          <p className="text-muted-foreground">Manage your WhatsApp customers and leads.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
          <Button className="gap-2"><UserPlus className="w-4 h-4" /> Add Contact</Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name or phone..." className="pl-9" />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading contacts...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Total Msgs</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Last Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.contacts?.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name || "Unknown"}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{contact.totalMessages}</TableCell>
                  <TableCell className="text-right font-medium">₹{contact.totalRevenue}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
              {!data?.contacts?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No contacts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
