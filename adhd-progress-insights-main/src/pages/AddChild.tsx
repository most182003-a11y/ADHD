import { useState } from "react";
import { UserPlus, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SectionCard from "@/components/SectionCard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function AddChild() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male",
    diagnosis_severity: "moderate",
    therapist: "Dr. Sara Hassan",
    status: "stable"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const id = `C${Math.floor(1000 + Math.random() * 9000)}`;
      const avatar_initials = formData.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const { error } = await supabase
        .from('children')
        .insert([{
          id,
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          diagnosis_severity: formData.diagnosis_severity,
          therapist: formData.therapist,
          status: formData.status,
          avatar_initials,
          registered_date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "New patient registered successfully.",
      });

      navigate("/child-analytics");
    } catch (error: any) {
      console.error("Error adding child:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register patient.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold font-display">Register New Patient</h2>
      </div>

      <SectionCard title="Patient Information" subtitle="Enter the details for the new child">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Full Name</label>
              <Input 
                required 
                placeholder="e.g. Adam Ahmed" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Age</label>
              <Input 
                required 
                type="number" 
                placeholder="Years" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Gender</label>
              <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">ADHD Severity</label>
              <Select value={formData.diagnosis_severity} onValueChange={v => setFormData({...formData, diagnosis_severity: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assigned Therapist</label>
              <Input 
                required 
                value={formData.therapist}
                onChange={e => setFormData({...formData, therapist: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Current Status</label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="improving">Improving</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="needs_intervention">Needs Intervention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading} className="gradient-primary text-primary-foreground min-w-32">
              <Save size={16} className="mr-2" />
              {loading ? "Registering..." : "Save Patient"}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
