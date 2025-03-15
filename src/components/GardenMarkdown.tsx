import ReactMarkdown from "react-markdown";
import { GlossaryTerm } from "./GlossaryPanel";
import { remarkGlossarySyntax, remarkTaskSyntax } from "@/utils/remarkPlugins";

export const MarkdownRenderer = ({ content, isUser }: { content: string, isUser: boolean }) => {
    if (isUser) {
      return (
        <div className="text-white whitespace-pre-wrap">
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    const components = {
      p: ({children}) => <p className="mb-2">{children}</p>,
      h1: ({children}) => <h1 className="text-xl font-bold mb-2 text-green-700">{children}</h1>,
      h2: ({children}) => <h2 className="text-lg font-bold mb-2 text-green-700">{children}</h2>,
      h3: ({children}) => <h3 className="text-md font-bold mb-2 text-green-700">{children}</h3>,
      ul: ({children}) => <ul className="list-disc ml-5 mb-2">{children}</ul>,
      ol: ({children}) => <ol className="list-decimal ml-5 mb-2">{children}</ol>,
      li: ({children}) => <li className="mb-1">{children}</li>,
      a: ({href, children}) => <a href={href} className="underline text-green-600 hover:opacity-80">{children}</a>,
      code: ({className, children}) => {
        const isMultiline = className?.includes("language-");
        if (isMultiline) {
          return <code className="block p-2 rounded my-2 font-mono text-sm bg-green-100 text-green-800">{children}</code>;
        }
        return <code className="px-1 py-0.5 rounded bg-green-100 text-green-800">{children}</code>;
      },
      blockquote: ({children}) => <blockquote className="border-l-4 pl-4 italic my-2 border-green-300">{children}</blockquote>,
      hr: () => <hr className="my-2 border-green-200" />,
      
      glossaryTerm: ({ node }: any) => {
        console.log("Rendering glossaryTerm component:", node);
        const term = node.value;
        setTimeout(() => addToGlossary(term), 0);
        return (
          <span 
            className="glossary-term bg-green-100 px-1 rounded cursor-pointer hover:bg-green-200 transition-colors inline-flex items-center"
            title="Click to view in glossary"
            onClick={() => {
              document.getElementById("glossary-panel-trigger")?.click();
            }}
          >
            <BookOpen className="inline-block h-3 w-3 mr-1" />
            {term}
          </span>
        );
      },
      taskItem: ({ node }: any) => {
        console.log("Rendering taskItem component:", node);
        const task = node.value;
        setTimeout(() => addToTasks(task), 0);
        return (
          <span 
            className="task-item bg-yellow-100 px-1 rounded cursor-pointer hover:bg-yellow-200 transition-colors inline-flex items-center"
            title="Click to add to tasks"
            onClick={() => addToTasks(task)}
          >
            <CheckSquare className="inline-block h-3 w-3 mr-1" />
            {task}
          </span>
        );
      }
    };

    return (
        <div className="text-green-800">
          <ReactMarkdown
            remarkPlugins={[remarkGlossarySyntax, remarkTaskSyntax]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    };
  