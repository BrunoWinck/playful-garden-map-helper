import { visit } from "unist-util-visit";

const addToGlossary = (term: string) => {
  try {
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
  } catch (error) {
    console.error("Error adding term to glossary:", error);
  }
};

const addToTasks = (task: string) => {
  try {
    const storedTasks = localStorage.getItem('garden-tasks');
    const tasks: {id: string, text: string, completed: boolean, createdAt: string}[] = 
      storedTasks ? JSON.parse(storedTasks) : [];
    
    if (tasks.some(t => t.text.toLowerCase() === task.toLowerCase())) {
      return;
    }
    
    const newTask = {
      id: crypto.randomUUID(),
      text: task,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    localStorage.setItem('garden-tasks', JSON.stringify(tasks));
    
    supabase
      .from('patch_tasks')
      .insert({
        task: task,
        user_id: ANONYMOUS_USER_ID,
        patch_id: "general"
      })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save task to database:", error);
        }
      });
    
    toast.success(`Added "${task}" to your garden tasks`, {
      action: {
        label: "View Tasks",
        onClick: () => {
        }
      }
    });
  } catch (error) {
    console.error("Error adding task:", error);
  }
};

// Plugin to transform [[text]] into glossary term nodes
export function remarkGlossarySyntax() {
  return (tree: any) => {
    visit(tree, "text", (node, index, parent) => {
      // Updated regex to handle multiline content with 's' flag (dotAll)
      const regex = /\[\[(.*?)\]\]/gs;
      const matches = [...node.value.matchAll(regex)];
      
      console.log("Glossary matches:", matches.length > 0 ? matches.map(m => m[1]) : "none");

      if (matches.length > 0 && parent && typeof index === "number") {
        const newChildren = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const [fullMatch, termText] = match;
          const matchIndex = node.value.indexOf(fullMatch, lastIndex);

          // Keep text before match
          if (matchIndex > lastIndex) {
            newChildren.push({ type: "text", value: node.value.slice(lastIndex, matchIndex) });
          }

          // Insert custom glossary term node using the element type structure
          const glossaryNode = {
            type: "element",
            tagName: "glossaryTerm",
            properties: {},
            children: [{ type: "text", value: termText.trim() }]
          };
          
          console.log("Pushing glossaryTerm node:", glossaryNode);
          newChildren.push(glossaryNode);

          lastIndex = matchIndex + fullMatch.length;
        });

        // Keep any remaining text after the last match
        if (lastIndex < node.value.length) {
          newChildren.push({ type: "text", value: node.value.slice(lastIndex) });
        }

        // Replace the original text node with new children
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}

// Plugin to transform ((text)) or ((text | timing)) into task nodes
export function remarkTaskSyntax() {
  return (tree: any) => {
    visit(tree, "text", (node, index, parent) => {
      // Updated regex to handle multiline content with 's' flag (dotAll)
      // Also handle optional timing information after a pipe character
      const regex = /\(\((.*?)(?:\|(.*?))?\)\)/gs;
      const matches = [...node.value.matchAll(regex)];
      
      console.log("Task matches:", matches.length > 0 ? matches.map(m => [m[1], m[2]]) : "none");

      if (matches.length > 0 && parent && typeof index === "number") {
        const newChildren = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const [fullMatch, taskText, timingText] = match;
          const matchIndex = node.value.indexOf(fullMatch, lastIndex);

          // Keep text before match
          if (matchIndex > lastIndex) {
            newChildren.push({ type: "text", value: node.value.slice(lastIndex, matchIndex) });
          }

          // Insert custom task node using the element type structure
          const taskNode = {
            type: "element",
            tagName: "taskItem",
            properties: {
              timing: timingText ? timingText.trim() : undefined
            },
            children: [{ type: "text", value: taskText.trim() }]
          };
          
          console.log("Pushing taskItem node:", taskNode);
          newChildren.push(taskNode);

          lastIndex = matchIndex + fullMatch.length;
        });

        // Keep any remaining text after the last match
        if (lastIndex < node.value.length) {
          newChildren.push({ type: "text", value: node.value.slice(lastIndex) });
        }

        // Replace the original text node with new children
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}
