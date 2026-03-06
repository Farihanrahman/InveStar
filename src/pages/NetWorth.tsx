import Navigation from "@/components/Navigation";
import AuthRequired from "@/components/AuthRequired";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Plus, Wallet, PiggyBank, Building, Home, Trash2, Pencil, Check, X, Bitcoin, Car, Briefcase, Target, Calendar, Flag, Landmark, CreditCard, Banknote } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NetWorthExcelUpload from "@/components/NetWorthExcelUpload";
import NetWorthPieChart from "@/components/NetWorthPieChart";

interface Asset {
  id: string;
  name: string;
  type: string;
  value: number;
  icon: string;
}

interface FinancialGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string;
  status: string;
}

const NetWorth = () => {
  const [userName, setUserName] = useState<string>("User");
  const [userId, setUserId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: "", type: "", subCategory: "", value: "" });
  const [newGoal, setNewGoal] = useState({ name: "", target_amount: "", current_amount: "", deadline: "", category: "savings" });

  // Sub-category options for savings
  const savingsSubCategories = [
    "Fixed Deposit",
    "Recurring Deposit",
    "High-Yield Savings",
    "Money Market",
    "Emergency Fund",
    "Cash",
    "Other"
  ];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", type: "", value: "" });

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const name = session.user.user_metadata?.full_name ||
                     session.user.user_metadata?.name ||
                     session.user.email?.split('@')[0] ||
                     'User';
        setUserName(name);
        setUserId(session.user.id);
        await fetchAssets(session.user.id);
        await fetchGoals(session.user.id);
      }
      setLoading(false);
    };
    fetchUserAndData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name ||
                     session.user.user_metadata?.name ||
                     session.user.email?.split('@')[0] ||
                     'User';
        setUserName(name);
        setUserId(session.user.id);
        setTimeout(() => {
          fetchAssets(session.user.id);
          fetchGoals(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAssets = async (uid: string) => {
    const { data, error } = await supabase
      .from('net_worth_assets')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching assets:', error);
      return;
    }
    
    setAssets(data?.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      value: Number(a.value),
      icon: a.icon
    })) || []);
  };

  const fetchGoals = async (uid: string) => {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }
    
    setGoals(data?.map(g => ({
      id: g.id,
      name: g.name,
      target_amount: Number(g.target_amount),
      current_amount: Number(g.current_amount),
      deadline: g.deadline,
      category: g.category,
      status: g.status
    })) || []);
  };

  const totalNetWorth = assets.reduce((sum, a) => sum + a.value, 0);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "trending": return TrendingUp;
      case "piggy": return PiggyBank;
      case "home": return Home;
      case "building": return Building;
      case "crypto": return Bitcoin;
      case "vehicle": return Car;
      case "business": return Briefcase;
      default: return Wallet;
    }
  };

  const getIconForType = (type: string): string => {
    switch (type) {
      case "stocks": return "trending";
      case "savings": return "piggy";
      case "property": return "home";
      case "retirement": return "building";
      case "crypto": return "crypto";
      case "vehicle": return "vehicle";
      case "business": return "business";
      default: return "wallet";
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "stocks": return "Investment Portfolio";
      case "savings": return "Savings Account";
      case "property": return "Real Estate";
      case "retirement": return "Retirement Account";
      case "crypto": return "Cryptocurrency";
      case "vehicle": return "Vehicle";
      case "business": return "Business";
      case "other": return "Other Assets";
      default: return type;
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.name || !newAsset.type || !newAsset.value || !userId) {
      toast.error("Please fill in all fields");
      return;
    }

    // Include sub-category in name if provided
    const assetName = newAsset.subCategory 
      ? `${newAsset.name} (${newAsset.subCategory})`
      : newAsset.name;

    const { error } = await supabase.from('net_worth_assets').insert({
      user_id: userId,
      name: assetName,
      type: newAsset.type,
      value: parseFloat(newAsset.value),
      icon: getIconForType(newAsset.type)
    });

    if (error) {
      toast.error("Failed to add asset");
      console.error(error);
      return;
    }

    await fetchAssets(userId);
    setNewAsset({ name: "", type: "", subCategory: "", value: "" });
    setIsAssetDialogOpen(false);
    toast.success(`Added ${assetName} to your net worth tracker`);
  };

  const handleDeleteAsset = async (id: string) => {
    if (!userId) return;
    
    const { error } = await supabase.from('net_worth_assets').delete().eq('id', id);
    
    if (error) {
      toast.error("Failed to delete asset");
      return;
    }
    
    await fetchAssets(userId);
    toast.success("Asset removed");
  };

  const startEditing = (asset: Asset) => {
    setEditingId(asset.id);
    setEditForm({
      name: asset.name,
      type: asset.type,
      value: asset.value.toString(),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: "", type: "", value: "" });
  };

  const saveEditing = async (id: string) => {
    if (!editForm.name || !editForm.type || !editForm.value || !userId) {
      toast.error("Please fill in all fields");
      return;
    }

    const value = parseFloat(editForm.value);
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid value");
      return;
    }

    const { error } = await supabase.from('net_worth_assets').update({
      name: editForm.name,
      type: editForm.type,
      value: value,
      icon: getIconForType(editForm.type)
    }).eq('id', id);

    if (error) {
      toast.error("Failed to update asset");
      return;
    }

    await fetchAssets(userId);
    setEditingId(null);
    setEditForm({ name: "", type: "", value: "" });
    toast.success("Asset updated");
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount || !userId) {
      toast.error("Please fill in required fields");
      return;
    }

    const { error } = await supabase.from('financial_goals').insert({
      user_id: userId,
      name: newGoal.name,
      target_amount: parseFloat(newGoal.target_amount),
      current_amount: parseFloat(newGoal.current_amount) || 0,
      deadline: newGoal.deadline || null,
      category: newGoal.category
    });

    if (error) {
      toast.error("Failed to add goal");
      console.error(error);
      return;
    }

    await fetchGoals(userId);
    setNewGoal({ name: "", target_amount: "", current_amount: "", deadline: "", category: "savings" });
    setIsGoalDialogOpen(false);
    toast.success(`Added goal: ${newGoal.name}`);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!userId) return;
    
    const { error } = await supabase.from('financial_goals').delete().eq('id', id);
    
    if (error) {
      toast.error("Failed to delete goal");
      return;
    }
    
    await fetchGoals(userId);
    toast.success("Goal removed");
  };

  const handleUpdateGoalProgress = async (id: string, newAmount: number) => {
    if (!userId) return;

    const goal = goals.find(g => g.id === id);
    const newStatus = goal && newAmount >= goal.target_amount ? 'completed' : 'in_progress';

    const { error } = await supabase.from('financial_goals').update({
      current_amount: newAmount,
      status: newStatus
    }).eq('id', id);

    if (error) {
      toast.error("Failed to update progress");
      return;
    }

    await fetchGoals(userId);
    if (newStatus === 'completed') {
      toast.success("🎉 Goal completed!");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "savings": return PiggyBank;
      case "investment": return TrendingUp;
      case "retirement": return Building;
      case "property": return Home;
      case "emergency": return Flag;
      default: return Target;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AuthRequired pageName="Net Worth Tracker">
        <main className="container mx-auto px-4 pt-24 pb-12">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              {userName}'s Net Worth
            </h1>
            <p className="text-muted-foreground">Track and manage all your assets and financial goals</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Worth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-5xl font-bold text-foreground">
                    ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <span className="text-sm text-muted-foreground">
                      {assets.length} asset{assets.length !== 1 ? 's' : ''} tracked
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2" size="lg">
                      <Plus className="w-5 h-5" />
                      Add Asset
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Asset</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="asset-name">Asset Name</Label>
                        <Input
                          id="asset-name"
                          placeholder="e.g., Stock Portfolio"
                          value={newAsset.name}
                          onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="asset-type">Type</Label>
                        <Select
                          value={newAsset.type}
                          onValueChange={(value) => setNewAsset({ ...newAsset, type: value, subCategory: "" })}
                        >
                          <SelectTrigger id="asset-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stocks">Investment Portfolio</SelectItem>
                            <SelectItem value="savings">Savings Account</SelectItem>
                            <SelectItem value="property">Real Estate</SelectItem>
                            <SelectItem value="retirement">Retirement Account</SelectItem>
                            <SelectItem value="crypto">Cryptocurrency</SelectItem>
                            <SelectItem value="vehicle">Vehicle</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="other">Other Assets</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newAsset.type === "savings" && (
                        <div>
                          <Label htmlFor="asset-subcategory">Sub-Category</Label>
                          <Select
                            value={newAsset.subCategory}
                            onValueChange={(value) => setNewAsset({ ...newAsset, subCategory: value })}
                          >
                            <SelectTrigger id="asset-subcategory">
                              <SelectValue placeholder="Select sub-category (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {savingsSubCategories.map((sub) => (
                                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="asset-value">Current Value ($)</Label>
                        <Input
                          id="asset-value"
                          type="number"
                          placeholder="0.00"
                          value={newAsset.value}
                          onChange={(e) => setNewAsset({ ...newAsset, value: e.target.value })}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <Button onClick={handleAddAsset} className="w-full">
                        Add Asset
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2" size="lg">
                      <Target className="w-5 h-5" />
                      Add Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Financial Goal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="goal-name">Goal Name</Label>
                        <Input
                          id="goal-name"
                          placeholder="e.g., Emergency Fund"
                          value={newGoal.name}
                          onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="goal-category">Category</Label>
                        <Select
                          value={newGoal.category}
                          onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                        >
                          <SelectTrigger id="goal-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="investment">Investment</SelectItem>
                            <SelectItem value="retirement">Retirement</SelectItem>
                            <SelectItem value="property">Property</SelectItem>
                            <SelectItem value="emergency">Emergency Fund</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="goal-target">Target Amount ($)</Label>
                        <Input
                          id="goal-target"
                          type="number"
                          placeholder="10000.00"
                          value={newGoal.target_amount}
                          onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="goal-current">Current Amount ($)</Label>
                        <Input
                          id="goal-current"
                          type="number"
                          placeholder="0.00"
                          value={newGoal.current_amount}
                          onChange={(e) => setNewGoal({ ...newGoal, current_amount: e.target.value })}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="goal-deadline">Target Date (optional)</Label>
                        <Input
                          id="goal-deadline"
                          type="date"
                          value={newGoal.deadline}
                          onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleAddGoal} className="w-full">
                        Add Goal
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {userId && (
                  <NetWorthExcelUpload
                    userId={userId}
                    onUploadComplete={() => fetchAssets(userId)}
                  />
                )}
              </CardContent>
            </Card>

            {/* Pie Chart */}
            {assets.length > 0 && (
              <NetWorthPieChart assets={assets} />
            )}
          </div>

          <Tabs defaultValue="assets" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="assets" className="gap-2">
                <Wallet className="w-4 h-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="goals" className="gap-2">
                <Target className="w-4 h-4" />
                Goals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assets">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assets.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">No assets yet. Add your first asset to start tracking your net worth!</p>
                    </CardContent>
                  </Card>
                ) : (
                  assets.map((asset) => {
                    const Icon = getIcon(asset.icon);
                    const percentage = totalNetWorth > 0 ? (asset.value / totalNetWorth) * 100 : 0;
                    const isEditing = editingId === asset.id;
                    
                    return (
                      <Card key={asset.id} className="transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            {isEditing ? (
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  placeholder="Asset name"
                                  className="h-8"
                                />
                                <Select
                                  value={editForm.type}
                                  onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="stocks">Investment Portfolio</SelectItem>
                                    <SelectItem value="savings">Savings Account</SelectItem>
                                    <SelectItem value="property">Real Estate</SelectItem>
                                    <SelectItem value="retirement">Retirement Account</SelectItem>
                                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                                    <SelectItem value="vehicle">Vehicle</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="other">Other Assets</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div>
                                <CardTitle className="text-lg">{asset.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{getTypeLabel(asset.type)}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => saveEditing(asset.id)}
                                  className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={cancelEditing}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEditing(asset)}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">$</span>
                                <Input
                                  type="number"
                                  value={editForm.value}
                                  onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                                  className="text-2xl font-bold h-12"
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            ) : (
                              <div className="text-3xl font-bold text-foreground">
                                ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {percentage.toFixed(1)}% of net worth
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="goals">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Target className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">No financial goals yet. Set your first goal to start your journey!</p>
                    </CardContent>
                  </Card>
                ) : (
                  goals.map((goal) => {
                    const Icon = getCategoryIcon(goal.category);
                    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                    const isCompleted = goal.status === 'completed';
                    
                    return (
                      <Card key={goal.id} className={`transition-all hover:shadow-lg ${isCompleted ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isCompleted ? 'bg-green-500/20' : 'bg-gradient-to-br from-primary/20 to-accent/20'}`}>
                              <Icon className={`w-6 h-6 ${isCompleted ? 'text-green-500' : 'text-primary'}`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {goal.name}
                                {isCompleted && <Check className="w-5 h-5 text-green-500" />}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground capitalize">{goal.category}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-sm text-muted-foreground">Current</p>
                              <p className="text-2xl font-bold text-foreground">
                                ${goal.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Target</p>
                              <p className="text-lg font-semibold text-muted-foreground">
                                ${goal.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className={isCompleted ? 'text-green-500 font-semibold' : 'text-foreground'}>
                                {Math.min(progress, 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={Math.min(progress, 100)} className={isCompleted ? '[&>div]:bg-green-500' : ''} />
                          </div>

                          {goal.deadline && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>Target: {new Date(goal.deadline).toLocaleDateString()}</span>
                            </div>
                          )}

                          {!isCompleted && (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Update amount"
                                className="flex-1"
                                min="0"
                                step="0.01"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const value = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(value)) {
                                      handleUpdateGoalProgress(goal.id, value);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                                  if (input) {
                                    const value = parseFloat(input.value);
                                    if (!isNaN(value)) {
                                      handleUpdateGoalProgress(goal.id, value);
                                      input.value = '';
                                    }
                                  }
                                }}
                              >
                                Update
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </AuthRequired>
    </div>
  );
};

export default NetWorth;
