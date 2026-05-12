import { useState } from "react";
import { useGetSubscription, useListPayments, useInitiatePayment, useVerifyPayment } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, QrCode } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Billing() {
  const { data: sub, isLoading: subLoading } = useGetSubscription({ query: { queryKey: ["subscription"] } });
  const { data: payments } = useListPayments({ query: { queryKey: ["payments"] } });
  const initiatePayment = useInitiatePayment();
  const verifyPayment = useVerifyPayment();

  const [paymentData, setPaymentData] = useState<any>(null);
  const [utr, setUtr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "PAYPAL">("UPI");
  const [paymentError, setPaymentError] = useState<{ reason: string; solution: string } | null>(null);

  const handleUpgrade = (planId: "STARTER" | "PRO" | "BUSINESS") => {
    setPaymentError(null);
    initiatePayment.mutate({ data: { plan: planId, paymentMethod } as any }, {
      onSuccess: (data) => setPaymentData(data),
      onError: (err: any) => {
        setPaymentError({
          reason: err?.response?.data?.reason || err?.message || "Payment method is not available.",
                  solution: err?.response?.data?.solution || "Use UPI payment, or ask admin to configure PayPal live gateway.",
        });
      },
    });
  };

  const handleVerify = () => {
    if (!paymentData || !utr) return;
    verifyPayment.mutate({ data: { paymentId: paymentData.paymentId, utr } }, {
      onSuccess: () => {
        setPaymentData(null);
        setUtr("");
        window.location.reload(); // Quick refresh to get new sub state
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Billing & Plan</h1>
          <p className="text-muted-foreground">Manage your subscription and payments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {subLoading ? <div>Loading...</div> : (
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between p-6 bg-muted/30 border rounded-xl">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold">{sub?.plan} Plan</h3>
                    <Badge variant={sub?.status === 'ACTIVE' ? 'default' : 'secondary'}>{sub?.status}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {sub?.plan === 'TRIAL' 
                      ? `Your trial expires in ${sub?.daysRemaining} days.` 
                      : `Your plan renews on ${new Date(sub?.endDate || '').toLocaleDateString()}.`}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Messages Used</span>
                      <span className="font-medium">{sub?.messagesUsed} / {sub?.messagesLimit === -1 ? 'Unlimited' : sub?.messagesLimit}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: sub?.messagesLimit === -1 ? '0%' : `${((sub?.messagesUsed || 0) / (sub?.messagesLimit || 1)) * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {paymentData ? (
          <Card className="col-span-1 border-primary shadow-md">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-lg">Complete Payment</CardTitle>
              <CardDescription>Amount to pay: <strong className="text-foreground">₹{paymentData.amount}</strong></CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 text-center">
              <div className="p-4 bg-white border rounded-xl inline-block mx-auto">
                <QrCode className="w-32 h-32 text-black mx-auto" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">UPI ID</p>
                <code className="bg-muted px-2 py-1 rounded text-sm">{paymentData.upiId}</code>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full gap-2"><ExternalLink className="w-3 h-3" /> GPay</Button>
                <Button variant="outline" className="w-full gap-2"><ExternalLink className="w-3 h-3" /> PhonePe</Button>
              </div>
              <div className="space-y-2 text-left pt-4 border-t">
                <Label>Enter UTR Number after payment</Label>
                <Input placeholder="e.g. 301234567890" value={utr} onChange={(e) => setUtr(e.target.value)} />
                <Button onClick={handleVerify} className="w-full" disabled={!utr || verifyPayment.isPending}>
                  Verify Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Upgrade Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(["UPI", "PAYPAL"] as const).map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={paymentMethod === method ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>
              {paymentMethod !== "UPI" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  PayPal gateway is not configured yet. UPI is available now; PayPal needs live gateway keys and webhook verification.
                </div>
              )}
              {paymentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <p className="font-semibold">Payment issue</p>
                  <p>Reason: {paymentError.reason}</p>
                  <p>Solution: {paymentError.solution}</p>
                </div>
              )}
              <div className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors" onClick={() => handleUpgrade("STARTER")}>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold">Starter</h4>
                  <span className="font-bold">₹499/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">1,000 AI replies, Basic KB.</p>
              </div>
              <div className="p-4 border-2 border-primary bg-primary/5 rounded-lg cursor-pointer" onClick={() => handleUpgrade("PRO")}>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-primary">Pro</h4>
                  <span className="font-bold text-primary">₹1499/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">5,000 AI replies, Broadcasts.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.payments?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{p.plan}</TableCell>
                  <TableCell>₹{p.amount}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'COMPLETED' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === 'COMPLETED' && <Button variant="ghost" size="sm">Download</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {!payments?.payments?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No past payments found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
