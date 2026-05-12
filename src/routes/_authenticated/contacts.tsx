import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({ meta: [{ title: "Trusted Contacts · ShadowShield+" }] }),
  component: ContactsPage,
});

interface Contact { id: string; name: string; phone: string; relation: string | null; priority: number }

function ContactsPage() {
  const [list, setList] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");

  const load = () => supabase.from("trusted_contacts").select("*").order("priority").then(({ data }) => setList((data as Contact[]) ?? []));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name || !phone) return toast.error("Name and phone required");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("trusted_contacts").insert({
      name, phone, relation: relation || null, user_id: user.id, priority: list.length + 1,
    });
    if (error) return toast.error(error.message);
    setName(""); setPhone(""); setRelation("");
    toast.success("Contact added");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("trusted_contacts").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display">Trusted Contacts</h1>
        <p className="text-sm text-muted-foreground">These people get notified with your live location during a Stage 3 escalation.</p>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle>Add contact</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-4 gap-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1..." /></div>
          <div><Label>Relation</Label><Input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Mom, Friend…" /></div>
          <div className="flex items-end"><Button className="w-full" onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">No contacts yet — add at least one trusted person.</p>}
        {list.map((c) => (
          <div key={c.id} className="glass rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center"><User className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="font-semibold">{c.name} <span className="text-xs text-muted-foreground">· {c.relation ?? "contact"}</span></div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
