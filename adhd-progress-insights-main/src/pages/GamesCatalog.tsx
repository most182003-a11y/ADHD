import { useState } from "react";
import SectionCard from "@/components/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gamepad2, Search } from "lucide-react";

const initialGames = [
  { id: 1, name: "Statues Game", category: "فرط الحركة (Hyperactivity)", description: "Focuses on motor control and inhibitory control." },
  { id: 2, name: "Focus Finder", category: "قلة التركيز (Inattention)", description: "Focuses on sustained attention and reaction time." },
  { id: 3, name: "Quick Reaction", category: "فرط الحركة (Hyperactivity)", description: "Focuses on impulsivity and rapid response management." },
  { id: 4, name: "Pattern Match", category: "قلة التركيز (Inattention)", description: "Focuses on visual attention and memory." },
];

export default function GamesCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredGames = initialGames.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || game.category.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Games Catalog</h1>
        <p className="text-muted-foreground">Manage and view all available therapeutic games categorized by target symptoms.</p>
      </div>

      <SectionCard>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search games..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="فرط الحركة">فرط الحركة (Hyperactivity)</SelectItem>
              <SelectItem value="قلة التركيز">قلة التركيز (Inattention)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Game Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGames.length > 0 ? (
                filteredGames.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                          <Gamepad2 className="w-4 h-4" />
                        </div>
                        {game.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={game.category.includes("فرط الحركة") ? "destructive" : "default"} className="font-normal">
                        {game.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {game.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-primary cursor-pointer hover:underline">View Details</span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No games found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
