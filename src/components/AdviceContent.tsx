import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, X, Pencil } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLongPress } from "@/utils/useLongPress";
import { useProfile } from "@/contexts/ProfileContext";

interface GardenAdvice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  source?: string;
}

export const AdviceContent: React.FC = () => {
  const { currentUser } = useProfile();
  const userId = currentUser?.id || "00000000-0000-0000-0000-000000000000";
  
  const [advices, setAdvices] = useState<GardenAdvice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAddingAdvice, setIsAddingAdvice] = useState(false);
  const [selectedAdvice, setSelectedAdvice] = useState<GardenAdvice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingAdvice, setEditingAdvice] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedSource, setEditedSource] = useState("");
  const [newSource, setNewSource] = useState("Manual Entry");

  useEffect(() => {
    const fetchAdvices = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('garden_advice')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setAdvices(data);
        } else {
          const defaultAdvices = [
            {
              id: "1",
              title: "Watering Succulents",
              content: "Water succulents only when the soil is completely dry. Overwatering can lead to root rot, which is the most common cause of succulent death.",
              created_at: new Date().toISOString(),
              source: "Garden Advisor"
            },
            {
              id: "2",
              title: "Using Coffee Grounds",
              content: "Coffee grounds can be added to compost or directly to soil for acid-loving plants like azaleas and blueberries. They add nitrogen and improve soil structure.",
              created_at: new Date(Date.now() - 86400000).toISOString(),
              source: "Garden Advisor"
            }
          ];
          
          setAdvices(defaultAdvices);
          
          for (const advice of defaultAdvices) {
            await supabase.from('garden_advice').insert({
              title: advice.title,
              content: advice.content,
              source: advice.source,
              user_id: userId
            });
          }
        }
      } catch (error) {
        console.error("Error fetching garden advice:", error);
        
        const storedAdvice = localStorage.getItem('garden-advice');
        if (storedAdvice) {
          setAdvices(JSON.parse(storedAdvice));
        } else {
          setAdvices([
            {
              id: "1",
              title: "Watering Succulents",
              content: "Water succulents only when the soil is completely dry. Overwatering can lead to root rot, which is the most common cause of succulent death.",
              created_at: new Date().toISOString(),
              source: "Garden Advisor"
            },
            {
              id: "2",
              title: "Using Coffee Grounds",
              content: "Coffee grounds can be added to compost or directly to soil for acid-loving plants like azaleas and blueberries. They add nitrogen and improve soil structure.",
              created_at: new Date(Date.now() - 86400000).toISOString(),
              source: "Garden Advisor"
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchAdvices();
    }
  }, [userId, currentUser]);

  useEffect(() => {
    if (advices.length > 0 && !isLoading) {
      localStorage.setItem('garden-advice', JSON.stringify(advices));
    }
  }, [advices, isLoading]);

  async function addAdvice(title: string, content: string, source: string = "Selected Text") {
    const adviceObject = {
      title: title.trim(),
      content: content.trim(),
      source
    };

    try {
      const { data, error } = await supabase
        .from('garden_advice')
        .insert({
          ...adviceObject,
          user_id: userId
        })
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setAdvices(prev => [data, ...prev]);
        toast.success(`Added advice: "${title}"`);
      }
    } catch (error) {
      console.error("Error adding advice:", error);
      
      const newAdviceObject: GardenAdvice = {
        id: Date.now().toString(),
        ...adviceObject,
        created_at: new Date().toISOString()
      };
      
      setAdvices(prev => [newAdviceObject, ...prev]);
      toast.success(`Added advice: "${title}"`);
    }
  }

  useEffect(() => {
    const handleAddAdviceEvent = (e: CustomEvent) => {
      const { title, content } = e.detail;
      addAdvice(title, content, "Garden Advisor");
    };

    window.addEventListener('addAdvice', handleAddAdviceEvent as EventListener);
    return () => window.removeEventListener('addAdvice', handleAddAdviceEvent as EventListener);
  }, []);

  const handleAddAdvice = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Both title and content are required.");
      return;
    }

    await addAdvice(newTitle, newContent, newSource);
    
    setNewTitle("");
    setNewContent("");
    setIsAddingAdvice(false);
  };

  const handleDeleteAdvice = async () => {
    if (!selectedAdvice) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('garden_advice')
        .delete()
        .eq('id', selectedAdvice.id);
        
      if (error) throw error;
      
      setAdvices(prev => prev.filter(advice => advice.id !== selectedAdvice.id));
      toast.success(`Deleted advice: "${selectedAdvice.title}"`);
    } catch (error) {
      console.error("Error deleting advice:", error);
      
      setAdvices(prev => prev.filter(advice => advice.id !== selectedAdvice.id));
      toast.success(`Deleted advice: "${selectedAdvice.title}"`);
    } finally {
      setSelectedAdvice(null);
      setIsDeleting(false);
    }
  };

  const startEditingAdvice = (advice: GardenAdvice) => {
    setEditingAdvice(advice.id);
    setEditedTitle(advice.title);
    setEditedContent(advice.content);
    setEditedSource(advice.source || "");
  };

  const cancelEditing = () => {
    setEditingAdvice(null);
    setEditedTitle("");
    setEditedContent("");
    setEditedSource("");
  };

  const saveEditedAdvice = async (adviceId: string) => {
    if (!editedTitle.trim() || !editedContent.trim()) {
      toast.error("Both title and content are required.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('garden_advice')
        .update({
          title: editedTitle.trim(),
          content: editedContent.trim(),
          source: editedSource.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', adviceId);
        
      if (error) throw error;
      
      setAdvices(prev => prev.map(advice => 
        advice.id === adviceId 
          ? { 
              ...advice, 
              title: editedTitle.trim(), 
              content: editedContent.trim(),
              source: editedSource.trim()
            } 
          : advice
      ));
      
      toast.success(`Updated advice: "${editedTitle}"`);
    } catch (error) {
      console.error("Error updating advice:", error);
      
      setAdvices(prev => prev.map(advice => 
        advice.id === adviceId 
          ? { 
              ...advice, 
              title: editedTitle.trim(), 
              content: editedContent.trim(),
              source: editedSource.trim()
            } 
          : advice
      ));
      
      toast.success(`Updated advice: "${editedTitle}"`);
    } finally {
      cancelEditing();
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
        <Drawer open={isAddingAdvice} onOpenChange={setIsAddingAdvice}>
          <DrawerTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-800" 
              title="Save Advice"
            >
              <Plus className="h-4 w-4" />
              Save Advice
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-4">
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-lg font-medium">Save Gardening Advice</h3>
              <div className="space-y-2">
                <label htmlFor="advice-title" className="text-sm font-medium">Title</label>
                <Input 
                  id="advice-title" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="e.g., Best Time to Prune Roses"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="advice-content" className="text-sm font-medium">Content</label>
                <Textarea 
                  id="advice-content" 
                  value={newContent} 
                  onChange={(e) => setNewContent(e.target.value)} 
                  placeholder="Paste or write gardening advice here..."
                  className="min-h-[150px]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="advice-source" className="text-sm font-medium">Source</label>
                <Input 
                  id="advice-source" 
                  value={newSource} 
                  onChange={(e) => setNewSource(e.target.value)} 
                  placeholder="Where did this advice come from?"
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
                  onClick={handleAddAdvice}
                  disabled={!newTitle.trim() || !newContent.trim()}
                >
                  <Save className="h-4 w-4" />
                  Save Advice
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {advices.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No gardening advice saved yet.</p>
              <p className="text-sm">Select text from Garden Advisor responses and click + to save, or use the Save Advice button.</p>
            </div>
          ) : (
            advices.map((advice) => {
              const longPressProps = useLongPress({
                onLongPress: () => startEditingAdvice(advice)
              });

              return (
                <div 
                  key={advice.id} 
                  className="bg-white rounded-lg p-4 shadow-sm border border-green-100 relative group"
                >
                  {editingAdvice === advice.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="font-medium text-green-800"
                        autoFocus
                      />
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="text-sm text-gray-700 min-h-[120px]"
                      />
                      <Input
                        value={editedSource}
                        onChange={(e) => setEditedSource(e.target.value)}
                        className="text-sm text-gray-700"
                        placeholder="Source"
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
                          onClick={() => saveEditedAdvice(advice.id)}
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
                        className="font-medium text-green-800 mb-2"
                        {...longPressProps}
                      >
                        {advice.title}
                      </h3>
                      <p 
                        className="text-sm text-gray-700"
                        {...longPressProps}
                      >
                        {advice.content}
                      </p>
                      {advice.source && (
                        <div className="text-xs text-gray-500 mt-3">
                          Source: {advice.source}
                        </div>
                      )}
                      <div className="absolute right-2 top-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          className="p-1 rounded hover:bg-green-100"
                          onClick={() => startEditingAdvice(advice)}
                          title="Edit advice"
                        >
                          <Pencil className="h-3 w-3 text-green-600" />
                        </button>
                        <button 
                          className="p-1 rounded hover:bg-red-100"
                          onClick={() => setSelectedAdvice(advice)}
                          title="Delete advice"
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
      </ScrollArea>
      
      {selectedAdvice && (
        <Drawer open={!!selectedAdvice} onOpenChange={(open) => !open && setSelectedAdvice(null)}>
          <DrawerContent className="p-4">
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-lg font-medium">Delete Advice</h3>
              <p>Are you sure you want to delete "{selectedAdvice.title}"?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedAdvice(null)} className="gap-1">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAdvice}
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
