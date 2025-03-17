import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, X, Pencil } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlossaryTerm } from "./GlossaryPanel";
import { useLongPress } from "@/utils/useLongPress";
import ReactMarkdown from "react-markdown";

export const GlossaryContent: React.FC = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingTerm, setEditingTerm] = useState<string | null>(null);
  const [editedTermValue, setEditedTermValue] = useState("");
  const [editedDefinitionValue, setEditedDefinitionValue] = useState("");
  const termRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [newlyAddedTerm, setNewlyAddedTerm] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlossaryTerms = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('glossary_terms')
          .select('*')
          .order('term', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setTerms(data);
        } else {
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

  useEffect(() => {
    if (terms.length > 0 && !isLoading) {
      localStorage.setItem('glossary-terms', JSON.stringify(terms));
    }
  }, [terms, isLoading]);

  useEffect(() => {
    if (newlyAddedTerm && termRefs.current[newlyAddedTerm] && containerRef.current) {
      setTimeout(() => {
        const termElement = termRefs.current[newlyAddedTerm];
        const container = containerRef.current;
        
        if (termElement && container) {
          const termRect = termElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          const scrollTo = termElement.offsetTop - (container.clientHeight / 2) + (termRect.height / 2);
          container.scrollTop = scrollTo;
          
          termElement.classList.add('bg-green-50');
          setTimeout(() => {
            termElement.classList.remove('bg-green-50');
          }, 2000);
        }
        
        setNewlyAddedTerm(null);
      }, 100);
    }
  }, [newlyAddedTerm, terms]);

  async function addTerm(newTerm, newDefinition = "") {
    const termObject: Omit<GlossaryTerm, "id" | "created_at"> = {
      term: newTerm.trim(),
      definition: newDefinition.trim()
    };

    try {
      const { data, error } = await supabase
        .from('glossary_terms')
        .insert({
          ...termObject,
          user_id: ANONYMOUS_USER_ID
        })
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setTerms(prev => [...prev, data].sort((a, b) => a.term.localeCompare(b.term)));
        setNewlyAddedTerm(data.term);
      }
    } catch (error) {
      console.error("Error adding term:", error);
      
      const newTermObject: GlossaryTerm = {
        id: Date.now().toString(),
        ...termObject,
        created_at: new Date().toISOString()
      };
      
      setTerms(prev => [...prev, newTermObject].sort((a, b) => a.term.localeCompare(b.term)));
      setNewlyAddedTerm(newTermObject.term);
    } finally {
      setNewTerm("");
      setNewDefinition("");
      setIsAddingTerm(false);
    }
  }

  useEffect(() => {
    const onAddTerm = (e: CustomEvent) => {
      console.log("addToGlossary event received:", e.detail);
      addTerm(e.detail.term, e.detail.definition);
    };
    
    const onActivateGlossaryTab = (e: CustomEvent) => {
      console.log("activateGlossaryTab event received:", e.detail);
      const event = new CustomEvent('activateTab', {
        detail: { tab: 'glossary', term: e.detail.term }
      });
      window.dispatchEvent(event);
    };
    
    window.addEventListener('addToGlossary', onAddTerm as EventListener);
    window.addEventListener('activateGlossaryTab', onActivateGlossaryTab as EventListener);
    
    return () => {
      window.removeEventListener('addToGlossary', onAddTerm as EventListener);
      window.removeEventListener('activateGlossaryTab', onActivateGlossaryTab as EventListener);
    };
  }, []);

  const handleAddTerm = async () => {
    if (!newTerm.trim() || !newDefinition.trim()) {
      toast.error("Both term and definition are required.");
      return;
    }

    addTerm(newTerm, newDefinition);
  };

  const handleDeleteTerm = async () => {
    if (!selectedTerm) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('glossary_terms')
        .delete()
        .eq('id', selectedTerm.id);
        
      if (error) throw error;
      
      setTerms(prev => prev.filter(term => term.id !== selectedTerm.id));
      toast.success(`Deleted "${selectedTerm.term}" from glossary`);
    } catch (error) {
      console.error("Error deleting term:", error);
      
      setTerms(prev => prev.filter(term => term.id !== selectedTerm.id));
      toast.success(`Deleted "${selectedTerm.term}" from glossary`);
    } finally {
      setSelectedTerm(null);
      setIsDeleting(false);
    }
  };

  const startEditingTerm = (term: GlossaryTerm) => {
    setEditingTerm(term.id);
    setEditedTermValue(term.term);
    setEditedDefinitionValue(term.definition);
  };

  const cancelEditing = () => {
    setEditingTerm(null);
    setEditedTermValue("");
    setEditedDefinitionValue("");
  };

  const saveEditedTerm = async (termId: string) => {
    if (!editedTermValue.trim() || !editedDefinitionValue.trim()) {
      toast.error("Both term and definition are required.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('glossary_terms')
        .update({
          term: editedTermValue.trim(),
          definition: editedDefinitionValue.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', termId);
        
      if (error) throw error;
      
      setTerms(prev => prev.map(term => 
        term.id === termId 
          ? { 
              ...term, 
              term: editedTermValue.trim(), 
              definition: editedDefinitionValue.trim(),
              updated_at: new Date().toISOString()
            } 
          : term
      ).sort((a, b) => a.term.localeCompare(b.term)));
      
      toast.success(`Updated "${editedTermValue}"`);
    } catch (error) {
      console.error("Error updating term:", error);
      
      setTerms(prev => prev.map(term => 
        term.id === termId 
          ? { 
              ...term, 
              term: editedTermValue.trim(), 
              definition: editedDefinitionValue.trim(),
              updated_at: new Date().toISOString()
            } 
          : term
      ).sort((a, b) => a.term.localeCompare(b.term)));
      
      toast.success(`Updated "${editedTermValue}"`);
    } finally {
      cancelEditing();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin h-6 w-6 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" ref={containerRef}>
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
      
      <div className="p-4 space-y-4">
        {terms.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No terms in the glossary yet.</p>
            <p className="text-sm">Click the + button to add your first term.</p>
          </div>
        ) : (
          terms.map((term) => {
            const longPressProps = useLongPress({
              onLongPress: () => startEditingTerm(term)
            });

            return (
              <div 
                key={term.id} 
                className="border-b border-green-100 pb-3 last:border-b-0 relative group transition-colors duration-300"
                ref={el => termRefs.current[term.term] = el}
              >
                {editingTerm === term.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editedTermValue}
                      onChange={(e) => setEditedTermValue(e.target.value)}
                      className="font-bold text-green-800"
                      autoFocus
                    />
                    <Textarea
                      value={editedDefinitionValue}
                      onChange={(e) => setEditedDefinitionValue(e.target.value)}
                      className="text-sm text-gray-700 min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={cancelEditing}
                        className="gap-1"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => saveEditedTerm(term.id)}
                        className="gap-1 bg-green-700 hover:bg-green-800"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 
                      className="font-bold text-green-800"
                      {...longPressProps}
                    >
                      {term.term}
                    </h3>
                    <div 
                      className="prose prose-sm max-w-none text-sm text-gray-700 mt-1"
                      {...longPressProps}
                    >
                      <ReactMarkdown>{term.definition}</ReactMarkdown>
                    </div>
                    <div className="absolute right-1 top-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        className="p-1 rounded hover:bg-green-100"
                        onClick={() => startEditingTerm(term)}
                        title="Edit term"
                      >
                        <Pencil className="h-3 w-3 text-green-600" />
                      </button>
                      <button 
                        className="p-1 rounded hover:bg-red-100"
                        onClick={() => setSelectedTerm(term)}
                        title="Delete term"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
      
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

