import { visit } from "unist-util-visit";

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

// Plugin to transform ((text)) into task nodes
export function remarkTaskSyntax() {
  return (tree: any) => {
    visit(tree, "text", (node, index, parent) => {
      // Updated regex to handle multiline content with 's' flag (dotAll)
      const regex = /\(\((.*?)\)\)/gs;
      const matches = [...node.value.matchAll(regex)];
      
      console.log("Task matches:", matches.length > 0 ? matches.map(m => m[1]) : "none");

      if (matches.length > 0 && parent && typeof index === "number") {
        const newChildren = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const [fullMatch, taskText] = match;
          const matchIndex = node.value.indexOf(fullMatch, lastIndex);

          // Keep text before match
          if (matchIndex > lastIndex) {
            newChildren.push({ type: "text", value: node.value.slice(lastIndex, matchIndex) });
          }

          // Insert custom task node using the element type structure
          const taskNode = {
            type: "element",
            tagName: "taskItem",
            properties: {},
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
