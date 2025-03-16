
import ReactMarkdown from "react-markdown";
import { GlossaryTerm } from "./GlossaryPanel";
import { plugins, components } from "@/utils/remarkPlugins";
import rehypeRaw from 'rehype-raw'
import { useRef, useState, useEffect } from "react";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { BookmarkPlus } from "lucide-react";

export const MarkdownRenderer = ({ content, isUser }: { content: string, isUser: boolean }) => {
    const [selectedText, setSelectedText] = useState("");
    const markdownRef = useRef<HTMLDivElement>(null);
    
    // Handle text selection
    useEffect(() => {
      const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && !isUser) {
          setSelectedText(selection.toString().trim());
        }
      };
      
      document.addEventListener('selectionchange', handleSelection);
      return () => document.removeEventListener('selectionchange', handleSelection);
    }, [isUser]);
    
    // Handle adding advice from selected text
    const handleAddToAdvice = () => {
      if (selectedText) {
        // Dispatch custom event to add the selected text to advice
        window.dispatchEvent(
          new CustomEvent('addAdvice', { 
            detail: { 
              title: selectedText.split(/[.!?]/)[0].substring(0, 50).trim() + (selectedText.length > 50 ? "..." : ""),
              content: selectedText
            }
          })
        );
        
        // Clear selection
        window.getSelection()?.removeAllRanges();
        setSelectedText("");
      }
    };
    
    if (isUser) {
      return (
        <div className="text-white whitespace-pre-wrap">
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    // Every component will receive a node. This is the original Element from hast element being turned into a React element.
    const components1 = {
      span: ({node, children}) => <span>{children}</span>,
      p: ({node, children}) => <p className="mb-2">{children}</p>,
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
      
      ...components
    };

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div ref={markdownRef} className="text-green-800">
            <ReactMarkdown
              remarkPlugins={[...plugins]}
              rehypePlugins={[rehypeRaw]}
              components={components1}
            >
              {content}
            </ReactMarkdown>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {selectedText && (
            <ContextMenuItem 
              onClick={handleAddToAdvice}
              className="flex items-center cursor-pointer"
            >
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Add to Advice
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
};
