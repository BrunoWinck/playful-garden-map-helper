import ReactMarkdown from "react-markdown";
import { GlossaryTerm } from "./GlossaryPanel";
import { plugins, components } from "@/utils/remarkPlugins";
import rehypeRaw from 'rehype-raw'

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

    // Every component will receive a node. This is the original Element from hast element being turned into a React element.


    const components1 = {
      span: ({node, children}) => <span >{children}</span>,
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
        <div className="text-green-800">
          <ReactMarkdown
            remarkPlugins={[ ...plugins]}
            rehypePlugins={[rehypeRaw /* essential to have the HTML custom-component conveyed to output as elements */]}
            components={components1}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    };
  