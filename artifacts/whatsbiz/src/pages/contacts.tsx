import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListContacts } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Trash2, BellOff, Bell, Phone, MessageSquare, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContactItem {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  tags: string[];
  notes: string | null;
  totalMessages: number;
  lastMessageAt: string | null;
  totalOrders: number;
  totalRevenue: number;
  dndEnabled: boolean;
}

async function apiCall(path: string, method = "GET", body?: unknown) {
  const token = localStorage.getItem("token");
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:   { opacity: 0, x: -20, transition: { duration: 0.18 } },
};

const headerVariants = {
  hidden: { opacity: 0, y: -16 },
  show:   { opacity: 1,  y: 0,  transition: { duration: 0.35 } },
};

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingDnd, setTogglingDnd] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListContacts(
    search ? { search } : undefined,
    { query: { queryKey: ["contacts", search] } }
  );

  const contacts = (data?.contacts ?? []) as ContactItem[];

  const handleToggleDnd = async (contact: ContactItem) => {
    setTogglingDnd(contact.id);
    try {
      await apiCall(`/api/contacts/${contact.id}/dnd`, "PATCH", { dndEnabled: !contact.dndEnabled });
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({
        title: contact.dndEnabled ? "DND removed" : "DND enabled",
        description: contact.dndEnabled
          ? `${contact.name || contact.phone} will now receive broadcasts.`
          : `${contact.name || contact.phone} won't receive any broadcast messages.`,
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not update DND status." });
    } finally {
      setTogglingDnd(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiCall(`/api/contacts/${deleteId}`, "DELETE");
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact deleted", description: `${deleteName} removed successfully.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete the contact." });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const dndCount = contacts.filter(c => c.dndEnabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={headerVariants} initial="hidden" animate="show"
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Contacts CRM</h1>
          <p className="text-muted-foreground">Manage your WhatsApp customers and leads.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {dndCount > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700"
            >
              <BellOff className="w-3 h-3" />
              {dndCount} on DND — excluded from broadcasts
            </motion.div>
          )}
          <Button className="gap-2"><UserPlus className="w-4 h-4" /> Add Contact</Button>
        </div>
      </motion.div>

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-card border rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Search bar */}
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or phone..."
              className="pl-9 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground ml-auto shrink-0">
            {data?.total ?? 0} contacts
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center gap-3 text-muted-foreground">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
            <span className="text-sm">Loading contacts...</span>
          </div>
        ) : contacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-16 flex flex-col items-center gap-2 text-muted-foreground"
          >
            <UserPlus className="w-12 h-12 opacity-20 mb-2" />
            <p className="font-medium">{search ? `No contacts found for "${search}"` : "No contacts yet"}</p>
            <p className="text-sm">Contacts appear here after your first WhatsApp conversation.</p>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground text-xs">
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Tags</th>
                  <th className="text-center px-4 py-3 font-medium hidden md:table-cell">
                    <span className="flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" /> Msgs</span>
                  </th>
                  <th className="text-center px-4 py-3 font-medium hidden lg:table-cell">Last Contact</th>
                  <th className="text-center px-4 py-3 font-medium">DND</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                <AnimatePresence>
                  {contacts.map((contact) => (
                    <motion.tr
                      key={contact.id}
                      variants={rowVariants}
                      exit="exit"
                      layout
                      className={cn(
                        "border-b last:border-0 hover:bg-muted/20 transition-colors",
                        contact.dndEnabled && "bg-red-50/40"
                      )}
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs",
                            contact.dndEnabled
                              ? "bg-red-100 text-red-600"
                              : "bg-primary/10 text-primary"
                          )}>
                            {(contact.name || contact.phone).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[120px]">{contact.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground font-mono sm:hidden truncate">{contact.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">{contact.phone}</span>
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex gap-1 flex-wrap max-w-[140px]">
                          {contact.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{contact.tags.length - 3}</Badge>
                          )}
                        </div>
                      </td>

                      {/* Messages */}
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="text-sm font-medium">{contact.totalMessages}</span>
                      </td>

                      {/* Last contact */}
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {contact.lastMessageAt
                            ? new Date(contact.lastMessageAt).toLocaleDateString("en-IN")
                            : "—"}
                        </span>
                      </td>

                      {/* DND toggle */}
                      <td className="px-4 py-3 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleToggleDnd(contact)}
                              disabled={togglingDnd === contact.id}
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors",
                                contact.dndEnabled
                                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                              )}
                            >
                              {togglingDnd === contact.id ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                                  className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                                />
                              ) : contact.dndEnabled ? (
                                <BellOff className="w-3.5 h-3.5" />
                              ) : (
                                <Bell className="w-3.5 h-3.5" />
                              )}
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {contact.dndEnabled
                              ? "DND ON — click to re-enable broadcasts"
                              : "Click to enable DND (exclude from broadcasts)"}
                          </TooltipContent>
                        </Tooltip>
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-3 text-right">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          whileHover={{ scale: 1.1 }}
                          onClick={() => { setDeleteId(contact.id); setDeleteName(contact.name || contact.phone); }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* DND info box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-muted bg-muted/30 p-4 flex items-start gap-3 text-sm text-muted-foreground"
      >
        <BellOff className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
        <div>
          <span className="font-medium text-foreground">DND (Do Not Disturb)</span> — Contacts with DND enabled are automatically excluded from all broadcast sends. 
          They can also self-opt-out by sending <code className="bg-muted px-1 rounded text-xs">STOP</code> and re-subscribe with <code className="bg-muted px-1 rounded text-xs">START</code>.
        </div>
      </motion.div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{deleteName}</span> will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
