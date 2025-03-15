
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Book, Save, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  created_at: string;
}

export const GlossaryPanel = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [isAddingTerm, setIsAddingTerm] = useState(false);

  // Fetch glossary terms from Supabase or localStorage
  useEffect(() => {
    const fetchGlossaryTerms = async () => {
      try {
        // Try to get terms from Supabase
        const { data, error } = await supabase
          .from('glossary_terms')
          .select('*')
          .order('term', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setTerms(data);
        } else {
          // If no terms in DB, use default starter terms
          const defaultTerms = [
            {
              id: "1",
              term: "Annual",
              definition: "A plant that completes its life cycle in one growing season and must be replanted each year.",
              created_at: new Date().toISOString()
            },
            {
              id: "2",
              term: "Perennial",
              definition: "A plant that lives for more than two years, often flowering and fruiting repeatedly.",
              created_at: new Date().toISOString()
            },
            {
              id: "3",
              term: "Deadheading",
              definition: "Removing faded or dead flowers from plants to encourage further flowering.",
              created_at: new Date().toISOString()
            }
          ];
          
          setTerms(defaultTerms);
          
          // Store default terms in database
          for (const term of defaultTerms) {
            await supabase.from('glossary_terms').insert({
              term: term.term,
              definition: term.definition,
              user_id: ANONYMOUS_USER_ID
            });
          }
        }
      } catch (error) {
        console.error("Error fetching glossary terms:", error);
        // Fallback to localStorage if DB fetch fails
        const storedTerms = localStorage.getItem('glossary-terms');
        if (storedTerms) {
          setTerms(JSON.parse(storedTerms));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlossaryTerms();
  }, []);

  // Save terms to localStorage when they change
  useEffect(() => {
    if (terms.length > 0 && !isLoading) {
      localStorage.setItem('glossary-terms', JSON.stringify(terms));
    }
  }, [terms, isLoading]);

  const handleAddTerm = async () => {
    if (!newTerm.trim() || !newDefinition.trim()) {
      toast.error("Both term and definition are required.");
      return;
    }

    const termObject: Omit<GlossaryTerm, "id" | "created_at"> = {
      term: newTerm.trim(),
      definition: newDefinition.trim()
    };

    try {
      // Add to Supabase
      const { data, error } = await supabase
        .from('glossary_terms')
        .insert({
          ...termObject,
          user_id: ANONYMOUS_USER_ID
        })
        .select('*')
        .single();

      if (error) throw error;

      // Add to local state
      if (data) {
        setTerms(prev => [...prev, data].sort((a, b) => a.term.localeCompare(b.term)));
        toast.success(`Added "${newTerm}" to glossary`);
      }
    } catch (error) {
      console.error("Error adding term:", error);
      
      // Fallback to local state only
      const newTermObject: GlossaryTerm = {
        id: Date.now().toString(),
        ...termObject,
        created_at: new Date().toISOString()
      };
      
      setTerms(prev => [...prev, newTermObject].sort((a, b) => a.term.localeCompare(b.term)));
      toast.success(`Added "${newTerm}" to glossary`);
    } finally {
      // Reset form
      setNewTerm("");
      setNewDefinition("");
      setIsAddingTerm(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="flex flex-col h-full border-green-200 bg-green-50">
        <CardHeader className="bg-green-700 text-white rounded-t-lg py-3">
          <CardTitle className="flex items-center text-lg">
            <Book className="mr-2 h-5 w-5" />
            Gardening Glossary
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center flex-1 p-8">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full border-green-200 bg-green-50">
      <CardHeader className="bg-green-700 text-white rounded-t-lg py-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Book className="mr-2 h-5 w-5" />
            Gardening Glossary
          </div>
          <Drawer open={isAddingTerm} onOpenChange={setIsAddingTerm}>
            <DrawerTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-white hover:bg-green-600" 
                title="Add Term"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="p-4">
              <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-lg font-medium">Add New Gardening Term</h3>
                <div className="space-y-2">
                  <label htmlFor="term" className="text-sm font-medium">Term</label>
                  <Input 
                    id="term" 
                    value={newTerm} 
                    onChange={(e) => setNewTerm(e.target.value)} 
                    placeholder="e.g., Composting"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="definition" className="text-sm font-medium">Definition</label>
                  <Textarea 
                    id="definition" 
                    value={newDefinition} 
                    onChange={(e) => setNewDefinition(e.target.value)} 
                    placeholder="Write a clear, concise definition..."
                    className="min-h-[120px]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <DrawerClose asChild>
                    <Button variant="outline" className="gap-1">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </DrawerClose>
                  <Button 
                    className="gap-1 bg-green-700 hover:bg-green-800" 
                    onClick={handleAddTerm}
                    disabled={!newTerm.trim() || !newDefinition.trim()}
                  >
                    <Save className="h-4 w-4" />
                    Save Term
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {terms.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No terms in the glossary yet.</p>
                <p className="text-sm">Click the + button to add your first term.</p>
              </div>
            ) : (
              terms.map((term) => (
                <div key={term.id} className="border-b border-green-100 pb-3 last:border-b-0">
                  <h3 className="font-bold text-green-800">{term.term}</h3>
                  <p className="text-sm text-gray-700 mt-1">{term.definition}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t text-xs text-gray-500 justify-center">
        {terms.length} {terms.length === 1 ? 'term' : 'terms'} in glossary
      </CardFooter>
    </Card>
  );
};
