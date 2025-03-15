import { visit } from "unist-util-visit";

// Plugin to transform [[text]] into glossary term nodes
export function remarkGlossarySyntax() {
  return (tree: any) => {
    visit(tree, "text", (node, index, parent) => {
      const regex = /\[\[(.*?)\]\]/g;
      const matches = [...node.value.matchAll(regex)];

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

          // Insert custom glossary term node
          newChildren.push({
            type: "glossaryTerm",
            value: termText,
          });

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
      const regex = /\(\((.*?)\)\)/g;
      const matches = [...node.value.matchAll(regex)];

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

          // Insert custom task node
          newChildren.push({
            type: "taskItem",
            value: taskText,
          });

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
