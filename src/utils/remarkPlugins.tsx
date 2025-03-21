import { visit } from "unist-util-visit";
import React from "react";
import { BookOpen, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";

const generateDefinition = async (term: string): Promise<string> => {
  try {
    // Make a request to the glossary-definition edge function
    const { data, error } = await supabase.functions.invoke('glossary-definition', {
      body: { term }
    });

    if (error) throw error;
    
    if (data && data.success && data.definition) {
      return data.definition;
    }
    
    return `Add your definition for "${term}" here.`;
  } catch (error) {
    console.error("Error generating definition:", error);
    return `Add your definition for "${term}" here.`;
  }
};

const addToGlossary = async (term: string, userId: string) => {
  try {
    console.log("Adding to glossary:", term);
    
    // Generate a definition using AI
    const definition = await generateDefinition(term);
    
    // Create and dispatch a custom event with the term and the AI-generated definition
    const glossaryEvent = new CustomEvent('addToGlossary', { 
      detail: { 
        term: term,
        definition: definition
      } 
    });
    
    window.dispatchEvent(glossaryEvent);
    
    // Activate glossary tab
    const glossaryTabEvent = new CustomEvent('activateGlossaryTab', {
      detail: { term }
    });
    
    window.dispatchEvent(glossaryTabEvent);
    
    // Show toast
    toast.success(`Added "${term}" to your gardening glossary`, {
      action: {
        label: "View Glossary",
        onClick: () => {
          document.getElementById("glossary-panel-trigger")?.click();
        }
      }
    });
  } catch (error) {
    console.error("Error adding term to glossary:", error);
  }
};

const addToTasks = (task: string, timing: string) => {
  try {
    console.log("Adding task:", task, "Timing:", timing);
    window.dispatchEvent(new CustomEvent('addTask', { detail: { task, timing } }));
  } catch (error) {
    console.error("Error adding task:", error);
  }
};

function remarkGlossarySyntax() {
  return (tree: any) => {
    visit(tree, "text", (node, index, parent) => {
      const regex = /\[\[(.*?)\]\]/gs;
      const matches = [...node.value.matchAll(regex)];
      
      if (matches.length > 0 && parent && typeof index === "number") {
        const newChildren = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const [fullMatch, termText] = match;
          const matchIndex = node.value.indexOf(fullMatch, lastIndex);

          if (matchIndex > lastIndex) {
            newChildren.push({ type: "text", value: node.value.slice(lastIndex, matchIndex) });
          }

          const glossaryNode = {
            type : "html",
            value: `<glossary-term>`
          };
          
          newChildren.push(glossaryNode);
          newChildren.push({
            type : "text",
            value: termText.trim()
          });
          newChildren.push({
            type : "html",
            value: `</glossary-term>`
          });

          lastIndex = matchIndex + fullMatch.length;
        });

        if (lastIndex < node.value.length) {
          newChildren.push({ type: "text", value: node.value.slice(lastIndex) });
        }

        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}

function remarkTaskSyntax() {
  return (tree: any) => {
    visit(tree, "text", (node, index, parent) => {
      const regex = /\(\((.*?)(?:\|(.*?))?\)\)/gs;
      const matches = [...node.value.matchAll(regex)];
      
      if (matches.length > 0 && parent && typeof index === "number") {
        const newChildren = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const [fullMatch, taskText, timingText] = match;
          const matchIndex = node.value.indexOf(fullMatch, lastIndex);

          if (matchIndex > lastIndex) {
            newChildren.push({ type: "text", value: node.value.slice(lastIndex, matchIndex) });
          }

          const taskNode = {
            type: "html",
            value: `<task-item ${timingText?`timing="${timingText.trim()}"`:""}/>`
          };
          
          newChildren.push(taskNode);
          newChildren.push({ type: "text", value: taskText.trim()});
          newChildren.push({ type: "html", value: "</task-item>"});

          lastIndex = matchIndex + fullMatch.length;
        });

        if (lastIndex < node.value.length) {
          newChildren.push({ type: "text", value: node.value.slice(lastIndex) });
        }

        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}

export const plugins = [
  remarkGlossarySyntax,
  remarkTaskSyntax
];

function GlossaryTerm({ node }: any) {
  const { currentUser } = useProfile();
  const userId = currentUser?.id || "00000000-0000-0000-0000-000000000000";
  const term = node.children[0].value;
  
  return (
    <span 
      className="glossary-term bg-green-100 px-1 rounded cursor-pointer hover:bg-green-200 transition-colors inline-flex items-center"
      title="Click to view in glossary"
      onClick={() => {
        addToGlossary(term, userId);
      }}
    >
      <BookOpen className="inline-block h-3 w-3 mr-1" />
      {term}
    </span>
  );
}

function TaskItem({ node }: any) {
  const task = node.children[0].value;
  const timing = node.properties?.timing;
  return (
    <span 
      className="task-item bg-yellow-100 px-1 rounded cursor-pointer hover:bg-yellow-200 transition-colors inline-flex items-center"
      title="Click to add to tasks"
      onClick={() => addToTasks(task, timing)}
    >
      <CheckSquare className="inline-block h-3 w-3 mr-1" />
      {task}
    </span>
  );
}

export const components = {
  "glossary-term": GlossaryTerm,
  "task-item": TaskItem
};

