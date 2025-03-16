import { visit } from "unist-util-visit";
import React from "react";
import { BookOpen, CheckSquare } from "lucide-react";
import { supabase, ANONYMOUS_USER_ID, ANONYMOUS_USER_NAME } from "@/integrations/supabase/client";

const addToGlossary = (term: string) => {
  try {
    window.dispatchEvent( new CustomEvent('addToGlossary', { detail: { term } }));
    /*
    const storedTerms = localStorage.getItem('glossary-terms');
    const terms: GlossaryTerm[] = storedTerms ? JSON.parse(storedTerms) : [];
    
    if (terms.some(t => t.term.toLowerCase() === term.toLowerCase())) {
      return;
    }
    
    const newTerm: GlossaryTerm = {
      id: crypto.randomUUID(),
      term: term,
      definition: `Add your definition for "${term}" here.`,
      created_at: new Date().toISOString()
    };
    
    terms.push(newTerm);
    localStorage.setItem('glossary-terms', JSON.stringify(terms));
    
    supabase
      .from('glossary_terms')
      .insert({
        term: term,
        definition: `Add your definition for "${term}" here.`,
        user_id: ANONYMOUS_USER_ID
      })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save glossary term to database:", error);
        }
      });
    toast.success(`Added "${term}" to your gardening glossary`, {
      action: {
        label: "View Glossary",
        onClick: () => {
          document.getElementById("glossary-panel-trigger")?.click();
        }
      }
    });
    */
  } catch (error) {
    console.error("Error adding term to glossary:", error);
  }
};

const addToTasks = (task: string, timing: string) => {
  try {
    window.dispatchEvent( new CustomEvent('addTask', { detail: { task, timing } }));
  } catch (error) {
    console.error("Error adding task:", error);
  }
};

// Plugin to transform [[text]] into glossary term nodes
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

// Plugin to transform ((text)) or ((text | timing)) into task nodes
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
  const term = node.children[0].value;
  return (
    <span 
      className="glossary-term bg-green-100 px-1 rounded cursor-pointer hover:bg-green-200 transition-colors inline-flex items-center"
      title="Click to view in glossary"
      onClick={() => {
        addToGlossary(term);
        // document.getElementById("glossary-panel-trigger")?.click();
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
