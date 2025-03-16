
import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlossaryTerm } from "./GlossaryPanel";

export const GlossaryContent: React.FC = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch glossary terms from Supabase
  useEffect(() => {
    const fetchGlossaryTerms = async () => {
      try {
        setIsLoading(true);
        // Get terms from Supabase
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

  // Save terms to localStorage as a backup when they change
  useEffect(() => {
    if (terms.length > 0 && !isLoading) {
      localStorage.setItem('glossary-terms', JSON.stringify(terms));
    }
  }, [terms, isLoading]);

  async function addTerm( newTerm, newDefinition = "" )
  {
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

  useEffect(() => {
    const onAddTerm = e => {
      console.log( "addTerm", e);
      addTerm( e.detail.term, e.detail.definition);
    };
    window.addEventListener('addToGlossary', onAddTerm);
    return () => window.removeEventListener('addToGlossary',onAddTerm);
  }, []);

  const handleAddTerm = async () => {
    if (!newTerm.trim() || !newDefinition.trim()) {
      toast.error("Both term and definition are required.");
      return;
    }

    addTerm( newTerm, newDefinition);
  };

  const handleDeleteTerm = async () => {
    if (!selectedTerm) return;
    
    setIsDeleting(true);
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('glossary_terms')
        .delete()
        .eq('id', selectedTerm.id);
        
      if (error) throw error;
      
      // Remove from local state
      setTerms(prev => prev.filter(term => term.id !== selectedTerm.id));
      toast.success(`Deleted "${selectedTerm.term}" from glossary`);
    } catch (error) {
      console.error("Error deleting term:", error);
      
      // Fallback: remove from local state anyway
      setTerms(prev => prev.filter(term => term.id !== selectedTerm.id));
      toast.success(`Deleted "${selectedTerm.term}" from glossary`);
    } finally {
      setSelectedTerm(null);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <div className="animate-spin h-6 w-6 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-3">
        <Drawer open={isAddingTerm} onOpenChange={setIsAddingTerm}>
          <DrawerTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-800" 
              title="Add Term"
            >
              <Plus className="h-4 w-4" />
              Add Term
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
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {terms.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No terms in the glossary yet.</p>
              <p className="text-sm">Click the + button to add your first term.</p>
            </div>
          ) : (
            terms.map((term) => (
              <div 
                key={term.id} 
                className="border-b border-green-100 pb-3 last:border-b-0 relative group"
              >
                <h3 className="font-bold text-green-800">{term.term}</h3>
                <p className="text-sm text-gray-700 mt-1">{term.definition}</p>
                <button 
                  className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => setSelectedTerm(term)}
                  title="Delete term"
                >
                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Confirmation dialog */}
      {selectedTerm && (
        <Drawer open={!!selectedTerm} onOpenChange={(open) => !open && setSelectedTerm(null)}>
          <DrawerContent className="p-4">
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-lg font-medium">Delete Term</h3>
              <p>Are you sure you want to delete the term "{selectedTerm.term}"?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedTerm(null)} className="gap-1">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteTerm}
                  disabled={isDeleting}
                  className="gap-1"
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};
